# Universal Property Intelligence | Public Read-Only Hardening EXECUTION Receipt

UTC execution date: **2026-10-11**. Operation approved explicitly by operator. Scope: ONLY Supabase project **Universal Property Intelligence** `fwtchbsebygwifmmqhur`, table `public.distressed_properties`, retaining public listing reads, denying public writes, enabling RLS, preserving service-role backend permissions. No other production system changed.

## Exact migration and rollback
- Successful Supabase migration: **20261011191007** / `hpi_distressed_properties_public_readonly_20261011`.
- Source exact SQL (reviewed prior to production approval): `ops/security/hpi_distressed_properties_public_readonly_DRAFT_20261011.sql`, blob SHA `5a7f590d4039d2c409c3e3b61b8b44e142e7cfef`. The SQL file was drafted before the approval; it was expressly authorized by the operator and **executed** on this date. The historic `DRAFT` filename and comments indicate its origin, not its current execution status.
- Exact reviewed break-glass rollback: `ops/security/hpi_distressed_properties_public_readonly_ROLLBACK_DRAFT_20261011.sql`, blob SHA `233ff3e7ac8a18a19afdb0ea146fcb9526976405`. IMPORTANT: this returns insecure anonymous ALL privileges if run and needs separate incident approval. Prefer a corrective migration over reopening public writes.
- Migration applies REVOKE ALL privileges for `anon`, `authenticated`; GRANT SELECT only for each; ALTER TABLE ENABLE ROW LEVEL SECURITY; creates only one PERMISSIVE policy `hpi_public_listing_readonly_20261011`, `FOR SELECT TO anon,authenticated USING (true)`; does not edit or delete any rows.

## Original state preserved BEFORE change
- Table owner: `postgres`; RLS disabled, no table policies, 15 records.
- `anon` and `authenticated`: table privileges `DELETE INSERT MAINTAIN REFERENCES SELECT TRIGGER TRUNCATE UPDATE` (all).
- `service_role`: same 8 privileges. No PUBLIC privilege in catalog ACLs.
- No dependent SQL view identified, and no stored function containing the table name found.
- Public listing fields include property details and agent contact details; operator expressly opted for PUBLIC READ-ONLY visibility.
- Native backup evidence: user's third copied Supabase Physical Restore list indicated 2026-10-11 04:16:41 UTC; its assignment to Property Intelligence is INFERRED from the requested-project order, not independently associated to an API backup ID. Restore is NOT tested; Storage API object contents are NOT included in physical DB backups.

## Independent LIVE post-migration tests (same project ID)
- Migration API returned `success:true`; history shows `20261011191007` exactly.
- `pg_class.relrowsecurity=TRUE`.
- `pg_policies`: exactly one policy `hpi_public_listing_readonly_20261011`, command SELECT, roles `anon, authenticated`, `qual=true`, no write policies.
- `has_table_privilege` for `anon`: SELECT=TRUE; INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN=FALSE.
- `has_table_privilege` for `authenticated`: SELECT=TRUE; INSERT, UPDATE, DELETE, TRUNCATE=FALSE. `pg_catalog.aclexplode` independently confirms SELECT is its *only* grant.
- `has_table_privilege` for `service_role`: SELECT, INSERT, UPDATE, DELETE=TRUE, all eight original ACL privileges preserved.
- **Separate database role simulations** each ran within `BEGIN READ ONLY; SET LOCAL ROLE anon/authenticated; SELECT count(*) ...; ROLLBACK`: each returned **15 visible listings**. No insert or update test performed in production because privilege/policy and role tests suffice without modifying real records.
- Total row count **15 before and after**.
- Supabase Security Advisor after change reports NO `rls_disabled_in_public` ERROR; it contains INFO `rls_enabled_no_policy` on 18 unrelated tables already deny-by-default. No other tables or project schemas modified.

## Open validation and recovery gates
- Actual PostgREST HTTP and consumer-website clickthrough not independently tested. Public SELECT through PostgreSQL role passed.
- No whole-database physical restore or separately encrypted Storage-object recovery drill was run, and no new backup created in this operation.
- Break-glass rollback (if required) should be executed only after a failure is reproduced, with a narrow incident approval. It would restore an insecure privilege state. Prefer corrected access configuration instead.
- Verify next native physical backup is newer than the migration timestamp, and review object storage backups separately.
- The repo `Strategic-Minds-AI/X1-OPERATING-SYSTEMS` PR #15 remains a DRAFT, no merge to `main` and no X1 or Property website deployment performed.
- This record is copied to authorized local JARVIS receipt directory for a second copy of ACL/policy metadata and rollback pointers. No credentials or sensitive property rows copied.

**VERIFIED:** public reads and backend privileges retained, public writes denied, RLS policy enabled, advisor clear on this table, 15 records unchanged.
**NOT VERIFIED:** physical restoration, property client clickthrough, Storage objects backup, project-identified provider backup ID.
