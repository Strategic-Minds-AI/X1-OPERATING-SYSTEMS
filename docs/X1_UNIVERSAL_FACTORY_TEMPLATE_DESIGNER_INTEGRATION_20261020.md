# X1 + Visual X Universal Factory Academy — Living Workbook
Mission X1-ACADEMY-TEMPLATES-20261020 | October 20, 2026
Status: **functional X1 feature preview with deterministic tests and browser QA PASS; no new production release.**

## Goal, ownership and source
Implement the owner-controlled Universal Factory Academy template design technology inside X1 Operating Systems and Visual X. Reuse source and existing control plane without creating a duplicate queue, heartbeat or worker.
- Donor repository: https://github.com/Strategic-Minds-AI/universal-auto-builder-digital-dominance-template
- Immutable donor production SHA: 059f9e8042aa413d05fcc6955be8a275e187ce26
- Academy stable URL: https://universal-factory-academy.vercel.app
- Pinned donor URL: https://universal-factory-academy-frgdq8fol-strategic-minds-advisory.vercel.app
- Academy Vercel project: prj_TcFW7CN06m3FoZ94wjLjD5wuh4n4, READY production.
- Donor source: src/academy.mjs, src/industry-academies.mjs, academy/studio.js, src/catalog.mjs and src/validate.mjs.
- Donor catalog: 40 original design interpretations and 6 specialized industry academies with six tailored site examples each, 36 industry-specific pages, total 76 generated preview pages.
- Canonical X1 repository: https://github.com/Strategic-Minds-AI/X1-OPERATING-SYSTEMS
- X1 integration branch: feature/x1-universal-factory-template-designer-20261020, based on feature/x1-public-real-portal-20261020.
- X1 frontend root apps/strategic-minds-v2. X1 project prj_PIDgTashnTCpsWbKUBCjHz55yXqT.
- Verified X1 current feature preview: https://x1-operating-system-8h398mh99-strategic-minds-advisory.vercel.app/admin/template-designer, READY deployment source 760442c79c160b4ffde049390dfb954881b8e5c2. Initial browser-tested preview URL: https://x1-operating-system-7ji2a88jl-strategic-minds-advisory.vercel.app/admin/template-designer, SHA 9f74239251fd0e491065ca8dfebfde0b10842074.
- Visual X connected app 6ad5e96eb2cfcf9aafe9f1df, authenticated /academy-templates page.
- Base44 Visual X restorable checkpoint 6ad76340367e0501f7db4faf, git commit 8e4cc9d0246266b3fa5524b08b74613a2c6926a6.

## Implemented architecture / decision log
1. X1-native React page TemplateDesigner.jsx, X1 cyan/green styling TemplateDesigner.css and route /admin/template-designer. X1 LaunchStudio topbar links directly into designer.
2. Uses read-only api/x1/template-academy.js gateway to exact pinned immutable Academy deployment: strict GET, fixed host, whitelisted resource kinds, slug checks, 9s timeout, 250 KB response cap, redirect denied, strict counts (40/6), structural HTML noindex assertion, source-SHA header and no forwarded caller secrets.
3. Native editor implements searchable layout selection, six industry presets, brand/headline/subtitle/category/CTA/service/color editing, reset, desktop 1440/tablet 868/mobile 390 device presets, HTML srcdoc preview sandbox without scripts, standalone HTML and JSON configuration exports, copy generator brief, and source provenance. No invented business claims or fake production deployment.
4. Visual X /academy-templates is a dedicated authenticated workspace hosting the verified X1 template editor in a sandboxed cross-origin iframe; top navigation, app rail, industry preset picker and responsive viewing controls added. The original Academy remains available as reference.
5. No migration or modification of donor project. No duplicate queue, supervisor, heartbeat, tenant registry, new database, new storage, new scheduler, new autonomous worker or paid AI model. X1 production write/dispatch release gates unchanged.
6. Generated HTML remains noindex and contains example disclosures until real business facts, forms, consent, accessibility and approval checks are verified. Original Academy SitePack queue/deploy interfaces are PROPOSED, not implemented.

## Acceptance evidence
- PASS — Donor Academy npm run check: 14/14 tests, built 40 master sites and 36 tailored versions.
- PASS — X1 npm run check: 150/150 tests, 0 failures, Vite production build exit 0 at source head 760442c79c160b4ffde049390dfb954881b8e5c2, after screenshot evidence and initial workbook commit. A docs-only adjustment follows, so final exact head readback remains required.
- PASS — Live X1 preview /admin/template-designer HTTP200 and CSP frame-ancestors allows https://visual-x1.base44.app.
- PASS — Live API /api/x1/template-academy kind=catalog HTTP200, JSON length ~36,819 bytes; kind=academies HTTP200, JSON length ~7,844; kind=template&id=split-left&academy=epoxy HTTP200 HTML length ~18,732 bytes; all source SHA headers matched the donor release.
- PASS — Live Chromium test npm run test:academy:browser: 8/8 checks, 0 console/page/API errors, 40 designs, six epoxy choices, brand edit reflected in HTML, 390px real viewport, HTML export, legal industry switching, 200 for the page.
- PASS — Browser screenshot/evidence blobs committed to GitHub source path docs/evidence/x1-academy-20261020:
  - template-designer-desktop.png SHA256 d05cab7f4f09dedbf950d6976e1f39ba4deb8a8e38e67db4b34b1b5a61e21821
  - template-designer-mobile.png SHA256 dc6538bf39e586eca589fca149caf08e12d97c2b0988db5309b240c255011ad0
  - template-designer-browser-receipt.json SHA256 72da5018d6fbf834e73df37f53d7cbe24e41eb27544763257e8775912df7aeb0
  - Evidence commit 243e4311a7cea87f5282e839f93ee998b6441f53.
- PASS — Visual X npm run build and npm run lint; Base44 checkpoint created. Visual X public URL route not independently published/read-back verified.
- UNKNOWN — Independent Guardian signed validation receipt for newest head. Browser test is deterministic runner, not independent validation.
- UNKNOWN — Real tenant-specific persistence, approvals, batch queues or mass deployments of template configs: not implemented by this integration.
- BLOCKED — Existing unrelated X1 production Supabase service binding and release gates, reported in docs/X1_PUBLIC_PRODUCTION_REAL_PORTAL_20261020.md. Do not promote unvalidated whole X1 production.

## Final release checklist
- [x] Recover original Vercel deployment and exact GitHub source SHA.
- [x] Run Academy original tests and inspect all six academies.
- [x] Add source-pinned, bounded, read-only adapter to X1.
- [x] Integrate real native X1 designer and Launch Studio link.
- [x] Integrate dedicated Visual X authenticated navigation and hosted editor.
- [x] Pass X1 tests, Academy build, Visual X build/lint, live API checks.
- [x] Pass 8-point Chromium acceptance with saved desktop and mobile PNGs.
- [x] Persist immutable evidence in X1 GitHub.
- [x] Ran npm run check after evidence commit: 150/150 PASS, and Vercel confirmed READY source 760442c79c160b4ffde049390dfb954881b8e5c2. A final docs-only commit requires readback.
- [ ] Run independent Guardian QA on exact final SHA, including 868px tablet and export actual file bytes.
- [ ] Resolve existing X1 release and auth gates; promote exact QA-approved SHA with rollback receipt; verify production-domain results.
- [ ] Verify Visual X published route after successful Base44 checkpoint.
- [ ] For mass website factory: implement tenant-scoped SitePack import and canonical enqueue + lease + worker + independent validator + preview and owner release authorization, no new queue.

## Risks, costs and future handoff
- Static remote-source dependency: pinned immutable Academy deployment must remain reachable. Upstream failures display honest blocked responses.
- UI preview is read-only and unprivileged; X1 admin/portal authorization is not newly solved by this feature. Preserve existing auth and RLS gates for any mutating extension.
- Original fictional source cannot become real customer sites by removing disclosures. Validate provider, service area, licenses, real prices, imagery, functional submissions and data provenance first.
- Incremental execution cost is only reads to existing Academy static Vercel origin; zero new databases, paid model calls, jobs, scheduling or workers.
- Visual X existing typecheck debt is out of scope; build/lint pass does not mean all application diagnostics pass.
- Rehydrate this workbook, previous X1 production handoffs and donor docs/BRIDGE_CONTRACT.md. For continuation, verify repo SHA/branch and Vercel deployment, run tests, obtain independent QA, then explicitly handle release approval. Dehydrate with receipts, newest SHA and truthful state.

## Latest cross-application readback
- Live newest preview HTTP200: /admin/template-designer with frame-ancestors allowing visual-x1.base44.app; /api/x1/template-academy?kind=catalog HTTP200 source SHA header exact; epoxy template HTML HTTP200.
- Visual X Base44 latest checkpoint: 6ad766cc6b2e687d8c992686 and source git 1de7c7d45155c73b5ff52a7193d901ced277071f. Visual X build/lint pass. Embedded X1 URL updated from initial QA preview to newest READY preview.
- Visual X published URL /academy-templates HTTP200 SPA shell, but successful authenticated browser session and completed iframe editing there are not independently verified. Do not confuse HTTP200 with authenticated functional acceptance.
- GitHub recursive-tree readback verified committed PNG sizes desktop=484223 bytes, mobile=523853 bytes and receipt=793 bytes, with expected blob SHA values. No fabricated screenshot or local-only evidence claim.
