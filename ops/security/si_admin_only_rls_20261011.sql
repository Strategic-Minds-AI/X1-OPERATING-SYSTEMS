-- SI-2026-10-11-C: nine-table operator-only RLS transition
-- Exact project Strategic Intelligence: jadlpbokfdkonvnfxjzs
-- NOT multi-tenant yet: pending tenant-specific ownership columns and API.
-- Preserve existing ADMIN user access via the reviewed runtime_user_role() SECURITY DEFINER.
-- Preserve existing service_role privileges for server-side automation.
-- No rows created, modified, removed. Unrecognized schema drift fails closed.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DO $do$
DECLARE n text;
DECLARE expected text[] := ARRAY[
 'client_tasks','ideas','onboarding_checklist_items','onboarding_clients',
 'operator_device','operator_task','swarm_runs','swarm_tasks','welcome_sequences'
];
BEGIN
 IF (SELECT count(*) FROM public.profiles p JOIN auth.users u ON u.id=p.id WHERE p.role='admin') <> 1
 THEN RAISE EXCEPTION 'Abort SI RLS: require exactly one existing valid admin'; END IF;
 IF NOT has_function_privilege('authenticated','public.runtime_user_role()','EXECUTE')
 THEN RAISE EXCEPTION 'Abort SI RLS: authenticated operator lookup unavailable'; END IF;
 IF (SELECT count(*) FROM pg_class c JOIN pg_namespace s ON s.oid=c.relnamespace
     WHERE s.nspname='public' AND c.relkind IN ('r','p') AND NOT c.relrowsecurity
       AND c.relname=ANY(expected)) <> 9
 THEN RAISE EXCEPTION 'Abort SI RLS: table inventory changed'; END IF;
 IF (SELECT count(*) FROM pg_policies
     WHERE schemaname='public' AND tablename=ANY(expected)) <> 0
 THEN RAISE EXCEPTION 'Abort SI RLS: existing policy inventory changed'; END IF;
 FOR n IN SELECT unnest(expected)
 LOOP
   EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',n);
   EXECUTE format(
     'CREATE POLICY si_admin_operator_guard_20261011 ON public.%I AS PERMISSIVE FOR ALL TO authenticated USING ((SELECT public.runtime_user_role()) = %L) WITH CHECK ((SELECT public.runtime_user_role()) = %L)',
     n,'admin','admin');
 END LOOP;
END $do$;
COMMIT;
