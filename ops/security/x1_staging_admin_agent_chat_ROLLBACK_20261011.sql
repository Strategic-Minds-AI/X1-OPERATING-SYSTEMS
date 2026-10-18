-- BREAK-GLASS ONLY: X1 STAGING uvdkzsbjackpjvpoxtyk.
-- Never delete chat history. This safe rollback disables the server-side
-- PostgREST path while retaining messages for export and review.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
REVOKE SELECT,INSERT ON public.x1_admin_chat_turns FROM service_role;
COMMENT ON TABLE public.x1_admin_chat_turns IS
 'DISABLED BY X1 SAFETY ROLLBACK. Retained for forensic/export review, no active chat writes.';
COMMIT;
