-- DRAFT ONLY. BREAK-GLASS ROLLBACK of HPI Option A (reopens full public access).
-- Requires separate incident approval; avoid unless tested migration regresses consumers.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DO $preflight$
BEGIN
 IF (SELECT count(*) FROM pg_policies WHERE schemaname='public'
     AND tablename='distressed_properties')<>1
 OR NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public'
     AND tablename='distressed_properties' AND policyname='hpi_public_listing_readonly_20261011')
 THEN RAISE EXCEPTION 'Abort rollback: policy inventory drift'; END IF;
END $preflight$;
DROP POLICY hpi_public_listing_readonly_20261011 ON public.distressed_properties;
ALTER TABLE public.distressed_properties DISABLE ROW LEVEL SECURITY;
GRANT ALL PRIVILEGES ON TABLE public.distressed_properties TO anon, authenticated;
COMMIT;
