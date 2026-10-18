# X1 | Four-project physical backups and Staging Security Hardening Receipt
Date: 2026-10-11. Operator evidence plus provider-native database read-back.
This receipt contains NO key, token or secret value.

## Supabase access-token installation
- Operator reported installing a Supabase personal access token for future provisioning.
- Token *presence and consumer binding are not independently verified*. We did not read, transmit, rotate, copy or display any token. Existing Supabase connector works via its authorized connection.
- Provisioning, restoration, paid backup options, production release and secrets still require resource-specific approvals and validation.

## All four database physical backup listings
These timestamps originate from operator-copied Supabase Backups dashboard lists. The SI and X1 Production mappings were explicit; the X1 Staging/Property mappings are based on the order previously requested and require project-ID confirmation if used for a destructive restore.
| Existing project | Supabase ref | Latest reported Physical Restore option, UTC | Association |
|---|---|---|---|
| Strategic Intelligence | jadlpbokfdkonvnfxjzs | 2026-10-11 10:21:01 | Explicit from previous operator UI copy |
| X1 AI Hub Staging | uvdkzsbjackpjvpoxtyk | 2026-10-11 13:07:13 | First of latest three copies; inferred from requested order |
| X1 AI Hub Production | vgsmyhqqtkkluhypxyua | 2026-10-11 10:42:56 | Explicit project dashboard link |
| Universal Property Intelligence | fwtchbsebygwifmmqhur | 2026-10-11 04:16:41 | Third of latest three copies; inferred from requested order |

Supabase Pro entitlement independently verified. All four Supabase projects were ACTIVE_HEALTHY on provider reads. Individual backup IDs and restore success not independently available via connected Supabase tool.
**NO RESTORE RUN**. Physical backups exclude Storage API object bytes, which require separate encrypted object backup and restore testing. These snapshots may predate later changes.

## X1 AI Hub STAGING LIVE security change 1
Target: uvdkzsbjackpjvpoxtyk ONLY; not X1 Production or Strategic Intelligence.
Migration: 20261011182105 / x1_staging_control_lockdown_20261011 / SUCCESS.
Exact source: ops/security/x1_staging_control_lockdown_20261011.sql
Exact emergency rollback: ops/security/x1_staging_control_lockdown_rollback_20261011.sql
Source blob SHA: 3421d10eef7b4882fafca3de8597423673110237
Rollback blob SHA: e71d68162e312c214639957bc189fe77b61c9a1f

Preflight: auth.users=0, active X1 tenant memberships=0, pending X1 queue jobs=0, broad authenticated policies=15, anonymous status SELECT policies=3. Existing Edge gateway and authorize functions reference server-side service-role credential names, NOT browser anon key.
Action: remove 15 unrestricted authenticated policies and 3 anonymous status/catalog policies; REVOKE table privileges from anon and authenticated on 15 legacy control-plane tables, preserving service_role grants/policies.
Post-readback: anon SELECT/INSERT false on 15/15; authenticated SELECT/UPDATE false on 15/15; service_role SELECT/INSERT true on 15/15; all 15 RLS enabled; broad auth 0; broad anon 0; service_role policies 15. Supabase migration record exists.
Pre and post 15-table row counts MATCH exactly: agent_profiles=2, handoff_packets=3, missions=1, all other 12 tables=0. Total 6 records unchanged.
Staging durable X1 queue counts remain COMPLETED=39, BLOCKED=16, DEAD_LETTER=20, pending=0. No new users, queue workers, jobs, cron or remote deployment.
Functional limitation: read-back proves SQL effective grants, NOT positive service-role end-to-end job execution; service_role simulated SELECT was blocked by tool safety. Existing Railway preview worker and project-zero-control-plane-preview report ONLINE, but no actual job processing was invoked.

## X1 AI Hub STAGING LIVE security change 2
Migration: 20261011182357 / x1_staging_apex_trigger_search_path_guard_20261011 / SUCCESS.
Forward: ops/security/x1_staging_apex_trigger_search_path_20261011.sql
Rollback: ops/security/x1_staging_apex_trigger_search_path_rollback_20261011.sql
Pinned search_path=pg_catalog,public,pg_temp for THREE existing public APEX trigger functions: apex_validate_agent_task_pass, apex_validate_todo_done, apex_gate_goal_achievement. All still have one trigger. Function code, triggers, grants and rows unchanged.
Supabase Security Advisor no longer reports mutable function search-path warnings; now flags TWO intentionally token-gated anonymous WLE canary SECURITY DEFINER RPCs:
- wle_claim_targeted_canary(p_token text,p_work_id uuid)
- wle_submit_targeted_canary(...)
Both contain hash/token, tenant, lease and time checks. DO NOT blindly revoke: first implement server-side identity path and test independent canary clients. An anonymous call is still a potential attack surface, so hardening is NOT complete.
Three Supabase staging Edge Functions still report ACTIVE.

## Other environments and outstanding risk
- SI: 206/206 public tables have RLS, 9 admin-only policies and the privileged function changes verified in previous receipt. Not full multi-tenant ownership; Auth leaked-password protection warning persists.
- Property Intelligence: public.distressed_properties has 15 records, RLS DISABLED and anon SELECT/INSERT/UPDATE currently TRUE; includes agent contact columns. No production property permissions changed. This is a CRITICAL NEXT security decision: decide whether public listing reads are intended, then apply least-privilege RLS plus denied public writes and independent consumer tests.
- X1 Production: no database mutations by this task; production deployment changes still approval-gated.
- GitHub canonical Strategic-Minds-AI/X1-OPERATING-SYSTEMS main SHA previously 3c2bf4b275bd50b70bf29f248f10ccd5762c229f; not protected and no rulesets. GitHub connector lacks admin ruleset writes; no main merge was made.
- Existing Railway preview and production X1 swarm services report ONLINE/healthy. Not proven consuming live queue.
- Backup restore-to-new-project, PITR purchase, encrypted offsite Storage-object archives and tested restores are NOT done.

## Recovery contract and next action
1. Keep user-verified physical backup dates and this immutable ACL/policy and function snapshot. For staging breakage prefer a targeted reviewed rollback SQL on exact project, **not** a whole-database restore.
2. Perform staging Auth-positive canary with an approved synthetic user/member and provider-native credential reference, negative cross-tenant tests, verified queue lease and distinct independent validation. No duplicate scheduler.
3. In Property Intelligence, preserve the public-facing business contract while closing anonymous mutation and evaluating whether all listings should be visible publicly.
4. Verify a new snapshot POST-migration; separately archive Storage object bytes. Test restore-to-NEW-isolated-project only with scoped approval and known cost.
5. Set main branch protection through authorized GitHub administrator and validate CI enforcement; no unreviewed production deployment.
6. The user-installed PAT has not been accessed or tested directly; continue through the authenticated provider integration.

Status: two staging DDL migrations APPLIED + INDEPENDENT SQL READ-BACK VERIFIED. Restore NOT VERIFIED. Customer-tenant Auth still BLOCKED. No X1 Production deploy or DB edits.
