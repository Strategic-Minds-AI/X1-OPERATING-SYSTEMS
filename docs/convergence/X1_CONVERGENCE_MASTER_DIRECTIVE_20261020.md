# X1 Convergence — Canonical One-Pass Builder and Operator Directive (2026-10-20)

**Mission:** X1-CONVERGENCE-NATIONAL-FACTORY-20261020  
**Status:** Architecture and authenticated provider audit completed; implementation / independent E2E QA NOT COMPLETE.  
**Execution coordinator:** X1 Operating Systems. **Protected target:** strategicmindsai.com. **Do not deploy to production as part of this directive.**

## Nonnegotiable architecture

1. X1 Operating Systems remains the branded product, administrator, client portal and policy control plane. Its GitHub source is Strategic-Minds-AI/X1-OPERATING-SYSTEMS, main SHA 0994f0393619777cb701b9a6193c3d340bc706ba as observed at audit.
2. Strategic-Minds-AI/x1-launch-engine (main observed d128f889e0a5fe0fb62cce112a963a40f3f2b80b) is the dedicated website execution/academy engine. Do not create a second website-engine repo or scheduler.
3. Strategic-Minds-AI/visual-x1-platform (observed 4f3f6164afe0bd2361f3925d06166a19d8ad725d) is a donor for the approved Visual X interface, prompt transformer, rendered canvas, tabs and inspector. New mass-launch/SEO commits require code review and tests; do not infer correctness from commit messages.
4. XTREME-SYSTEMS/digital-dominance (observed 5cf8a8551d3da3ce0b770638850255532e103472) is a donor for commercial targeting, template packs, batch website operations and SEO. XTREME-SYSTEMS/seo-generator (observed 252a444ca53d17786bd31acacbc237969bde59c9) is the SEO source donor.
5. GPT MCP tools for Unlimited Websites, Digital Dominance, SEO Generator, Vision Cortex, Fault Line, Windsor.ai, Base44, GitHub, Vercel, Supabase and Railway are individually connected/inspectable. ChatGPT plugin credentials do NOT transfer to a browser runtime or X1 server. Use an authenticated X1 server-side adapter, not frontend keys.
6. Existing Supabase staging project uvdkzsbjackpjvpoxtyk owns authoritative work queue, tenant memberships, leases, execution ledger and receipts. Reuse it. Do not create a parallel production queue, controller, orphan scheduler, new Base44 app or duplicate lease system.
7. Existing Railway/cloudbrowser and local JARVIS are possible workers/browser validators, not proven end-to-end dispatch. Verify the exact worker ID and fresh independent receipt before enabling automatic repairs.
8. Protect all existing production URLs/domains/data until an independent acceptance receipt approves migration. Avoid blanket deletions and route redirects to unrelated pages.

## Current facts that define execution order

- X1 staging work queue: 58 COMPLETED, 20 DEAD_LETTER, 17 BLOCKED (95 total). 16 dead letters are CONTROL_PLANE_AUTHORIZATION_FAILED; 7 blocked are FUTURE_BACKLOG_AWAITING_ADAPTER. Remaining 14 have diverse errors; cluster by fingerprint instead of retrying everything.
- Preview JARVIS heartbeat from jarvis-local-power-grid-1 was ONLINE near 2026-10-21 02:09 UTC. This proves a heartbeat, not a successful generation job.
- X1 frontend main router has /admin/studio, /admin/visual-editor, /admin/agent, /admin/prompt-lab, /admin/launch-studio and other workspaces but lacks the requested unified /admin landing and dedicated native Digital Dominance / SEO Generator modules.
- Visual X Base44 app 6ad5e96eb2cfcf9aafe9f1df has old and new competing shells. One Base44 main branch was discovered; avoid editing its live main as a substitute for preview branch work.
- Base44 Visual X has convertPrompt, promptSimulator, renderPreview, runPromptChain, independentValidation and autoRepairLoop functions. Frontend copy alone loses functionality. Inventory each function's input/output, auth, entity reads and writes, then migrate to an X1 server contract.
- Digital Dominance massLaunchOrchestrator has its own queue/batch and auto modes. It must not dispatch into both the Base44 queue and X1 queue. Current source performs role check; review deeper calls and actual receipts.
- Digital Dominance gptSyncEngine currently constrains external API key callers to metadata preflight/preview operations; do not advertise arbitrary GPT take-over or grant generic service-role access.
- SEO Generator connector records claim authorized GSC/GA4, but live scoped provider requests and write permissions must be validated separately. Windsor reported connected GSC and GA4 accounts in the earlier audit.
- Unlimited Websites CanonicalSiteRegistry has a dated quarantine on epoxyquotenearme.com; verify current public host/canonical/robots/sitemap, preserve quarantine until independent evidence clears it.
- Vercel project prj_PIDgTashnTCpsWbKUBCjHz55yXqT is the verified strategicmindsai.com domain owner. Vercel project prj_JbkX4yKWygqBFRhkHL6nbeQXM46f is website-launch-engine. A READY deployment is not a workflow pass.

## Route and design contract

Use exactly ONE approved X1 visual language for public site, admin and portal. Preserve existing X1 silver emblem, typography, colors, layouts and working client/admin components; no Base44 lookalike shell overlays.

Canonical routes (private screens require real server-authorized owner/admin access):
- /admin -> single command center with health, current missions, jobs, approvals and the one launch workflow
- /admin/visual-editor -> chat left, live preview center, collapsible tools inspector right; adopt useful Visual X technology, not legacy navigation
- /admin/prompt-lab -> prompt transformer, versions, chain runner, eval scores and traceable artifacts
- /admin/launch-studio -> canonical industry template picker and website workflow
- /admin/launch-studio/templates and /admin/template-designer -> one native Template Designer backed by the approved academy, NOT a cross-app iframe masquerading as parity
- /admin/digital-dominance -> strategy, offers, industries, local opportunity map, launch campaigns and revenue metrics
- /admin/seo-generator -> audits, GSC/GA4 reports, indexing/robots/sitemap/canonicals, content optimizer, schema, AEO/GEO research and actual observations
- /admin/integrations -> provider contracts, VERIFIED / CONFIGURED / BLOCKED / UNKNOWN states and most recent receipt; no pretend green connection cards
- /admin/automation -> existing worker, queue, leases, budgets, dead letters, repair cycles, owner gates
- /admin/guardian -> independent test evidence, rollback/repair records and approvals
- /portal -> customer-safe portal, with tenant scope and separate owner/client permissions

For old routes: build a route inventory and mark KEEP, MERGE, REDIRECT, ARCHIVE or DELETE_CANDIDATE. Do not remove any page until feature parity, routes, saved data, back links and browser flows pass. One nav registry drives all menus and breadcrumbs; forbidden to duplicate sidebars.

## Adapter contract (server-side only)

For each provider: canonical name, source repo/app ID, provider-native resource identity, supported READ actions, proposed WRITE actions, required credentials by reference (never values), owner/tenant binding, timeout/rate limit/cost budget, idempotency, auth policy, independent receipt, hard block, fallback, last validated timestamp.

Read-only health checks must distinguish: TOOL_ADVERTISED, APP_CONNECTED, PROVIDER_AUTHENTICATED, ACTION_EXECUTED, E2E_VERIFIED. Do not label everything CONNECTED based on MCP tool listing.

Typed job envelope: mission_id, tenant_id, actor_id, target_repo+sha, requested_operation, input_manifest_sha256, site_id, owner_verified, allowed_actions, dry_run, idempotency_key, lease_key, resource_budget, approval_reference, source_provenance, exact acceptance_tests, rollback_reference. Reject unknown operations and cross-tenant IDs. Do not submit a job merely to prove the UI button was clicked.

Server-mediated adapters: Digital Dominance (strategy/registry donor), Unlimited Websites/X1 Launch Engine (single build adapter), Visual X Prompt Transformer, SEO Generator (read-only analytics and draft suggestions initially), Vision Cortex (research/diagnostic), Fault Line/Guardian (independent QA), Windsor (measured GSC/GA4/GBP), Cloud Browser (isolated E2E). Human-approved send/publish/deploy actions remain out of default capability.

## Deterministic implementation sequence

P0 AUTH AND QUEUE: determine why 16 jobs fail CONTROL_PLANE_AUTHORIZATION_FAILED; compare worker identity, tenant membership, signed policies, actual refresh, lease capability and service auth. Review 7 FUTURE_BACKLOG_AWAITING_ADAPTER tasks. Apply the smallest reversible correction in staging, never bypass authorization. Prove one new synthetic job reaches a recognized worker and obtains queue, execution and independent validation receipts.

P1 VISUAL CONSOLIDATION: define locked X1 design tokens and screenshot baselines; enumerate all Visual X and X1 routes, source JS/TS modules, entities, functions, exported artifacts. Implement ONE shell and nav. Migrate prompt/backend contracts in deterministic batches. Do not move secrets or blindly copy Base44 SDK calls.

P2 FACTORY CONVERGENCE: choose one legal synthetic business and one existing industry template. Record source template ID, variables, photos/licenses, business facts, canonical URL, content provenance, distinct value, privacy/consent. Compile via Visual X/Prompt Lab; generate source through the one X1 Launch Engine; stage GitHub branch and Vercel noindex preview. No mass launch in pilot.

P3 SEO / MARKETING: audit template output for mobile UI, structure, robots/canonical, title/meta, sitemap, schema, accessibility, internal links, originality, social preview, crawlability. Pull GSC/GA4 via actual authorized Windsor/SEO connection; distinguish live data from synthetic/simulated. Draft a real buyer-first national strategy; do not auto-generate thin near-duplicate doorway pages or artificial backlink networks.

P4 GUARDIAN AND PROMOTION: independent agent inspects source SHA, HTTPS response, click and form flows, console/network logs, auth/tenant negative tests, RLS, content, consent, SEO, mobile 390/tablet/desktop 1440, performance and costs. Score each dimension 0-100 and require >=95 aggregate PLUS critical pass gates. Never self-certify; max three bounded repair cycles with unique commits. Produce signed receipt, rollback link and owner approval request for public launch.

P5 SCALE: publish one approved real site, inspect GSC indexing and qualified leads, then expand 1 -> 10 -> 50 -> regional/national batches with quotas, cost caps, city collision checks, uniqueness/buyer proof and quarantine on repeated failures. No automatic DNS, payment, customer outreach, public posting or production merge without target-specific authorization.

## Non-negotiable release acceptance tests

A01 Verified X1 production repo/project/domain identity and fresh SHA; no switch to an unrelated website engine.
A02 Every old feature has route/function/entity mapping; none silently removed before parity evidence.
A03 All new admin routes render the same X1 brand/nav and are 401/403 protected on unauthenticated or unauthorized requests.
A04 Prompt convert -> compile -> generate -> saved artifact works with real backend calls and immutably hashed output.
A05 Existing X1 staging queue handles one tenant-scoped unique idempotent synthetic job once with legitimate worker lease and durable receipt.
A06 Generated website has a unique noindex preview, verified exact git SHA, HTTP 200, proper 404 behavior, device screenshots and no unintended external messages.
A07 A synthetic form submission reaches intended CRM test record; tenant isolation prevents cross-client reads.
A08 Guardian independent validator inspects and scores code, browsers, accessibility, security, SEO and output content. >=95 plus all hard gates.
A09 SEO Generator reads real scoped GSC/GA4 values and does not fabricate rankings or claim indexes by simulation; robots/canonical/sitemap independently verified.
A10 Release record contains exact target, approval, deployment ID, URL, SHA, expenses, smoke tests and rollback. Production remains unchanged until authorized.
A11 An existing persistent schedule/worker monitors and repairs allowed nonproduction errors with 3-cycle limit, cooldown, circuit breaker, receipt and escalation.
A12 Handoff writes are read back from their canonical local/Drive/Git destination and marked PENDING_CLOUD_SYNC if unverified.

## Instructions to the Base44 Builder

You are integrating source-owned systems, NOT making cosmetic changes. Work against a reversible branch or sandbox first. Start by inspecting the referenced repos, app source, current route map, entities, functions, auth, environments and existing X1 queue. Display a FEATURE PARITY MATRIX with SOURCE FILE -> TARGET MODULE -> DATA CONTRACT -> TEST -> RESULT -> RECEIPT for every proposed removal or merge.

Do not claim DONE for an iframe, link to another site, copied static HTML, renamed tab, fabricated status, or a build status. Complete one verified narrow vertical slice of the pipeline before adding bulk launch. If Base44 cannot authenticate to a required repo or X1 staging adapter, emit a precise BLOCKED packet, preserve working state, and continue independent safe tasks. Never recreate infrastructure to work around an auth failure.

Use this file as a fixed quality contract. Report changed branch and SHA, pages/functions tested, screenshots, actual independent QA receipt, blockers and exact next task. NEVER deploy to strategicmindsai.com or remove working pages without approved release.

## Operating workbook / work packet

Every work item: task_id, goal, blocked_by, current source_sha, owner, status, target path, selected donor, input/output contract, idempotency key, tenant, scope, tests, QA receipt, cost cap, rollback, evidence, next action. Status vocabulary: TODO, IN_PROGRESS, PASS, FAIL, BLOCKED, UNKNOWN. Work packet STARTED is not DONE.

Canonical write intent: C:\\_Strategic_Minds_AI_OS\\70_X1_GPT_INFINITY_SYSTEM\\00_CONTROL (local); approved Drive mirror after authenticated write/readback; GitHub docs in this branch. No cloud/local sync claims without matching read-back hashes.
