# X1 Visual Studio | Multi-sandbox autonomous coding architecture
Date: 2026-10-11 | Status: ARCHITECTURE SPEC, NOT DEPLOYED

## Source truth
X1 private repo branch feature/canonical-os-convergence-20261011, AGENTS.md: reuse ONE existing X1 queue, no duplicate worker, scheduler, or supervisor. Synthetic previews cannot authorize production. Its src/mission.mjs defines a typed DRAFT mission; src/providers.mjs reports providers bound:false. This frontend feature lives in another branch. Integration requires a reviewed branch merge, not replacing the original X1 OS with visual-only source.

## Runtime map
User voice/chat -> Vercel admin frontend (server-authenticated when connected) -> tenant-scoped X1 API -> existing Supabase queue/leases/receipt ledger -> existing Railway supervisor -> Vercel Sandbox per mission (or authorized equivalent isolated VM) -> AI Gateway coding agent -> unique GitHub branch and worktree -> dev server/live preview -> Xtreme Cloud Browser screenshots and click-path QA -> independent validation -> reviewable PR + signed receipts -> operator approval.

The existing X1 supervisor is the only lease owner. Client browser / ChatGPT tab never needs to stay open for a properly scheduled task.

## Multi-sandbox state machine
REQUESTED -> ALLOCATING -> READY -> WORKING -> PREVIEW_READY -> VALIDATING -> REVIEW_REQUIRED -> APPROVED_PREVIEW or NEEDS_CHANGES -> STOPPED.
Exceptional states: BLOCKED, RETRY_WAIT, EXPIRED, CANCELLED, FAILED, QUARANTINED.

One sandbox has unique sandbox_id, server-derived tenant_id, mission_id, source_sha, GitHub branch, lease_owner, lease_expiration, resource budget, allowed network hosts, agent permissions, activity checkpoint, assigned reviewer and evidence bundle.
- No production secrets in generated code or in frontend VITE_ environment variables.
- Ephemeral read/write filesystem, quotas on CPU/memory/time/tokens/network and provider spend; deny access to production database and outside tenant context.
- Use server-side short-lived credentials for only approved scopes, never global GitHub tokens in agents.
- Signed short-lived preview URLs with CSP/iframe and origin restrictions. Browser preview must not be able to send requests to the control plane with privileged credentials.
- Vercel Sandbox SDK can run commands and create snapshots. Provider docs indicate snapshot stops the sandbox; resume creates a fresh sandbox/lease from saved state.
- Browser QA uses separate test account/context from project’s real client sessions.

## Parallel execution and merge
Planner decomposes scope to bounded DAG, e.g. A research -> B design -> C code -> D browser QA -> E security + visual validation. Independent B and C can run in separate sandbox branches at common base SHA. Changes merge only after diff/conflict resolution and receipt-based code review.
Night run scope includes allowed repos/branches, maxConcurrency, maxCostCents, maxTokens, maxComputeMinutes, maxRepairAttempts, stopAt and permitted action classes. Queue tasks beyond quota stay WAITING, no unmanaged explosions.

## Suggested typed server APIs (future, no live endpoints in Vite)
POST /api/x1/studio/missions/draft: invoke existing draftMission with verified tenant, repo, source SHA, user prompt and acceptance criteria; no billable work.
POST /api/x1/studio/missions/:id/approve-preview-scope: owner-scoped consent receipt.
POST /api/x1/studio/missions/:id/dispatch: current X1 supervisor checks scope/budget/idempotency.
GET /api/x1/studio/missions/:id: verified state and receipts.
GET /api/x1/studio/missions/:id/events?after=SEQ: replayable SSE with cursor and dedup.
POST /api/x1/studio/missions/:id/pause, /resume, /cancel.
GET /api/x1/studio/sandboxes: tenant-isolated sandbox registry.
POST /api/x1/studio/sandboxes/:id/command: allowlisted sandbox commands and lease check.
GET /api/x1/studio/sandboxes/:id/preview: signed nonproduction preview URL.
GET /api/x1/studio/sandboxes/:id/files: authorized file tree.
POST /api/x1/studio/visual/patch: source-located CSS/text/component edits with code SHA.
GET /api/x1/studio/missions/:id/artifacts: signed screenshot/test/trace assets.
POST /api/x1/studio/releases/:id/request: protected action requiring separate operator approval.

## Event envelope
event_id: UUID, sequence: monotonic bigint, tenant_id: verified from server, mission_id, sandbox_id, source_sha, occurred_at: ISO timestamp, event_type, status, payload_redacted. Recommended types mission.created / agent.step / file.changed / preview.ready / validation.failed / receipt.issued / approval.required / mission.blocked.
SSE/WebSocket is transport only; Supabase append-only event log is durable truth. UI reconnects with after=cursor. Never display agent-generated prose as authoritative status.

## Recommended Supabase schema (NOT a migration)
studio_projects: project_id, tenant_id, repo, base_sha, creator, created_at.
studio_missions: mission_id, tenant_id, project_id, source_sha, prompt, status, budget_cents, approval_scope, idempotency_key UNIQUE.
studio_sandboxes: sandbox_id, mission_id, tenant_id, vm_provider, vm_id, branch, base_sha, status, lease_owner, lease_until, expires_at, version.
studio_agent_runs: agent_run_id, tenant_id, sandbox_id, role, checkpoint_ref, status, cost_cents, attempts.
studio_events: event_id, tenant_id, mission_id, sandbox_id, seq, type, redacted_payload, timestamp, UNIQUE(mission_id,seq).
studio_artifacts: artifact_id, tenant_id, mission_id, kind, private_key, sha256, content_type, version.
studio_patches: patch_id, tenant_id, mission_id, source_sha, component_file, source_locator, changes, approval_state.
studio_approvals: approval_id, tenant_id, mission_id, actor_id, action, scope, status, expiry, receipt_hash.
Prefer REUSE/EXTENSION of actual X1 tables over creating these tables. All roles/tenants require RLS and server verification; client cannot select authoritative tenant_id.

## Agent tool allowlist
readProject / listFiles / readFile / searchCode / applyPatchInSandbox / runTests / runLinter / startPreview / screenshot / compareVisualDiff / inspectErrors / proposePR / appendReceipt. Tool calls must have bounded duration, resource cap, lease and replay id.
Do not expose direct model tools for production DB, default-branch merge, live DNS, secrets, customer emails/SMS, payments, RLS bypass, public release or self-approving QA.

## Recovery / 24-hour resilience
Existing X1 5-minute heartbeat may reconcile queue and expired leases, but must be verified rather than blindly duplicated. Long-running Railway workers process checked-out tasks, persisting checkpoint after each step. Resume after process death by verifying lease and source SHA. Retry transient errors with bounded exponential backoff; stop on authorization faults, budget exhaustion, tenant breach or protected action.
Orphan sandbox reaper snapshots permitted state, revokes credentials, stops VM, emits receipt and alerts operator. Every morning digest includes PR URLs, screenshot evidence, tests run, costs, blockers and what specifically DID NOT run.

## Acceptance gates
Backend contract requires actual X1 source/queue/role discovery; server auth and tenant RLS; real VM allocation in sandbox environment; GitHub branch+sha receipts; durable replay after browser closes; simulated failure recovery; independent 1440x900 and 390x844 screenshots; production approvals remain explicit.
**Current frontend implementation satisfies visual/draft UI only.** Real sandbox/overnight agent bridge is UNBOUND.
