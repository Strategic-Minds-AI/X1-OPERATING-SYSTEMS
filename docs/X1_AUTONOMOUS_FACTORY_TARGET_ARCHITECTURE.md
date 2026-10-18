# X1 Autonomous Business & Website Factory — Target Architecture

**Status date:** 2026-10-18  
**Purpose:** Durable source of truth for the Base44-independent X1 operating system and the first revenue-focused lead-generation programs.

## Non-negotiable architecture rules

1. **No Base44 runtime dependency.** X1 application code, authentication, database, queues, workers, secrets, logs, and deployment workflows must operate without Base44. Existing Base44 apps may be read as legacy sources for export/migration only; they are not runtime dependencies.
2. **One durable orchestration authority.** Reuse the canonical X1 Supabase queue, leases, idempotency keys, execution ledger, audit receipts, and existing Railway worker plane. Do not create a second queue, scheduler, supervisor, heartbeat, or agent registry.
3. **Preview-first releases.** Each generated site receives a source SHA, tenant/site identity, Vercel preview, synthetic test data, browser QA, security/SEO checks, independent validation receipt, and rollback pointer before any production release.
4. **No fabricated autonomy.** A queued task is not a running task; a Vercel READY deployment is not a validated website; an agent self-review is not independent factual validation; a healthy heartbeat is not proof of successful business execution.
5. **Bounded self-healing.** Diagnose, reproduce, propose the smallest reversible repair, test, independently validate a new SHA, and stop/escalate after three failed repair attempts or a safety/permission boundary.
6. **Google-compliant scale.** Every site must be genuinely useful and differentiated, accurately represent service areas and qualifications, capture leads transparently, and avoid doorway pages, fabricated local presence, fake reviews, manipulative backlink networks, or mass-produced thin pages.

## Product surface

### Customer-facing
- Cinematic marketing/home page and service/industry pages.
- Transparent pricing page and quote/request flow.
- Authenticated client portal for project status, assets, approvals, invoices/quotes when wired, deliverables, and support.
- Privacy-conscious lead capture and consented communications.

### X1 admin
- **Visual Editor:** chat and instructions on the left; preview canvas, element selection, responsive viewport, code/change diff, and inspector on the right.
- **Launch Studio:** integrated template-driven site builder, with a clear boundary between draft generation and actual deployment.
- **Prompt Lab:** tenant-scoped prompt library/versioning, prompt QA, chain blueprints, and controlled simulation.
- **Coding Kanban:** canonical X1 work queue, visible leases/worker readiness, receipts, failure states, and review gates.
- **X1 Command Agent:** operator cockpit, source/tenant/authorization checks, task creation, receipts, and status.
- **Client/Project administration:** tenant separation, access controls, project and delivery history.

## Reference architecture

```text
ChatGPT / MCP client
  ↕ authenticated OAuth 2.1 + scoped tools + audit receipts
X1 Admin / Client Portal / Prompt Lab / Visual Editor / Launch Studio
  ↕ server-side APIs only
X1 Control Plane
  ├─ canonical Supabase queue + leases + idempotency + receipts
  ├─ task policy/action classes + tenant authorization + approval gates
  ├─ model router (local Ollama and explicitly configured hosted providers)
  ├─ specialist agents + independent QA/Guardian
  └─ durable monitoring, recovery, and continuity
  ↕ bounded worker leases
Railway execution plane / isolated coding sandboxes
  ├─ discovery and data normalization/enrichment
  ├─ builder and test workers
  ├─ browser/SEO/accessibility/security validators
  └─ provisioning adapters for GitHub, Vercel, Supabase, Railway
  ↕ immutable source SHA + preview URL + validation receipt
Site Factory → Vercel noindex preview → approval → production release
  ↕
GA4 + Search Console + persisted sitemap state + lead CRM + Xtreme Communications
```

The diagram describes the target, not a claim that every integration is already live.

## Core workflow

1. **Intake and scope:** identify customer/tenant, target industry, geography, desired service, legal permissions, source systems, success metric, budget, and explicit disallowed actions.
2. **Discovery:** acquire lawful public/business data, retain provenance and timestamps, deduplicate, normalize, enrich only with authorized sources, and label VERIFIED / INFERRED / UNKNOWN / BLOCKED.
3. **Opportunity and content plan:** verify actual service availability and buyer intent; choose the most useful service pages, conversion paths, FAQs, local pages only where justified, and unique proof/utility.
4. **Design lock:** generate distinct directions when needed, capture approval, and keep approved visual references immutable.
5. **Build:** create an isolated branch/workspace; generate application and server code; run tests and secret/dependency scans.
6. **Preview:** deploy with noindex and robots disallow; never attach production domains at this stage.
7. **Validation:** desktop/mobile/tablet journeys, console/network, accessibility, forms, consent, tenant isolation, auth, data accuracy, performance, unique content, canonical URLs, sitemap, and rollback checks.
8. **Release gate:** require exact source SHA, passing CI, independent validation, owner approval, and rollback deployment. Production actions remain separate from task generation.
9. **Operate and improve:** persist sitemap version/submission status, Search Console/GA4 sync receipts, lead outcomes, deployment health, and bounded self-heal outcomes; use real data to rank the next improvements.

## First three business programs

### 1. Lawyer network lead generation
- Build a structured intake and routing flow by practice area and jurisdiction.
- Verify attorney identity, bar/jurisdiction details, service coverage, and consent before publishing claims.
- Track source, consent, referral/lead delivery, response, and outcome; never imply an attorney-client relationship without the appropriate process.
- Human/legal review for legal claims, advertising rules, referral-fee rules, and jurisdiction-specific disclaimers.

### 2. XPS / Xtreme Polishing Systems lead generation
- Use verified product/service coverage, authorized territories, installation/training capabilities, and CRM routing.
- Capture the requested service/product, geography, project timing, and consent.
- Route via the existing Xtreme Communications/Twilio system only after its endpoint, idempotency, opt-out, and delivery receipt are verified.
- Avoid fabricated branch locations, reviews, certifications, or availability.

### 3. Deceased-person / skip-trace research contract
- Separate this from public marketing-page generation.
- Verify contract authority, permitted data sources, allowed purpose, retention, access controls, and audit requirements before processing records.
- Keep sensitive records private and tenant-scoped; do not publish individual-level data or initiate contact/outreach unless explicitly authorized and lawful.
- Preserve source provenance and human review for ambiguous identity or deceased-status matches.

## Current verified state and blockers

- The X1 Vite frontend has routes for marketing, pricing, client portal, Visual Editor, Prompt Lab, Coding Kanban, X1 Agent Console, and Launch Studio.
- Prompt Lab is X1-native and persists prompt assets through an authenticated tenant-scoped staging API. No Base44 runtime or iframe is used.
- Coding Kanban uses the canonical X1 staging queue and only saves DRAFT work; the current registered worker is read-only. **Autonomous code execution is not enabled.**
- The MCP endpoint is a staging Streamable HTTP foundation with scoped queue/prompt tools. **ChatGPT OAuth 2.1 authorization and full bidirectional connector setup are not complete.**
- Ollama execution is guarded to local development/loopback and is not verified end-to-end from the hosted preview.
- A fail-closed SEO build policy is present: local/preview defaults to noindex and no sitemap. Indexing requires production runtime, an explicit flag, an HTTPS canonical origin, and an exact hostname allowlist. It does not automatically submit sitemaps to Google.
- Live public check on 2026-10-18: `https://www.strategicmindsai.com/robots.txt` returns `Disallow: /`; `/sitemap.xml` returns 404. This blocks normal crawling and must be corrected only in the verified production release path.
- Vercel project `x1-operating-system` owns `strategicmindsai.com` and `www.strategicmindsai.com`. The last READY production deployment found was commit `ede87a95e8dab208d6f5eeabc0e3e0ca8f2cbcaa` from `feature/x1-admin-preview-job-wiring-20261011`. Recent production-target deployments from `main` failed with `NOW_SANDBOX_WORKER_ROOTDIR_NOT_EXIST` because `apps/strategic-minds-v2` does not exist on the current `main` branch (which currently contains only the repository README). This source/production-branch mismatch must be resolved before the public site can reliably receive new releases.
- Supabase staging project: `uvdkzsbjackpjvpoxtyk`; production project: `vgsmyhqqtkkluhypxyua`. Keep schema changes staging-only until an exact production migration plan and rollback are approved.
- The Digital Dominance audit found the factory queue empty/paused, no high-volume generation running, duplicate site records, false live/preview status accounting, missing GA4 property IDs, no persistent sitemap records, and compliance reports below the intended release threshold. Do not launch large batches until one source-traced canary passes.

## Delivery order

### P0 — Make source and release truth reliable
- Resolve the mismatch between Vercel production branch `main`, its missing app root, and the active integration branch.
- Establish a single canonical branch/deployment policy and preserve the current working deployment as rollback.
- Fix live-domain robots/sitemap only in the approved production path; keep every preview noindex.

### P1 — Complete secure native X1 foundation
- Finish admin navigation, client portal auth/tenant isolation, Prompt Lab and Visual Editor workflows.
- Add OAuth 2.1 for the MCP client with PKCE, scoped consent, token revocation, and read-back tests.
- Keep MCP tools least-privileged; deployment/provisioning tools require explicit scoped approvals.

### P2 — Enable autonomous coding safely
- Provision a separately authorized, isolated builder worker with branch-only write scope, per-task budget, idempotency, timeout/lease renewal, artifact provenance, and a kill switch.
- Run build/test/secret scans before independent browser/security QA.
- Do not let a builder approve its own result; do not grant production credentials to the coding worker.

### P3 — Build persistent Google/SEO operations
- Establish OAuth-backed GA4 and Search Console bindings and store property IDs only after account verification.
- Persist per-domain sitemap version, URL count, checksum, deployment SHA, submission attempt/status, last successful sync, and errors.
- Reconcile robots, canonical URLs, redirects, structured data, sitemap URLs, and noindex state per environment.
- Use idempotent scheduled sync with bounded retries, alerting, and a manual disable switch.

### P4 — Prove the site factory before scale
- One real but synthetic-data canary → 10-site batch → 100-site batch → scale only after measured error, quality, lead, and cost thresholds pass.
- Use a queue with leases, rate limits, per-tenant quotas, dead-letter handling, replay safety, and per-site receipts.
- Require differentiated content and real usefulness for every site; never optimize for a raw count of generated domains.

## Release gate

A website is not production-ready until its exact source SHA has: successful CI; independent validation; responsive browser evidence; auth/tenant-isolation and secret scans; verified lead capture and consent; SEO/content quality checks; real sitemap/robots/canonical behavior; observability; an explicit release approval; and a tested rollback pointer. Unknown evidence remains UNKNOWN, never PASS.
