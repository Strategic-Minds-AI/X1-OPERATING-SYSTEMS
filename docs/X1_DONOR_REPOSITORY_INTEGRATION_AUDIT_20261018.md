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

## Evidence limits

This document records repository metadata and source files inspected on 2026-10-18. It does not certify live provider credentials, production runtime state, visual parity, deployment behavior, authenticated API flows, or production readiness.
