# X1 Operating System | Six-track production hardening packet
Date: 2026-10-11. Mode: **BRANCH DRAFT / SAFE READ ONLY**. NO live security, secret, production deploy, merge, cron, queue or container mutation was authorized by this packet.

## Authoritative source and scope
- Live canonical repo (renamed): \`Strategic-Minds-AI/X1-OPERATING-SYSTEMS\`.
- Approved customer website is visually LOCKED; the specific XPS donor visual reference is \`https://website-launch-engine-xps.vercel.app/\`. Correct independent simpler product is \`https://website-launch-engine.vercel.app/\`; do not confuse them.
- Branch: \`feature/x1-hardening-gates-20261011\`; base \`feature/x1-staging-readonly-api-20261011\` SHA \`d67383e7cdb13536fb55fba9eb0e340f45171025\`, which itself is based on approved frontend source \`d000d2bb9e6e5f383879559f6e2aa280dd138dc2\`.
- Main SHA at read: \`3c2bf4b275bd50b70bf29f248f10ccd5762c229f\`, main GitHub protection flag FALSE at audit.
- X1 Vercel production deployment previously observed from \`feature/x1-staging-readonly-api-20261011\` SHA \`d67383e7cdb13536fb55fba9eb0e340f45171025\`; this is release-provenance drift, NOT endorsement to revert or redeploy.
- Supabase staging: \`uvdkzsbjackpjvpoxtyk\`; production: \`vgsmyhqqtkkluhypxyua\`. Other existing projects: Strategic Intelligence \`jadlpbokfdkonvnfxjzs\`; Property Intelligence \`fwtchbsebygwifmmqhur\`.

## Track 1 | SECURITY: HIGH / VERIFIED EXPOSURE RISK
### Read-only findings
- Strategic Intelligence: 206 public tables, 10 with RLS disabled. **All 10** report anonymous SELECT/INSERT privileges plus authenticated CRUD. The unprotected names: \`agent_secret\`, \`client_tasks\`, \`ideas\`, \`onboarding_checklist_items\`, \`onboarding_clients\`, \`operator_device\`, \`operator_task\`, \`swarm_runs\`, \`swarm_tasks\`, \`welcome_sequences\`. \`agent_secret\` includes an \`encrypted_value\` column (count at time of read: 0); \`onboarding_clients\` contained two rows, \`swarm_tasks\` three. DO NOT retrieve secret values or personal rows for validation. No evidence of actual exfiltration.
- Property Intelligence: \`distressed_properties\` RLS disabled with anon SELECT privilege, count 15 at read time. Customer availability intent and app dependencies unknown; do not revoke without reading consumer contract.
- X1 Staging: all 49 public tables have RLS enabled BUT 15 \`authenticated\` policies broadly grant unrestricted access (qual/with_check \`true\`), including approvals, connector_bindings, missions, leases, schedules, work_items. This is not tenant isolation.
- X1 Production: 66/66 public tables have RLS enabled; no \`authenticated true\` policies found by the same narrow audit. RLS alone does not prove all policy permissions correct.
- Strategic Intelligence: public \`SECURITY DEFINER\` functions with anon EXECUTE include \`handle_new_user\`, \`runtime_enqueue_entity_job\`, \`runtime_new_user\`, \`runtime_user_role\`, \`set_updated_at\`. Some may be internal trigger functions; check owners, grants and dependencies before changing. Security advisor separately flags SECURITY DEFINER access and search_path.
### Proposed remediation (PROTECTED, NOT APPLIED)
1. Preserve schema/grants/policy snapshots and record consumer dependencies. Determine PostgREST exposed schema and grant paths; do not assume privileges prove successful HTTP data access or exfiltration.
2. Stage an isolated DB security migration with RLS enabled for the 11 missing tables, restrict anonymous access to nonpublic data (especially encrypted secrets), move secret storage out of public surface, and provide ownership/tenant-specific policies where needed.
3. Review vulnerable SECURITY DEFINER functions with least-privilege EXECUTE, fixed search_path, and robust checks, but preserve necessary trigger behavior.
4. Replace staging's globally permissive authenticated CRUD policies with service-role backend-only or verified tenant-scoped RLS as appropriate, using an isolated staged schema snapshot first. Review all access consumers and record rollback migration.
5. Validate negative anon reads/writes, invalid roles and cross-tenant requests independently before production.
**STOP CONDITION:** Without exact approved resources, backup, dependency map, RLS test receipts and rollback, apply NOTHING to live DB.

## Track 2 | RELEASE INTEGRITY: VERIFIED DRIFT
- Live X1 production site answered GET / with HTTP 200; /admin/studio with HTTP 200.
- GET /api/x1/health answered 503 (expected fail-closed for preview-only adapter deployed in production); unauthenticated /api/x1/operator-status 401.
- Vercel production was deployed using a development-branch SHA, not \`main\`. The direct frontend still loads. Do not blindly revert or replace it.
- Vercel X1 Supabase integration's server variable names are production-scoped, but their exact target project is not independently authenticated from **redacted** metadata. Preview lacks verified full staging-specific binding. Separate Preview PG variables come from a Railway integration; do not mistake them for X1 staging identity.
**Proposed:** Main/protected release PR with signed operator scope, exact tested SHA, independent receipts, documented rollback deployment ID, production DB ID read-back, and required PR review/status checks. Changes to protection rules/production deploy/settings require scoped approval.
**Branch-code diagnostic:** \`server/x1-hardening-gates.mjs\` exposes pure fail-closed \`assessDatabaseRoute\` and \`assessReleaseCandidate\`. It is not wired to GitHub/Vercel enforcement and never changes release settings.

## Track 3 | SUPERVISOR + EXISTING WORKER RECONCILIATION
- JARVIS local \`sm-control-plane\` healthy HTTP 200. 14 local Docker containers were running.
- Two Docker containers start \`node /runtime-scripts/estate-reconciler.mjs\`: \`9829a1c2601f_sm-estate-reconciler\` (Compose service \`estate-reconciler\`) and \`sm-estate-reconciler\` (Compose service \`orchestrator\`). A separate \`79e158cea803_sm-orchestrator\` runs \`node /runtime/server/worker.mjs\`. This is potential duplicate scheduling, not proof of conflicting leases.
- X1 Staging queue: 39 COMPLETED, 16 BLOCKED, 20 DEAD_LETTER; zero PENDING and zero LEASED at read. No unexpired active X1 task leases; \`x1_worker_heartbeats\` has \`jarvis-local-power-grid-1\` online but sensor-only with no lease requested. Production queue: 3 COMPLETED, 1 DEAD_LETTER, zero current active tenant memberships. No true queue-consumption proof.
- Railway \`x1-swarm-preview\`, \`x1-swarm-production\`, \`project-zero-control-plane-preview\` online; this is process health, not job dispatch proof.
- APEX staging workers offline. Do not activate duplicate workers to address this without determining authoritative identity.
**Proposed:** Inventory heartbeat/lease behavior and process owners; reconcile to **one** existing authoritative supervisor, maintain one queue and one five-minute schedule. Prove lease acquire, renewal, expiry, idempotency and competing worker rejection using one safe synthetic test. Stop/restart only with scoped explicit approval.

## Track 4 | AUTHENTICATED INTEGRATION
- The live staging-only serverless endpoints and earlier tests exist in PR #14. Staging Auth/tenant membership has **zero** rows at read time.
- \`/api/x1/operator-status\` requires a verified Supabase user, ACTIVE tenant membership and privileged role. This is read-only status, not worker dispatch.
- Worker/service Vercel preview binding and provider-native credential movement remain unproven. Never copy redacted secrets into files, chat or logs.
**Proposed:** Verify exact Vercel Preview/X1 Staging identity through provider reference. Scope one synthetic tenant operator in staging through approved Auth identity controls; run positive and negative Auth->tenant->queue read. Do not expose service keys to \`VITE_*\` or \`NEXT_PUBLIC_*\`.
**STOP CONDITION:** credential/reference write or Auth permission change is PROTECTED and needs a scoped approval packet.

## Track 5 | INDEPENDENT QA
- CI for frontend SHA d673... previously SUCCESS: 31 total Node tests and desktop/mobile Chromium checks; prior backend canary SHA 8b99... SUCCESS in separate runner with synthetic deterministic CRM source, 14 browser interactions and artifact hashes.
- Visual Studio currently has zero \`fetch()\` calls in inspected component, so browser demo is not a real queue client.
- Continue using real independent validation, exact SHA, tenant identity, approved synthetic spend cap, screenshot sizes 1440x900 and 390x844, immutable source hash, distinct builder/validator, rollback proof.
**Proposed:** use new \`assessPreviewCanary\` pure diagnostic; independently run new tests via GitHub CI. A mocked PASS is not a real canary; a real queue->lease->worker->artifact->QA proof remains a separate prerequisite.

## Track 6 | MONITORING + RECOVERY
- Reuse existing X1 heartbeat. No new cron, scheduler or worker activation.
- Create bounded operating contract: alert if heartbeat older than 10 minutes, mismatched provider binding, 0 confirmed active worker lease when a job is pending, repeat dead letters, two supervisors claiming same lease scope, unexpectedly elevated AI spending, missing proof.
- Budget and metrics are required before **paid** model execution. Synthetic-no-spend mode only in this branch; any real spend approval separate.
- Preserve previous deployment, DB backup/restore plan, frozen source SHA and documented rollback, failure fingerprints and incident receipts.
**Proposed:** \`assessMonitoring\` is a pure diagnostic. Wire to existing operator dashboard only after external authentication, tenant isolation and a reviewed release.

## QA and acceptance report
- Branch-only pure JavaScript module plus Node tests for all six tracks. Node tests validate **policy logic on synthetic inputs**, not live database/worker health.
- All live resources are unchanged by branch writes.
- Next: run GitHub Actions on exact branch SHA, fetch independent results, and test Vercel Preview routes; do not assume CI SUCCESS proves production readiness.

## Protected action packets needed later
A. **SI-SECURITY**: repair named 10 Strategic Intelligence tables + validated function restrictions. Need snapshot, consumer compatibility and RLS rollback; separate from X1 deployment.
B. **PROPERTY-SECURITY**: decide whether distressed_properties contains public-safe data, then scope a safe restricted read policy and restore.
C. **X1-ENV**: bind ONLY exact X1 staging project to exact Vercel Preview target through managed references, no production overwrite.
D. **X1-AUTH**: provision synthetic staging user/tenant membership, no real customer; verify negative cross-tenant.
E. **X1-RUNTIME**: reconcile duplicate reconciler identities only after lease evidence and approved affected container(s).
F. **X1-RELEASE**: operator-approved immutable SHA, prod database identity, rollback deployment and QA gate; never merge/deploy without separate scoped approval.

## Rollback
Revert/remove branch \`feature/x1-hardening-gates-20261011\`; no live data or service has been changed. Keep PR draft; no protected branch merge. Baseline source SHA \`d67383e7cdb13536fb55fba9eb0e340f45171025\` and frontend source SHA \`d000d2bb9e6e5f383879559f6e2aa280dd138dc2\`.
