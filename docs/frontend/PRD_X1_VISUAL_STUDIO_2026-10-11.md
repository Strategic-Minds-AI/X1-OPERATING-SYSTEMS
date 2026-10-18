# X1 VISUAL STUDIO | Enterprise PRD and 0-to-live experience
Date: 2026-10-11 | Version x1vs-prd-1 | Scope: admin-only creator, approval-first.

## Mission
One operator enters a request by voice or chat, then one existing X1 supervisor launches one or more isolated coding-agent sandboxes, produces a real browser preview, repairs defects and presents versioned review evidence, even when the operator is offline. Production deployment and customer-facing actions require explicit scoped authorization.

## Personas
- Operator/owner: prefers voice and simple ChatGPT-like interface; must see current state, assets, completed overnight tasks and one button to approve.
- Admin developer: code editor, diff, terminal, cherry-pick, change requests, rollback.
- Client reviewer: scoped preview only, can approve a specific manifest/revision without seeing backend credentials.
- Security reviewer: can inspect receipts and block risky actions; not a builder role.

## Required pages and components
1. /admin/studio: rail with original metallic S, project/sandbox switcher, chat history left, animated preview canvas right, toolbar Preview | Code | Changes | Checks, desktop/tablet/phone, DOM inspector drawer, undo, keyboard accessibility, export.
2. /admin/studio/projects (future): workspace list with branch, owner, latest run, plan, URLs and budget.
3. /admin/studio/night (future): approved nightly mission batches, window, cap, priority, pause, stop, resume and morning digest.
4. /admin/studio/runs/:id (future): immutable mission timeline, agent steps, stdout/stderr redacted, sandbox snapshots, screenshot diffs, approval gates.
5. /admin/studio/assets (future): original brand packs, logo packs, web packs, social packs, consented images and safe staging URLs.
6. /admin/studio/settings (future): role/tenant policy, allowed repos/actions, models/budgets, Vercel/Railway/Supabase binding status.

## UX contract: 60/40 landscape
Desktop large: narrow 70px global rail, ~350-420px chat composer panel left, remaining editor/preview right; optional ~220px inspector drawer. The real canvas should behave like the deployed app, in a tenant-isolated preview iframe with strict CSP, allow-list and no production secrets. Code and console operate against same sandbox filesystem; version/revisions are Github/source-truth not localStorage.

Mobile: rail shrinks, chat and editor become top/bottom or tabs; touch targets >=44px; voice action clearly visible; design inspector becomes bottom sheet; preview viewport fixed at 390x844. Avoid pretending v0's desktop-only design mode works everywhere.

## Interaction flows
**Prompt to approved preview**: create mission DRAFT -> verify tenant/role -> choose repo+branch+budget+acceptance rubric -> assign unique sandbox_id -> run bounded discovery and plan -> coding agent writes branch -> preview dev server -> browser evaluates screenshots and actions -> independent validator -> repair loop <= bounded retries -> immutable evidence receipt -> notify operator with preview and approval controls. No production action without new explicit scope.
**Visual patch**: select DOM element -> capture stable source locator (file, component, AST path, revision SHA) -> apply style/text patch in isolated workspace -> render -> snapshot before/after -> run tests -> generate diff and receipt -> operator approves branch PR.
**Overnight**: operator approves a scope window (projects, budget, max concurrency, no production), supervisor leases one queue task at a time per sandbox; transient errors retry with exponential backoff, crash resumes from durable checkpoints; morning digest links to completed previews and blockers. Chat need not remain open.
**Versioning**: every branch mutation includes exact sha and patch id; never overwrite an unmerged human change; support multi-sandbox parallel outputs and conflict review.
**Voice**: tap mic -> transcribe (browser Web Speech optional, browser/cloud handling disclosed) -> preview text -> user submits -> preserve original transcript and resulting interpreted instruction with consent; optional voice command confirmation for protected actions.
**Phone operator**: dictate desired features, receive summary and link, open mobile preview, approve preview-only scope. Dangerous actions always show approval dialog with exactly what and which accounts.

## Functional acceptance requirements
- Three nonproduction sandboxes may exist at once, but no tenant/file/credential crossing; one authoritative lease supervisor.
- Each sandbox has a Git branch or worktree, source revision, ephemeral filesystem, max wall-time, idle TTL, resource limit, network allowlist, budget and artifact receipts.
- Minimum agent roles: Planner, Builder, Browser QA, Independent Validator, Guard/Guardian, Human approver. Agents are not independent schedulers.
- Streaming chat events cannot be treated as durable task state. Rehydrate from Supabase ledger after connection drop or user exit.
- Every UI status is backed by actual signed server receipt, or marked illustrative/unbound. No fake green READY labels.
- Four-tier safety: read -> draft -> branch/preview -> protected production; authorization enforced in backend, not UI.
- Performance target for frontend: keyboard navigable, no horizontal overflow 390px, reduced-motion, no console errors, lazy canvas/screenshot assets, text contrast >= WCAG AA except decorative.
- Visual target: original chrome S top-left on homepage/admin/pricing/portal, identical image bytes; brand dark cinematic Earth, electric blue primary and restrained green accent. Pixel parity must be independently visually judged against approved homepage, not self-scored.
- Client data stays within authenticated tenant; never fabricate invoices/leads or public reviews.
- Real user confidence: user sees what was requested, what code changed, source repo, test evidence and exact approval required.

## Phase gates
P0 research/visual UX: implemented in isolated preview, no real agent.
P1 authenticated gateway + typed mission draft in existing X1 queue.
P2 Vercel Sandbox SDK allocation, storage and WebSocket/SSE streams, branch worktrees.
P3 code editor/AST visual selection, patch/diff and Vercel preview feedback loop.
P4 overnight scheduler via existing X1 reconciliation, retries, watch, pause/resume and morning report.
P5 enterprise security, budgets, role controls, audit, billing-aware concurrency, independent QA, release certification.
**Current:** P0 UI plus documentation only; do not claim P1-P5 bound.
