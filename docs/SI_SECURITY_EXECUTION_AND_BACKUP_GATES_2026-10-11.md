# Strategic Intelligence | Approved security execution + backup gates
UTC date: 2026-10-11

## Operator approval
Operator approved the scoped ten-table Strategic Intelligence security hardening and requested backup-aware broader X1 hardening. This receipt records **only actions actually executed**, not blanket permission for all production environments.

## LIVE MIGRATION EXECUTED / VERIFIED
**Provider:** Supabase. **Project:** Strategic Intelligence \`jadlpbokfdkonvnfxjzs\`.
**Migration:** \`20261011173110\` / \`si_emergency_revoke_anon_ten_tables_20261011\`.
**Source:** \`ops/security/si_anon_guard_20261011.sql\`.
**Rollback:** \`ops/security/si_anon_guard_rollback_20261011.sql\`. Restoring the former anonymous access is INSECURE and would need an incident-specific decision.
**Remote local recovery copy:** \`C:\_Strategic_Minds_AI_OS\03_Bridge_Receipts\supabase-security\SI_20261011_ACCESS_GUARD_AND_RECOVERY.md\`.

### Exactly what changed
- REVOKE ALL on **anon** for only these ten tables: \`agent_secret\`, \`client_tasks\`, \`ideas\`, \`onboarding_checklist_items\`, \`onboarding_clients\`, \`operator_device\`, \`operator_task\`, \`swarm_runs\`, \`swarm_tasks\`, \`welcome_sequences\`.
- \`agent_secret\` additionally has RLS ENABLED and all **authenticated** table grants REVOKED. It had zero rows at audit. No RLS allow policies exist, so standard user roles are deny-by-default; service_role unaffected.
- All ten originally had explicit anon, authenticated and service_role ALL grants, no policies and RLS disabled. Explicit original ACL snapshot is in the rollback SQL, private GitHub and JARVIS receipt.
- **No data inserts, updates, deletes, drops or truncations were performed.**
- No other Supabase project or Vercel/Railway/GitHub production deployment was changed by this DB migration.

### Independent SQL read-back
Post migration all ten report anon SELECT=FALSE, INSERT=FALSE, UPDATE=FALSE, DELETE=FALSE. \`agent_secret\` RLS=TRUE and authenticated SELECT/INSERT=FALSE. All ten still have service_role SELECT=TRUE. Counts before/after are identical:
| Table | Before | After |
|---|---:|---:|
| agent_secret | 0 | 0 |
| client_tasks | 0 | 0 |
| ideas | 0 | 0 |
| onboarding_checklist_items | 0 | 0 |
| onboarding_clients | 2 | 2 |
| operator_device | 0 | 0 |
| operator_task | 0 | 0 |
| swarm_runs | 1 | 1 |
| swarm_tasks | 3 | 3 |
| welcome_sequences | 0 | 0 |

**Caution:** Row counts and SQL grants do NOT prove no application regression. Consumer smoke tests and audit of external clients remain outstanding. The migration intentionally preserves broad authenticated ACLs for the other nine tables to avoid immediate disruptive deny-all until scoped RLS policies are backed by authenticated ownership and backup evidence.

## BACKUP & RECOVERY TRUTH
- **VERIFIED:** all four Supabase projects belong to the Strategic Minds AI organization \`ywfbsrcedfxevyxpfejl\`; Supabase connection reports plan **Pro**.
- **DOCUMENTED SUPABASE CAPABILITY:** Supabase automatically performs daily Pro-plan project backups, generally retains the latest 7 days. Official docs: https://supabase.com/docs/guides/platform/backups
- **NOT VERIFIED:** Actual individual latest successful backup ID/time for these four projects, restore-point age, downloadability, or whether a restore test succeeds. The current Supabase connector does not expose a list-backups or create-backup action. Independent Cloud Browser was redirected to Supabase sign-in; cannot inspect dashboard backups with that session.
- **CONFIGURATION BACKUP VERIFIED:** exact schema/grant baseline, forward SQL, reversal SQL preserved in private GitHub and separate local JARVIS storage.
- **DATA BACKUP NOT CREATED BY THIS OPERATION.** Never call this packet a physical or logical DB dump.
- **OPERATOR ONE-TIME CHECK NEEDED:** open https://supabase.com/dashboard/project/jadlpbokfdkonvnfxjzs/database/backups/scheduled and confirm the latest backup shows successful and a timestamp. Repeat for X1 production, staging and Universal Property Intelligence.
- **NEXT BACKUP TARGET:** provider native daily backups verified; weekly encrypted offsite logical dumps via an authenticated, write-only/secret-safe runtime (never plaintext in GitHub/Drive/chat); periodic restore into an isolated nonproduction environment; retention/recovery targets documented and funded explicitly. Storage API objects require their own backup because DB backup contains metadata but not object bytes.
- **PITR:** optional paid feature needing a compatible compute tier and explicit spend authorization. Do not enable without approval.
- **ENFORCEMENT:** Do not apply the nine remaining RLS deny-all migrations, destructive DDL or data rewrites until a restorable snapshot, dependency canary and rollback strategy are proven.

## NEXT SECURITY ISSUES (NOT MUTATED)
1. Nine named Strategic Intelligence tables remain **RLS disabled** and all nine have broad authenticated CRUD. Their anon privileges are revoked. Populated \`onboarding_clients\`, \`swarm_runs\`, \`swarm_tasks\` have empty created_by; identity-based RLS must be designed, not invented.
2. Five public SECURITY DEFINER functions permit anon EXECUTE. Four return trigger, one \`runtime_user_role()\` returns text. Review exact grants, RPC exposure and trigger dependencies separately; do not blindly revoke or break auth provisioning.
3. Universal Property Intelligence \`fwtchbsebygwifmmqhur\` \`distressed_properties\` is RLS disabled and anon SELECT allowed (15 rows at previous read). Separate scoped security change required.
4. X1 Staging \`uvdkzsbjackpjvpoxtyk\` has 15 broad authenticated policies. Need independently tested tenant isolation before customer traffic.
5. X1 main release provenance and branch protections, two local estate reconciler processes, worker actual lease ownership, Vault/AI spend cap and backup/restore instrumentation remain pending. Use the X1 six-track hardening packet; avoid duplicate scheduler and worker.
6. Real synthetic GPT->existing queue->lease->worker->validator->preview remains unverified, independent of website frontend readiness.

## Stop / rollback contract
If an actual consumer regression emerges after anon privileges were revoked:
- First adapt the consumer to a safe authenticated/server-side endpoint.
- If absolutely required, approve the minimal correct table-specific grant, not blindly restore all ten.
- Broad rollback script is preserved for last-resort incident response only; after rollback re-run Supabase advisor and test grants.
- Do not restore an old whole-database backup just to reverse an ACL change; it could destroy newer customer records.
