# ADR-003 — Skybridge execution-boundary decision
Date: 2026-10-22 | Status: ACCEPTED FOR LOCAL STAGING; CLOUD WRITE BLOCKED

Decision: Retain Skybridge as a conversational UI for X1 and reuse the existing JARVIS WSL2 worker fabric and Supabase x1_work_queue. No second control plane, scheduler, credentials manager or public listener.

Why: Skybridge provides the MCP view and tool contracts, while X1 already has leases, receipts and worker execution. ChatGPT-connected OAuth grants are not a backend's delegated OAuth tokens.

Implemented proof:
- Local read-only job submitted to existing backend-fabric inbox. Idempotent repeated request returned same job ID.
- Worker receipt X1MCP-READ-c303cec9f8b8d3c95b79.receipt.json reports PASS exit 0.
- Production NODE_ENV refuses start until actual OAuth/tenant security is installed.
- Cloud planner is read-only, explicitly NOT_PERFORMED. User-specific cloud writes must be implemented through an issuer-validated, tenant-bound gateway with exact provider account IDs.
- GitHub isolated feature branch preserves main.

Limitations and security risks:
- No native OAuth login flow, RLS/tenant evaluation, cloud write adapter or complete autonomous repair.
- Preview-generation static HTML is not a general full-stack website factory.
- GHSA-vfj7-8cjw-p6xm transitive advisory has no published fix at this time.
- Independence: Fault Line plugin independently read the GitHub candidate but returned NOT_VERIFIED, without executing tests; do not self-sign.
- Browser functional pass is local QA, not independent Guardian signoff.

Rollback: Do not merge the GitHub branch. Remove only the versioned local candidate folder if abandoning. No production service changes or queue replay.
