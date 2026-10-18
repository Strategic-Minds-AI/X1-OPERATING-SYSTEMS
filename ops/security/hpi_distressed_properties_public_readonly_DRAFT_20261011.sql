-- DRAFT ONLY, NOT APPLIED. Separate PRODUCTION PROPERTY security approval REQUIRED.
-- Universal Property Intelligence: fwtchbsebygwifmmqhur.
-- OPTION A: existing real estate listings remain PUBLIC READ-ONLY.
-- This intentionally leaves public listing/contact fields readable. If listings
-- are meant to be private, DO NOT execute this migration; use a private mode.
-- Target public.distressed_properties; 15 records and auth.users=0 at audit.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DO $preflight$
BEGIN
 IF (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relname='distressed_properties'
        AND c.relkind IN ('r','p') AND NOT c.relrowsecurity)<>1
 THEN RAISE EXCEPTION 'Abort HPI: table state or target mismatch'; END IF;
 IF (SELECT count(*) FROM pg_policies WHERE schemaname='public'
      AND tablename='distressed_properties')<>0
 THEN RAISE EXCEPTION 'Abort HPI: unreviewed preexisting RLS policies'; END IF;
 IF NOT has_table_privilege('anon','public.distressed_properties','SELECT')
    OR NOT has_table_privilege('service_role','public.distressed_properties','SELECT')
 THEN RAISE EXCEPTION 'Abort HPI: unexpected public or worker grants'; END IF;
END $preflight$;
REVOKE ALL PRIVILEGES ON TABLE public.distressed_properties FROM anon, authenticated;
GRANT SELECT ON TABLE public.distressed_properties TO anon, authenticated;
ALTER TABLE public.distressed_properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY hpi_public_listing_readonly_20261011
ON public.distressed_properties AS PERMISSIVE
FOR SELECT TO anon,authenticated USING (true);
COMMIT;
