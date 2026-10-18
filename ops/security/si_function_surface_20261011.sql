-- Security remediation SI-2026-10-11-B
-- Target EXACTLY Supabase Strategic Intelligence jadlpbokfdkonvnfxjzs
-- Dependency inventory at 2026-10-11: four public SECURITY DEFINER trigger-only
-- functions (auth provisioning, entity enqueue, timestamp), one role lookup RPC.
-- A PostgreSQL trigger invokes its configured function using its trigger owner context;
-- direct HTTP RPC EXECUTE privileges are unnecessary for trigger-only functions.
-- Forward migration changes neither function bodies nor job/data rows.
-- Original grants/search_paths in paired si_function_surface_rollback_20261011.sql
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
DO $$
BEGIN
 IF (
   SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.prosecdef AND p.pronargs=0
     AND p.proname IN ('handle_new_user','runtime_enqueue_entity_job','runtime_new_user','set_updated_at')
     AND pg_get_function_result(p.oid)='trigger'
 ) <> 4
 THEN RAISE EXCEPTION 'SI function inventory drift: expected 4 trigger-only SECURITY DEFINER functions'; END IF;
 IF (
   SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='runtime_user_role' AND p.pronargs=0
     AND p.prosecdef AND pg_get_function_result(p.oid)='text'
 ) <> 1
 THEN RAISE EXCEPTION 'SI role lookup inventory drift'; END IF;
 IF (
   SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname IN ('set_updated_at','runtime_set_updated','runtime_filter_sql')
     AND p.proconfig IS NULL
 ) <> 3
 THEN RAISE EXCEPTION 'SI search_path inventory drift'; END IF;
END $$;
-- Remove unauthenticated and general signed-in direct RPC execution.
-- Do not revoke service_role or postgres rights.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.runtime_enqueue_entity_job() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.runtime_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
-- Keep signed-in users' existing role-lookup functionality while removing anon RPC.
REVOKE ALL ON FUNCTION public.runtime_user_role() FROM anon, PUBLIC;
-- Pin mutable search paths without changing SQL bodies or invoking privileged code.
ALTER FUNCTION public.set_updated_at() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.runtime_set_updated() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.runtime_filter_sql(text,jsonb) SET search_path = pg_catalog, public, pg_temp;
COMMIT;
