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

## Current validation findings

- Native tests: 139 passed, 0 failed; Vite build succeeded on the PR head.
- The Vercel preview is READY and serves `/admin/intelligence` with HTTP 200.
- Read-only API smoke tests against the preview returned `503 NON_STAGING_TARGET` for `/api/x1/agent-config` and `/api/x1/intelligence-scan`. The preview has a Supabase URL configured, but it is not the exact X1 staging origin required by `resolveStagingBinding`. The route correctly fails closed. Do not point it at production or copy production service credentials; the branch preview must be bound to the verified staging URL and staging-only keys before authenticated API tests can pass.
- The staging table was applied to `uvdkzsbjackpjvpoxtyk` and verified: RLS enabled, no policies, and no SELECT privileges for `anon` or `authenticated`; server-side `service_role` retains the required SELECT/INSERT/UPDATE privileges. The no-policy RLS advisor finding is intentional for the server-only access model.
- Local Ollama is online and a live `llama3.1:8b` generation returned `X1_OLLAMA_OK`. The public ngrok bridge on the local machine returns HTTP 401 without credentials; the native X1-to-tunnel authenticated request is not yet verified.
- Live production `robots.txt` still returns `Disallow: /`; `/sitemap.xml` returns 404. Production indexing is not enabled by this change.

## Release gates

1. Merge and build source on `main`; verify production deployment and rollback target.
2. Apply the migration to staging only; run tenant isolation and RLS tests.
3. Configure a server-only GitHub token if needed; test API rate-limit and timeout handling.
4. Add the ingestion panel to the native admin UI and verify desktop/mobile flows.
5. Verify Ollama end-to-end through the existing authenticated X1 server adapter.
6. Keep production autonomous code execution, OAuth MCP writes, and indexing changes gated until their own independent evidence is recorded.
