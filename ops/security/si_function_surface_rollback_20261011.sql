-- SI-2026-10-11-B BREAK-GLASS ROLLBACK.
-- Reopens anonymous RPC execution; requires separate incident approval.
-- Do not execute as part of a normal deploy.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.runtime_enqueue_entity_job() TO PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.runtime_new_user() TO PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO PUBLIC, anon, authenticated;
-- Original function granted anon explicitly, but NOT PUBLIC.
GRANT EXECUTE ON FUNCTION public.runtime_user_role() TO anon;
ALTER FUNCTION public.set_updated_at() RESET search_path;
ALTER FUNCTION public.runtime_set_updated() RESET search_path;
ALTER FUNCTION public.runtime_filter_sql(text,jsonb) RESET search_path;
COMMIT;
