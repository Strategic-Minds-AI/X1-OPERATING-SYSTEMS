# HPI Distressed Properties | Production public-read-only access change

Date: 2026-10-11. Scope explicitly authorized by operator: public SELECT remains, public INSERT/UPDATE/DELETE/TRUNCATE and other writes denied, RLS enabled, only public.distressed_properties in Supabase Universal Property Intelligence fwtchbsebygwifmmqhur.

## Recovery evidence BEFORE migration

- Existing Supabase Pro organization: ywfbsrcedfxevyxpfejl, project ACTIVE_HEALTHY (confirmed via connected provider).
- Operator-provided physical Restore listing: 2026-10-11 04:16:41 UTC, inferred as Property Intelligence because it was the third of three copied lists following the requested order. No independently retrieved backup ID or completed restore test. A listed backup does not include Storage API object bytes.
- Exact table before change: public.distressed_properties, owner postgres, RLS=false, FORCE RLS=false, rows=15, zero pg_policies and zero dependent SQL views identified. 34 columns include public property description/location and agent contact fields; operator explicitly approved PUBLIC listing visibility.
- Effective grants before change: anon=ALL 8 table privileges (SELECT,INSERT,UPDATE,DELETE,TRUNCATE,TRIGGER,REFERENCES,MAINTAIN). authenticated=ALL 8. service_role=ALL 8. No PUBLIC table grant was detected by pg_catalog.aclexplode. Server owner postgres unaffected.
- Original table data intentionally not copied to GitHub/chat/JARVIS. Native physical snapshot and SQL rollback cover separate recovery layers; no full logical data backup created by this action.
- Source SQL preapproved in existing draft PR #15: ops/security/hpi_distressed_properties_public_readonly_DRAFT_20261011.sql (blob 5a7f590d4039d2c409c3e3b61b8b44e142e7cfef).
- Reviewed explicit rollback: ops/security/hpi_distressed_properties_public_readonly_ROLLBACK_DRAFT_20261011.sql (blob 233ff3e7ac8a18a19afdb0ea146fcb9526976405). This restores dangerously broad anonymous privilege, should only be used as an emergency break-glass with separate approval. Prefer adapting client code over enabling anonymous public writes again.

## Expected forward change

A single transactional Supabase migration on fwtchbsebygwifmmqhur performs PRECHECK of exact table/no RLS/no policies, revokes anon and authenticated ALL table privileges, regrants SELECT to each, enables RLS, creates exactly one policy hpi_public_listing_readonly_20261011 FOR SELECT TO anon,authenticated USING(true). Leave all service_role privileges and rows unchanged. No Auth users, migrations elsewhere, worker, queue, external publication or costs.

## Mandatory independent post-change checks

- ALTER recorded as one exact migration and Supabase security advisor no longer reports RLS disabled on public.distressed_properties.
- has_table_privilege anon and authenticated SELECT=true; INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN=false; service_role SELECT/INSERT/UPDATE/DELETE=true.
- Simulate SELECT under SET LOCAL ROLE anon and authenticated, using BEGIN READ ONLY and ROLLBACK. Both must read count=15. No destructive write canary needed; verify lack of grants and absence of modifying RLS policies.
- Exact one SELECT RLS policy on table, no INSERT/UPDATE/DELETE policies. Rows still 15. No unrelated Supabase project touched.

## Rollback strategy

If read functionality fails, first independently inspect grants, RLS, PostgREST exposure and client filters. To revert, use exact rollback SQL via scoped incident approval, which returns table to its insecure previous state. Never restore an entire old database to repair a grant unless data recovery itself is required (restoring older DB would discard newer writes). Preserve migration receipt and backup timestamp. A real full restore drill remains separate.
