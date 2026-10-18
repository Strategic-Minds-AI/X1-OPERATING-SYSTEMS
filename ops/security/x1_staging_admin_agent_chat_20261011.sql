-- X1 Operating System | STAGING ONLY uvdkzsbjackpjvpoxtyk
-- Durable human-to-agent transcript events; NOT a work queue or scheduler.
-- No access for anon/authenticated roles. All requests must pass server-side
-- Supabase Auth + active tenant membership checks before using service_role.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DO $preflight$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.x1_tenants WHERE status='ACTIVE') THEN
   RAISE EXCEPTION 'X1_AGENT_STAGING_TENANT_REQUIRED';
 END IF;
 IF EXISTS(SELECT 1 FROM pg_class WHERE oid=to_regclass('public.x1_admin_chat_turns')) THEN
   RAISE EXCEPTION 'X1_AGENT_CHAT_TABLE_ALREADY_EXISTS';
 END IF;
END $preflight$;

CREATE TABLE public.x1_admin_chat_turns (
 turn_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 tenant_id uuid NOT NULL REFERENCES public.x1_tenants(tenant_id),
 actor_user_id uuid NOT NULL,
 session_id uuid NOT NULL,
 request_id uuid NOT NULL,
 role text NOT NULL CHECK (role IN ('user','assistant')),
 content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 8000),
 model text,
 status text NOT NULL CHECK(status IN ('ACCEPTED','X1_SYNC_ONLY','GPT_PREVIEW_DRAFT')),
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT x1_admin_chat_turn_dedupe UNIQUE(tenant_id,actor_user_id,session_id,request_id,role)
);
CREATE INDEX x1_admin_chat_turn_user_session ON public.x1_admin_chat_turns
 (tenant_id,actor_user_id,session_id,created_at);
ALTER TABLE public.x1_admin_chat_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x1_admin_chat_turns FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.x1_admin_chat_turns FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON public.x1_admin_chat_turns TO service_role;
CREATE POLICY x1_agent_chat_service_only ON public.x1_admin_chat_turns
 FOR ALL TO service_role USING (true) WITH CHECK (true);
COMMENT ON TABLE public.x1_admin_chat_turns IS
 'X1 staging-only operator chat transcript, bounded and server-authenticated. NEVER direct browser access or autonomous job dispatch.';
COMMIT;
