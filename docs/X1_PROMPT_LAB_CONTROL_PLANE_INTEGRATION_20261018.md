# X1 Prompt Lab Control-Plane Integration

## Canonical runtime

- `X1-OPERATING-SYSTEMS` is the production application and the source of truth for authenticated admin workflows, tenant isolation, work items, Prompt Lab assets, model calls, and release gates.
- `x1-prompt-lab` is an upstream capability/reference repository while its current bridge, agent workflows, and SDK integrations remain Base44-bound. Do not load its runtime or SDK into the production application.
- The native X1 Prompt Lab, Visual Editor, Coding Kanban, X1 agent chat, and `server/x1-ollama.mjs` remain the native integration points. Ollama requests stay server-side, token-protected, HTTPS-only, bounded, and explicitly configured.
- `ai@thevisioncortex.com` is an operator identity/contact value, not an authentication mechanism. Never authorize work by email string alone; verify the authenticated X1 user and tenant role.

## Native passive intelligence ingestion (this change)

The staging-only `POST /api/x1/intelligence-scan` route discovers public GitHub repositories using bounded GitHub Search API requests and stores normalized repository metadata in `x1_intelligence_ingest`. `GET` returns the latest tenant-scoped records. It does not download repository source, execute code, change repositories, create issues, or dispatch coding work.

- All writes require an authenticated X1 operator with OWNER, ADMIN, or BUILDER role and a verified active tenant.
- The server is pinned to the existing staging Supabase binding and refuses production runtime.
- Upserts are idempotent by `tenant_id, source, external_id`.
- The optional `X1_GITHUB_SCAN_TOKEN` is server-only; without it, public API rate limits may apply.
- Repository descriptions and metadata are untrusted input. They must never be treated as instructions, secrets, or executable code.
- The SQL migration in `ops/security/x1_intelligence_ingest_staging_20261018.sql` is a proposed staging migration. It is not automatically applied by this PR.

## Why the existing local bridge is not a production integration

The upstream `x1-prompt-lab` local bridge currently accepts shell command strings and sends them to Node's `exec`. Its bridge client posts command results without a cryptographic request signature. It also relies on Base44 entities/functions for queueing and status. Do not connect this bridge directly to production X1 or reuse it as an autonomous worker.

Before any coding-worker execution is enabled, replace that mechanism with an isolated worker protocol: signed short-lived task leases, a narrow allowlisted operation schema, ephemeral per-task worktrees/containers, no production secrets, bounded network/filesystem access, idempotency, immutable source SHAs, kill switch, and independent validation receipts. Start with read-only scans and preview-only patches.

## Release gates

1. Merge and build source on `main`; verify production deployment and rollback target.
2. Apply the migration to staging only; run tenant isolation and RLS tests.
3. Configure a server-only GitHub token if needed; test API rate-limit and timeout handling.
4. Add the ingestion panel to the native admin UI and verify desktop/mobile flows.
5. Verify Ollama end-to-end through the existing authenticated X1 server adapter.
6. Keep production autonomous code execution, OAuth MCP writes, and indexing changes gated until their own independent evidence is recorded.
