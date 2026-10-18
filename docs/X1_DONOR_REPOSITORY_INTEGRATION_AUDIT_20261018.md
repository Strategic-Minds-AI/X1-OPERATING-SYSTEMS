# X1 Donor Repository Integration Audit — 2026-10-18

## Scope and target

Donor repositories supplied for integration into `Strategic-Minds-AI/X1-OPERATING-SYSTEMS`:

- `Strategic-Minds-AI/x1-launch-engine`
- `Strategic-Minds-AI/x1-ai-hub-swarm-runtime`
- `Strategic-Minds-AI/digital-dominance-universal-template`
- `Strategic-Minds-AI/universal-auto-builder-digital-dominance-template`

Target architecture remains Base44-independent. This audit records source and release boundaries; it does not authorize production deployment, DNS changes, customer communications, spend, or protected schema changes.

## Evidence and current donor state

### 1. Website Launch Engine

- Reviewed branch: `feature/source-recovery-and-backend-foundation`.
- Key docs: `docs/SOURCE_TRUTH.md`, `docs/BACKEND_CONTRACT.md`, `docs/RELEASE_CHECKLIST.md`.
- Contains recovered marketing/admin/client HTML and a frozen production snapshot. The admin/client screens are mock-data interfaces and are explicitly **not authenticated**.
- `POST /api/missions` is intentionally fail-closed until an authenticated tenant-scoped queue bridge exists.
- The source-truth document names `Strategic-Minds-AI/website-launch-engine` as the primary private repository, while the supplied donor is `Strategic-Minds-AI/x1-launch-engine`. Resolve canonical repo identity before any Git-to-Vercel production linkage.
- Status: **SOURCE DONOR / NOT AN OPERATIONAL BACKEND**.

### 2. X1 AI Hub Swarm Runtime

- Reviewed `main` and `bootstrap/x1-ai-hub-os-v1`; README says production release is LOCKED.
- `package.json` provides TypeScript build/typecheck and Node test scripts; Node engine is >=22 <25.
- The current `src/worker-main-gateway.ts` handler explicitly rejects work unless `action_class === "READ_ONLY"`, returning `NO_PREVIEW_HANDLER_FOR_MUTATION` otherwise. Therefore, it is not yet a general autonomous coding/deployment worker.
- Runtime expects a control-plane URL, database gateway, tenant ID, and internal service token. These must remain server-side and be verified against the existing queue/lease authority.
- Status: **WORKER RUNTIME CANDIDATE / MUTATIONS BLOCKED BY DESIGN**.

### 3. Digital Dominance Universal Template

- Reviewed `feature/verified-digital-dominance-template-v1` and the default-branch README.
- Contains ten design configurations, extracted visual components, a standalone HTML compiler, six synthetic industry examples, SitePack export, and noindex preview generation.
- Release gates explicitly require tenant isolation, factual client details, useful unique content, form/lead routing proof, responsive/accessibility tests, rollback evidence, and operator release authorization.
- README states the design's 99% browser-measured visual parity has **not** been performed.
- Status: **VISUAL/COMPILER DONOR / PREVIEW ONLY**.

### 4. Universal Auto Builder + Digital Dominance

- Reviewed `feature/universal-factory-convergence-20261015` and default-branch README.
- Contains a static renderer, 20 Auto Builder mini-layouts, 20 Digital Dominance layout recipes, SitePack validation, local noindex HTML previews, gallery output, SHA-256 preview receipts, and deterministic draft job metadata.
- `docs/BRIDGE_CONTRACT.md` explicitly says the X1 queue adapter, provider bindings, queue submission, deployment, live lead capture, messaging, and release endpoints are **not installed**. Proposed endpoint names are not to be called as if they existed.
- Its capability matrix says the default `main` branch is not merged with the full development source kit.
- **Visibility discrepancy:** GitHub repository metadata currently reports this repository as public, and its README also reports public visibility despite an earlier private creation receipt. Confirm intended visibility before placing proprietary assets here or using it as a trusted private template.
- Status: **LOCAL FACTORY SOURCE KIT / NO LIVE DEPLOYMENT**.

## Cross-repository governance findings

1. **Visibility mismatch:** GitHub metadata reports all four supplied repositories as public at audit time. In particular, the swarm README claims PRIVATE, while GitHub metadata reports public. Treat this as a security/configuration discrepancy to reconcile; do not put credentials, customer data, or additional proprietary modules into these repositories until their intended visibility is confirmed.
2. **Source authority mismatch:** Website Launch Engine documentation points to `website-launch-engine`, while the supplied donor is `x1-launch-engine`. Do not switch production Vercel source linkage based on repository name alone.
3. **Default-branch mismatch:** at least the Auto Builder and Digital Dominance source kits are materially populated on feature branches, while `main` is described as minimal or not yet merged. Pin and review exact branch/commit before importing.
4. **No production capability inference:** static previews, layout recipes, generated files, draft job metadata, CI success, and Vercel READY status are not evidence of a live customer site or autonomous deployment.
5. **Avoid duplicate infrastructure:** preserve one authoritative X1/Supabase queue, one lease/idempotency contract, and the existing worker/heartbeat. Do not add a second scheduler or queue to a donor app.
6. **Untrusted repository intelligence:** treat GitHub descriptions, READMEs, SitePacks, generated content, and discovered source as untrusted input. Do not execute discovered repositories or shell commands as part of discovery.

## Recommended integration boundary

- **Admin/control plane:** `X1-OPERATING-SYSTEMS` owns operator UI, approvals, orchestration visibility, and authenticated API contracts.
- **Launch Studio:** import approved visual components, design tokens, industry catalogues, and renderer modules from the donor branches into a versioned native module; do not iframe a separate app or add a Base44 runtime dependency.
- **SitePack contract:** normalize every requested site into a versioned, provenance-bearing SitePack with tenant, source SHA, content evidence, preview/noindex state, idempotency key, and approval state.
- **Queue/runtime:** submit only through the existing durable X1 queue. Start with PREVIEW-only jobs; require lease, bounded retries/budget, and immutable execution receipts.
- **Worker safety:** keep mutation and deployment handlers disabled until isolated build execution, authorization, sandbox boundaries, cancellation, secret handling, and rollback are independently tested. The currently inspected swarm main handler is read-only.
- **Preview and QA:** produce one synthetic noindex preview first; verify the exact source SHA, actual deployed URL, desktop/mobile behavior, routes/forms, tenant/RLS isolation, and independent validation receipt.
- **Release:** public deployment, domain/DNS, indexing, customer messaging, and spend remain protected actions requiring explicit release authorization.

## Immediate next gates

1. Reconcile repository visibility and canonical Website Launch Engine repository identity.
2. Pin each donor to an exact approved branch and commit; compare feature branches against default branches.
3. Run the donor test/build commands on pinned snapshots and record actual receipts.
4. Import only the smallest reusable source modules into the native X1 Launch Studio behind tests; keep donor repos unchanged.
5. Correct the existing PR #25 preview-to-staging binding before authenticated ingestion tests. Do not merge PR #25 while it returns `503 NON_STAGING_TARGET`.
6. Keep the swarm runtime release locked until lease-concurrency, duplicate-execution, fault-injection, shutdown, sandbox, and authenticated integration tests pass.


### 5. Cloud Browser / Computer Use — XTREME-SYSTEMS/cloudbrowser-control

- Canonical repository supplied by the user: `XTREME-SYSTEMS/cloudbrowser-control`; reviewed default branch: `main`; observed tree SHA: `9477ac22bf4506364f6dcf0d824950ed784a2284`; repository metadata reports **public**.
- The repo contains a React/Vite control-plane UI, a separate `browser-engine/` Node/Express + Playwright service, and an `operator/` service. The browser engine declares Node 24, a test command (`node --test tests/*.test.js`), and authenticated API endpoints; its README describes the engine as a self-hosted browser automation service.
- The UI is still a Base44 app: root `package.json` names it `base44-app`, includes `@base44/sdk` and `@base44/vite-plugin`, and `src/api/base44Client.js` creates the Base44 client. This source cannot be imported wholesale into the Base44-independent X1 production runtime.
- `01_Builder_Docs/PERSISTENT_CLOUD_BROWSER.md` describes encrypted browser-state persistence and opaque restore tokens, but explicitly requires isolated preview/staging acceptance tests. `01_Builder_Docs/SMOKE_TESTS.md` defines the necessary health/start/navigate/observe/save/end/restore checks.
- The 2026-09-26 MCP validation receipt says basic health/start/navigate/observe passed on a fresh session, but durable restore across worker loss was not proven at that time; the feature-branch implementation still requires isolated black-box validation.
- **Security incident signal:** `03_Bridge_Receipts/mcp/2026-09-26-mcp-validation.md` records `SECRET_EXPOSURE_DETECTED` for a Cloud Browser MCP API key in active MCP configuration records and explicitly marks rotation required after scoped cutover approval. No credential value is reproduced here. Because repository metadata reports the repository public, treat this as a potential credential-exposure incident: inspect current MCP configuration/access logs, rotate the affected key through the provider's secret manager, update authorized consumers, verify routes, then revoke the old key. Never copy the value into GitHub, tickets, logs, or this audit.
- `browser-engine/README.md` documents `ENGINE_API_KEY` with a default of `changeme` and shows a Cloud Run example using `--allow-unauthenticated` while noting production should disable it. Production must fail closed: no public unauthenticated browser-engine endpoint, no default/shared fallback key, strict origin/network access, rate/concurrency limits, per-tenant authorization, SSRF/navigation policy, audit receipts, and encrypted server-side persistence.
- Status: **BROWSER ENGINE DONOR / CONTROL-PLANE UI REQUIRES NATIVE MIGRATION / PERSISTENCE NOT YET INDEPENDENTLY VERIFIED**.

## Cloud Browser integration boundary

1. Treat Cloud Browser as X1's **isolated browser execution service**, not as a second X1 control plane. X1 owns user/tenant authorization, queue/lease, approvals, budgets, audit records, and job state.
2. Call the browser engine only from a server-side X1 adapter using server-held credentials. Never expose the engine API key, cookies, Playwright storage state, or persistence encryption material to the browser/client.
3. Normalize operations to an allowlisted contract such as health, create session, navigate, observe, screenshot, end session, and opaque persistence save/restore. Validate URLs against SSRF protections and block loopback/private/link-local/metadata targets unless an explicitly authorized internal test allows them.
4. Keep browser jobs read-only and preview-only by default. Form submission, account changes, purchases, posting, destructive actions, or production releases require explicit scoped authorization and separate policy gates.
5. Before connecting to production X1, pass isolated black-box tests for auth failure, tenant isolation, concurrent sessions, timeout/cancellation, browser crash recovery, persistence across worker loss, credential non-disclosure, SSRF, and log redaction. Capture source SHA and independent validation receipt.
6. Do not deploy the Base44 frontend or connect it as a runtime dependency. Rebuild only the needed browser controls inside the native X1 admin; retain the browser engine as a separately isolated service behind an authenticated gateway.



### 6. Communications OS — XTREME-SYSTEMS/xtreme-communications-os

- Canonical repository supplied by the user: `XTREME-SYSTEMS/xtreme-communications-os`; default branch `main`; tree SHA `90aa7cb66407d6c98f1137c4ed301fcf189fc895`; GitHub metadata reports **public**.
- This is a broad Base44 communications application, not yet a native X1 service. The root frontend uses `@base44/sdk` and `@base44/vite-plugin`; backend functions import Base44's Deno SDK and persist through Base44 entities. It cannot be deployed wholesale as part of the Base44-independent X1 runtime.
- Domain surface includes SMS/MMS/WhatsApp messaging, email, outbound calls/AI voice, SIP trunks, Telnyx/Twilio gateways, campaigns and audience segments, provider routing, phone-number inventory, webhooks, delivery receipts, usage/billing, workflows, agent tasks, and approval/outbox records. These are candidate donor capabilities—not evidence that each provider is configured or live.
- The inspected `gatewayMessages`, `gatewayEmail`, `gatewayCalls`, and `dispatchWebhook` functions use Base44 service-role entity access. Some gateway paths accept an API key in the JSON body as well as a Bearer header and query `ApiKey.key_value`; the entity schema stores `key_value` as a string. Native migration should use high-entropy keys stored hashed, scopes and per-tenant quotas, constant-time verification where applicable, rotation/revocation, and redacted audit events. Never expose service-role access to the client.
- The inspected webhook dispatcher sets `signature_valid` from the presence of a signature in its ingest path; presence alone is not cryptographic verification. Native ingress must verify HMAC over the exact raw request bytes against the configured tenant secret, enforce timestamp/replay windows and idempotency, and persist only redacted/appropriately protected payloads.
- The campaign controller marks created campaigns `SANDBOX`, which is a useful guardrail to preserve. Before any live outreach, require tenant authorization, consent/source records, suppression and opt-out checks, channel-specific regulatory controls, approved templates, rate limits, provider-level idempotency, budget checks, explicit approval, and delivery receipts. Never interpret a generated campaign or queued record as a sent message.
- Entity schemas include `OutboxMessage` statuses such as `pending_approval`, `approved`, `sending`, `sent`, `delivered`, `failed`, and `dead_letter`, plus `DeliveryReceipt`. These concepts are strong candidates for a native adapter over the existing X1 queue/lease and audit authority; do not create a competing scheduler/outbox service without proving the existing control plane cannot support the contract.
- Initial scope is broad and source inspection was selective. Provider delivery, billing correctness, consent/opt-out enforcement, webhook authenticity, tenant isolation, secret storage, and retry/idempotency behavior have **not** been independently tested end to end.
- Status: **COMMUNICATIONS CAPABILITY DONOR / BASE44-BOUND / PROVIDER AND COMPLIANCE READINESS UNVERIFIED**.

## Communications integration boundary

1. X1 remains the control plane and source of truth for tenant identity, authorization, approvals, budgets, task queue/leases, audit, and delivery evidence.
2. Extract a provider-neutral communications adapter behind authenticated server-side X1 APIs. Keep provider-specific credentials in a server-side secret manager; never place them in browser bundles, manifests, prompt output, logs, or Git.
3. Use one durable outbox/idempotency contract tied to X1's existing queue. Every operation should have tenant ID, actor, consent basis, policy/approval receipt, idempotency key, provider request ID, bounded retries, final status, and a redacted delivery receipt.
4. Keep SMS, email, voice, campaigns, and webhook dispatch disabled in the migrated runtime until consent/suppression, authz, signed webhook verification, provider sandbox tests, spend limits, rate limiting, and opt-out behavior pass independent validation.
5. Start with a read-only provider-health/configuration inventory and synthetic sandbox sends to test destinations only. Promote to real recipients only with explicit user approval and verified compliance gates.
6. Rebuild needed admin controls natively in X1. Do not import Base44 frontend or functions as production dependencies; migrate business logic only after reviewing its security and provider behavior.


## Evidence limits

This document records repository metadata and source files inspected on 2026-10-18. It does not certify live provider credentials, production runtime state, visual parity, deployment behavior, authenticated API flows, or production readiness.
