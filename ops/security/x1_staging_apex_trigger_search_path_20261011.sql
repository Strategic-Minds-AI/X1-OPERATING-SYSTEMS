-- X1 AI Hub STAGING ONLY (uvdkzsbjackpjvpoxtyk)
-- NONDESTRUCTIVE search_path hardening of 3 existing public APEX trigger functions.
-- Strict source preflight: all three are trigger functions, have one trigger each,
-- and currently have no function-local search_path. No function logic/body modified.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
DO $preflight$
BEGIN
  IF (SELECT count(*) FROM pg_proc p
      JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public'
      AND p.proname=ANY(ARRAY[
        'apex_validate_agent_task_pass',
        'apex_validate_todo_done',
        'apex_gate_goal_achievement'])
      AND pg_get_function_result(p.oid)='trigger'
      AND p.proconfig IS NULL
      AND (SELECT count(*) FROM pg_trigger t
           WHERE t.tgfoid=p.oid AND NOT t.tgisinternal)=1)<>3
  THEN RAISE EXCEPTION 'Abort X1 staging: APEX trigger-function inventory drift'; END IF;
END $preflight$;
ALTER FUNCTION public.apex_validate_agent_task_pass()
  SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.apex_validate_todo_done()
  SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.apex_gate_goal_achievement()
  SET search_path = pg_catalog, public, pg_temp;
COMMIT;
