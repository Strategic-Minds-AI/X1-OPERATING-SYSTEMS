# X1 Backup, Recovery and Release Protection
2026-10-11 | Verified and pending evidence register | NO new infrastructure

## Backup evidence by existing Supabase project

| Project | Project ID | Actual snapshot evidence | Restore test |
|---|---|---|---|
| Strategic Intelligence | jadlpbokfdkonvnfxjzs | User-supplied Supabase Physical Restore list: latest 2026-10-11 10:21:01 UTC; dates October 4 through 11 listed | NOT TESTED |
| X1 AI Hub Staging | uvdkzsbjackpjvpoxtyk | Not verified for this project | NOT TESTED |
| X1 AI Hub Production | vgsmyhqqtkkluhypxyua | Not verified for this project | NOT TESTED |
| Universal Property Intelligence | fwtchbsebygwifmmqhur | Not verified for this project | NOT TESTED |

All four belong to Supabase Pro organization ywfbsrcedfxevyxpfejl, for which automatic daily backups are documented. This proves entitlement, not existence or success of each actual backup. Source: https://supabase.com/docs/guides/platform/backups . Supabase dashboard routes:
- https://supabase.com/dashboard/project/jadlpbokfdkonvnfxjzs/database/backups/scheduled
- https://supabase.com/dashboard/project/uvdkzsbjackpjvpoxtyk/database/backups/scheduled
- https://supabase.com/dashboard/project/vgsmyhqqtkkluhypxyua/database/backups/scheduled
- https://supabase.com/dashboard/project/fwtchbsebygwifmmqhur/database/backups/scheduled

Critical: database backups include Storage metadata, not Storage object bytes. No storage-media backup or actual restore has been verified. SI last reported backup predates all three SI migrations on October 11. Restore-to-new-project would be a separate potentially paid and protected action.

## Completed Strategic Intelligence remediation (LIVE)
- Initial patch at version 20261011173110: revoke all anonymous table privileges from 10 public tables, enable RLS and remove authenticated privileges on empty agent_secret.
- Privileged function patch at version 20261011180420: anonymous EXECUTE removed from five SECURITY DEFINER functions, authenticated direct EXECUTE removed from four trigger-only functions, fixed search_path on three functions, service_role preserved.
- Third patch: nine RLS policies restricted to existing platform-admin role; no rows modified, service_role retained. Database Auth has one user and one corresponding admin profile. A test with authenticated role but NO JWT saw zero onboarding rows; a simulated existing admin role saw two onboarding and three swarm records. This is interim admin-only access, not per-customer tenant-scoped security.
- Current provider security advisor no longer reports anonymous privileged-function exposure, mutable search paths or public tables without RLS. Remaining WARN: authenticated runtime_user_role SECURITY DEFINER, Auth leaked-password protection disabled. Changes to Auth account controls require separate provider-level policy and validation.
- Forward and emergency rollback SQL reside in private ops/security folder. The rollback SQL is NOT automatically executed because it deliberately reopens old risky grants.

## X1 Staging migration drafted, NOT APPLIED
- Forward: ops/security/x1_staging_control_lockdown_20261011.sql
- Reverse: ops/security/x1_staging_control_lockdown_rollback_20261011.sql
- Target is only Supabase staging uvdkzsbjackpjvpoxtyk. Preflight checks zero auth users and active memberships, exactly 15 unrestricted authenticated policies and 3 anon status/read policies, service_role access.
- Forward removes direct anon/authenticated access from 15 legacy control-plane tables and drops their permissive policies, while retaining existing service_role access and policies. No worker, cron, queue or schema object is added.
- BLOCKED until staging provider-specific backup evidence and consumer compatibility test. These legacy control-plane tables lack tenant-id; long-term tenant isolation requires a scoped schema and Auth-validated API migration, not a new global admin grant.

## Recovery procedure
1. Identify exact project ID, env, incident time, last good application SHA and rollback deployment ID. Freeze unsafe new external work but preserve append-only receipts.
2. Confirm provider-native recovery point; do not infer backup success from plan subscription. Record row counts, grants/policies, migrations, Auth and Storage object recovery locations.
3. For a permissions or RLS regression, prefer a bounded down migration with independent positive/negative access testing. Whole-DB restoration may discard valid writes since the selected backup.
4. For irreparable data corruption, prepare restore-to-NEW-isolated-project only after cost approval. Test restored Auth, tenant RLS, object storage (separate archive), worker lease uniqueness, application routes and audit receipts.
5. Cut over Production only with separately approved target identity and immutable SHA. Keep the previous database and Vercel deployment recoverable until validated.
6. Use the ONE existing five-minute X1 heartbeat for future backup-age and error monitoring. No additional scheduler or worker should be provisioned.
7. Plan a provider-native daily backup review, offsite encrypted server-side logical archive using secret-safe references, a retention policy and a periodic TEST RESTORE. NONE of these extra backup jobs have been activated.

## Production release protections
- Canonical repo: Strategic-Minds-AI/X1-OPERATING-SYSTEMS. As audited, main SHA 3c2bf4b275bd50b70bf29f248f10ccd5762c229f and GitHub branch protection FALSE, zero rulesets.
- X1 production Vercel deployment traced to feature SHA d67383e7cdb13536fb55fba9eb0e340f45171025. Visual frontend still reachable; the preview-only API /api/x1/health returns 503 in production.
- Existing frontend GitHub QA workflow has been updated ONLY on isolated development branch to also run for main pushes and ops/security changes. This is CI coverage, NOT an enforced branch policy.
- Desired actual GitHub main ruleset: PR-only merges, one independent review, required exact-SHA QA and security checks, no bypass/force push/delete, signed approval and rollback receipt. Current GitHub connection has no branch-administration write tool; ruleset creation NOT EXECUTED.
- Protect Vercel production releases after independently verifying main SHA, source branch, required CI/Guardian status, database binding and previous deployment rollback. Do not promote/revert current production based only on READY.
- Remain approval-gated: production deploy, DNS, secret rotation, production DB schema changes, paid PITR/restore project, customer outreach/social publication.

## Next safe gate
Obtain specific latest backup date/status from X1 Staging, X1 AI Hub Production, and Property Intelligence. Then validate and apply staging-only lockdown; test one authenticated synthetic tenant via existing API; design owner-assignment migration for customer roles; independent release and restore verification.
