-- X1 AI Hub STAGING ONLY (uvdkzsbjackpjvpoxtyk)
-- Emergency rollback of ONLY three function-level search_path options.
-- Preserve all three trigger bodies, grants, data and other security migrations.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
DO $guard$
BEGIN
  IF (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND p.proname=ANY(ARRAY[
        'apex_validate_agent_task_pass','apex_validate_todo_done','apex_gate_goal_achievement'])
      AND p.proconfig IS NOT NULL)<>3
  THEN RAISE EXCEPTION 'Abort rollback: unexpected search-path state'; END IF;
END $guard$;
ALTER FUNCTION public.apex_validate_agent_task_pass() RESET search_path;
ALTER FUNCTION public.apex_validate_todo_done() RESET search_path;
ALTER FUNCTION public.apex_gate_goal_achievement() RESET search_path;
COMMIT;
