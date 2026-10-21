# X1 System Factory — Live Queue Triage (2026-10-21)

**Alignment status: BLOCKED.** Read-only inspection; no queue replay or production actions.

Source project: Supabase `uvdkzsbjackpjvpoxtyk` / `public.x1_work_queue`.
Counts verified now: **96 total** = 59 COMPLETED + 17 BLOCKED + 20 DEAD_LETTER.
Failure classes: CONTROL_PLANE_AUTHORIZATION_FAILED 16; FUTURE_BACKLOG_AWAITING_ADAPTER 7; fetch failed 3; CAPABILITY_BOOTSTRAP_BLOCKED 3; eight other individually classified reasons.
Task leases: FAILED 87; COMPLETED 55; RELEASED 6. Recorded historical leases are not evidence of an active functioning factory lease worker.
Preview heartbeat: `jarvis-local-power-grid-1`, ONLINE at `2026-10-21T07:49:58.969129Z`. A heartbeat is not a released website.
Latest synthetic read-only task `x1.p0.controlled-restoration.readonly-synthetic.20261021` completed, but queue `validation_receipt_id` is null.
Railway `cloudbrowser-control`: 9 services; one explicit `cloudbrowser-engine` replica; staged patch pending. Railway `x1-ai-hub-plan-b` scope denied for current account.
JARVIS remote shell smoke passed, while Docker audit and local directory create/readback timed out; Docker/local folder write are **UNKNOWN**.

## Ordered bounded fixes

1. Inspect worker authentication and token references without disclosing secrets. Reproduce a low-risk authenticated read-only control-plane call, keep evidence.
2. Validate actual lease claim, worker execution, idempotency, ledger receipt and independent receipt readback.
3. Restore missing approved adapter capabilities without changing production.
4. Run one isolated synthetic noindex website canary after environment alignment.
5. Only then execute client discovery and produce 10 ACTUAL rendered desktop/mobile concepts and ask for human design approval.
6. Production/domain purchase/Google writes require exact scoped authorization.

Do not retry the 16 authorization failures as transient events. No duplicate queue, cron or worker.
