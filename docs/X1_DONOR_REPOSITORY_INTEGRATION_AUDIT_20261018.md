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

## Canonical X1 system lineup and authority alignment — 2026-10-18

This section resolves the role ambiguity found during the donor audit. It is an architecture decision proposal grounded in the inspected repository evidence; it is **not** proof that every component has been migrated, deployed, or validated. The single-authority rules below must be reflected in the actual API, database, queue, deployment configuration, and agent instructions before the ecosystem can be called fully aligned.

### Canonical authority model

| Layer | Canonical system / repository | Official responsibility | Must not become |
|---|---|---|---|
| Product and operator experience | `Strategic-Minds-AI/X1-OPERATING-SYSTEMS` | Main site, admin and client portal integration, Prompt Lab/Visual Editor/Launch Studio entry points, operational visibility, approval UX, native X1 API integration | A second independent scheduler or competing source of truth |
| Control-plane authority | `Strategic-Minds-AI/x1-ai-hub-control-plane` | **Only authority** for durable work state, task admission, queue/leases, orchestration decisions, approval enforcement, idempotency, budgets, policy decisions and execution receipts | A UI-only dashboard; or a second implementation duplicated in Prompt Lab, Launch Studio, or a donor app |
| Operator runtime/product shell | `Strategic-Minds-AI/x1-ai-hub` | X1 AI Hub product/operator experience and integration surface, subject to a code-level audit and explicit API contract | A separate queue/lease authority or an alternate control plane |
| Prompt engineering workbench | `Strategic-Minds-AI/x1-prompt-lab` | Prompt authoring, versioning, refinement, simulation/evaluation, prompt chains, model selection, reusable libraries, agent/task specifications, and human approval UI | The control-plane authority, source of truth for execution state, or an unrestricted shell/production executor |
| Website factory and release workflow | Website Launch Engine + native Launch Studio in X1 | Site intake, market/industry selection, brand/design system, SitePack generation, preview, QA, approval, release request and deployment evidence | An independent queue, unapproved DNS/domain changes, or treating a local preview as a deployed site |
| Visual source kits | `digital-dominance-universal-template` and `universal-auto-builder-digital-dominance-template` | Reusable visual components, design tokens, layouts, renderers, schemas and synthetic preview fixtures imported after provenance review | Production services, trusted content, or proof of live website creation |
| Agent execution | `x1-ai-hub-swarm-runtime` | Execute leased, authorized work packets; enforce worker timeouts, budgets, retries, health and receipts | Scheduling its own work independently of the control plane; production mutation until release gates pass |
| Browser execution | `XTREME-SYSTEMS/cloudbrowser-control` browser engine, behind a native X1 adapter | Isolated, authenticated browser sessions for approved navigation, observation, screenshots, and gated actions | A second control plane, public unauthenticated browser endpoint, or client-side credential store |
| Communications delivery | `XTREME-SYSTEMS/xtreme-communications-os` business logic selectively migrated behind native X1 adapter | Provider-neutral SMS/email/voice/campaign/webhook execution with consent, approvals, idempotency, quotas and delivery receipts | A second scheduler/outbox authority, direct uncontrolled outreach, or Base44 as a production dependency |
| Data and audit foundation | Supabase, under X1 server-side policy | Durable tenant-scoped operational data, registries, approved schemas, RLS, audit/receipt persistence and retrieval | Client-side service-role access or multiple competing records for the same job |
| Hosting and release | Vercel for web UI/preview; Railway for isolated workers/services; GitHub for versioned source and CI | Build, preview, deploy and rollback with explicit source SHA and release evidence | A host/provider silently deciding policy or authorizing production release |
| Local model execution | Ollama through an authenticated, server-side X1 model adapter | Local/private model inference and bounded specialist tasks | Direct browser exposure, unrestricted production authority, or an unverified tunnel treated as live |
| Evidence archive and external connectors | Google Drive / approved MCP connectors | Approved artifact archive, evidence references and controlled external integrations | The primary task queue or an alternate system of record |

### The control-plane distinction

The audit found a real naming/authority collision, not just a misunderstanding by the Prompt Lab agent:

1. The Prompt Lab repository's README identifies it as a **Base44 project**. It does not establish Prompt Lab as the platform control plane. Its agent can propose orchestration plans, but those plans must be submitted to X1's authenticated, policy-enforcing APIs.
2. The private repository `Strategic-Minds-AI/x1-ai-hub-control-plane` describes itself as the authority for deterministic orchestration, leases, approvals, queues and receipts. Its README is currently only a short role declaration, so its implementation and production status still require a code/configuration audit.
3. `Strategic-Minds-AI/X1-OPERATING-SYSTEMS` also contains native X1 APIs/admin workbench work and has been described in integration materials as the control plane. To avoid two sources of truth, treat it as the **operator/product integration layer** and make `x1-ai-hub-control-plane` the **single backend authority**—unless a code-level comparison proves that the dedicated repository is only a duplicate/obsolete scaffold. That comparison is a required decision gate, not something this README inspection can settle.
4. `Strategic-Minds-AI/x1-ai-hub` describes itself as the product and operator runtime. Its exact boundary with `X1-OPERATING-SYSTEMS` is also underdocumented. It must be consolidated as a shell/module or assigned a sharply bounded product role; it must not operate an independent queue.
5. The swarm runtime README itself names `x1-ai-hub-control-plane` as the upstream authority, supporting the single-control-plane boundary. The inspected worker gateway is currently read-only and rejects mutations.

### Non-negotiable integration contract

- **One job ID, one authoritative state machine, one queue/lease/idempotency authority, one approval ledger, one execution receipt contract.** Other apps may mirror state for display but cannot independently authorize or re-dispatch work.
- Every job carries tenant, actor, origin app, requested capability, policy/approval reference, budget/deadline, idempotency key, source/version pins, and immutable result/evidence references.
- Prompt Lab and specialist agents generate structured proposals. The control plane validates identity, policy, permissions, budget, approval and lease before any worker acts.
- Launch Studio produces a versioned SitePack and preview request; it does not claim deployment until Vercel/Railway/DNS evidence and independent release checks exist.
- Browser and communications are isolated adapters. Credentials stay server-side; every call is tenant-scoped and audited. Browser navigation must enforce SSRF policy. Communications remain sandbox-only until consent, opt-out, signature verification, rate/spend limits and provider sandbox tests pass.
- Supabase is accessed through server-side services and RLS-scoped contracts. No Base44 service-role dependency may be introduced into native X1 production.
- GitHub is the source/version authority; a README, prompt, agent assertion, green local test, or preview URL is not deployment evidence. Release records pin the exact commit and independent validation receipt.
- Ollama is a model backend, not an authorization boundary. Its X1 adapter must be authenticated and bounded.
- Production release, public indexing, DNS changes, paid provisioning, live customer messaging, destructive browser actions and production mutations require explicit policy approval and verified receipts.

### Blocking alignment findings

1. **Control-plane implementation overlap:** compare `x1-ai-hub-control-plane`, `X1-OPERATING-SYSTEMS` and `x1-ai-hub` code, schemas, deployment targets and credentials. Choose one runtime authority; retire or demote duplicates. Do not infer implementation completeness from short READMEs.
2. **Prompt Lab Base44 coupling:** migrate its needed business logic and APIs into native X1 services; keep Base44 out of production dependencies. Audit and remove any arbitrary shell/command execution bridge before exposing Prompt Lab to workers.
3. **Website Launch Engine identity:** reconcile `x1-launch-engine` versus the source-truth reference to `website-launch-engine`; do not link a Vercel production project until the canonical repo and release branch are verified.
4. **Repository visibility / credential hygiene:** cloud browser and communications donor repos report public visibility while containing security-sensitive integration patterns; inspect for active or historical secrets, rotate any potentially exposed credentials, and verify intended visibility before further proprietary code is added. Never print secret values into this audit.
5. **Environment proof:** PR #25 remains draft/unmerged; preview APIs previously returned `503 NON_STAGING_TARGET`. Fix the preview's staging-only Supabase binding, pass authenticated API smoke tests, and obtain independent validation before merge.
6. **Release posture:** production indexing remains blocked by `robots.txt` disallow-all and missing `sitemap.xml`; preserve that gate until canonical host, SEO and production verification are reviewed.

### Alignment verdict

**Architecture roles can now be stated consistently, but the ecosystem is not yet proven fully aligned operationally.** The recommended canonical model is: X1 operator/product layer → one dedicated X1 control-plane authority → one durable queue/lease contract → guarded swarm workers and isolated browser/communications adapters, with Prompt Lab as a workbench and Launch Studio as a site-factory workflow. The remaining blockers above require code/configuration evidence and independent tests before this is marked production-aligned.

## Code-level authority reconciliation — supersedes any earlier assumption that the dedicated control-plane repo is already operational

A direct tree/source inspection was performed after the initial lineup section. This evidence changes the operational conclusion:

- `Strategic-Minds-AI/x1-ai-hub-control-plane` default-branch tree currently contains only `README.md` at the inspected ref. The README declares intended authority, but the repository tree does not expose an implementation of its claimed queue/lease/approval API.
- `Strategic-Minds-AI/x1-ai-hub` default-branch tree currently contains only `README.md` at the inspected ref. It is a role declaration/stub at that ref, not a demonstrated operator runtime.
- `Strategic-Minds-AI/X1-OPERATING-SYSTEMS` contains concrete API/server code in `apps/strategic-minds-v2/server/`, including `x1-staging.mjs`, `x1-work-items.mjs`, and `x1-worker-status.mjs`. The work-items adapter uses the `x1_enqueue_work` RPC and reads `x1_work_queue`; worker status calls `x1_worker_status_summary`. These routes explicitly bind to the approved staging project and fail closed outside preview/development. The checked-in code is real implementation, but the environment binding and live authenticated behavior remain unverified.
- `Strategic-Minds-AI/x1-ai-hub-swarm-runtime` implements a `SupabaseWorkQueue` client that calls `x1_lease_next_work` and `x1_finish_work`, and a `ControlPlaneClient` that posts to `X1_CONTROL_PLANE_URL/api/authorize` unless a functions endpoint is explicitly configured. Its inspected worker handler rejects every action other than `READ_ONLY`.
- The currently inspected X1 Operating Systems API tree does not contain an `/api/authorize` endpoint matching that default worker contract. Therefore the worker/control-plane URL integration is **not proven compatible**. Do not enable or scale workers based on matching names or configuration assumptions.
- Prompt Lab's `base44/agents/autonomous_agent.jsonc` explicitly describes itself as the "autonomous operator of the entire platform", claims ownership of the bootstrap roadmap, and can invoke `bridgeCommand`. The inspected `bridgeCommand` creates a pending LocalCommand from a user-supplied command string; `bridgePoll` returns that string to a registered bridge. This is a legacy execution path that needs isolation/allowlisting and must not be treated as the authoritative X1 execution plane. The Prompt Lab repository's root package is Base44-bound.

### Revised operational authority decision

Until a dedicated control-plane service is implemented and passes contract tests, the only evidenced queue contract is the Supabase X1 queue/RPC family referenced by the X1 API and swarm runtime. The **intended authority** is the X1 control-plane contract, but its dedicated repository is currently an implementation gap at the inspected default-branch ref. The native X1 API is the current staging operator facade; it must not be misrepresented as a complete production control plane. No production queue/worker activation is authorized by this audit.

Required implementation sequence:
1. Publish a versioned, machine-readable API contract for authorize, enqueue, lease, finish, approvals, tenant scope, idempotency, budgets, and receipts.
2. Decide whether to implement that contract inside `x1-ai-hub-control-plane` or explicitly keep the service implementation in X1 Operating Systems. There must be one implementation owner and one deployed endpoint; no parallel control-plane service.
3. Make the swarm worker's `X1_CONTROL_PLANE_URL` resolve to the actual tested authorization endpoint, and align the gateway/RPC request/response schemas with contract tests.
4. Keep all mutation handlers disabled. The worker's current `READ_ONLY` guard remains the correct fail-closed posture until independent authorization, lease-concurrency, duplicate-execution, cancellation, budget, audit and rollback tests pass.
5. Correct Prompt Lab's autonomous-agent instructions to state that it is a prompt workbench/proposal generator, not the control plane. It must not issue shell commands, production mutations, deployments, DNS changes, or customer communications directly. Its legacy command bridge must remain disabled/untrusted for privileged operations until replaced with typed, allowlisted, authenticated X1 work packets.
6. Fix the preview staging binding and run authenticated staging API smoke tests. PR #25 must remain unmerged until this passes.

**Current status: AUTHORITY MODEL DEFINED; IMPLEMENTATION ALIGNMENT FAIL/BLOCKED.** Repository declarations now agree in the audit, but the dedicated control-plane implementation and worker API compatibility are not yet established.

