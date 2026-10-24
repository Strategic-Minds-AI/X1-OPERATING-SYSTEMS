# X1 Goal-to-Completion MCP — v0.2.0 SPEC
Date: 2026-10-22 | Mode: Local staged implementation | Release: BLOCKED

## Mission
Single-goal experience that turns natural language into a visible pipeline, executes only permitted work, reports evidence and monitor states, and routes authorized cloud operations through the canonical X1 control plane. Goal: full cloud+local automation with bounded repair and continuous monitoring. This version implements the first local execution tier and cloud connection planning; it DOES NOT implement fully autonomous multicloud operations.

## User journey
1. Describe any goal in ChatGPT.
2. `create_goal_plan` returns 7 default or up to 12 tailored measurable tasks and renders editable checklist.
3. `inspect_x1_systems` probes current local control plane, Ollama metadata, Docker and the existing three JARVIS heartbeats, and displays a separately dated cloud connector snapshot.
4. `inspect_x1_jobs` reads the preexisting backend-fabric mirror with authoritative completion receipts.
5. `build_site_preview` creates create-only deterministic local HTML website or functional calculator mini-app from the goal, with isolated artifact SHA and a concept view. This is not a general AI coding worker, live lead funnel, or production app.
6. `validate_site_preview` performs seven static checks, never labels browser or independent QA as complete.
7. `plan_cloud_action` emits a bounded approval-aware action packet without using credentials or dispatching cloud API calls.
8. Checklist can export a Markdown handoff. Host download and view-state persistence must be verified in real host before release.

## Tool contracts
- create_goal_plan: read-only; goal, optional steps.
- review_goal_evidence: read-only completeness, independent verification NOT_RUN.
- inspect_x1_systems: read-only live local health; dated connector snapshot; no backend tokens.
- inspect_x1_jobs: read-only worker mirror and receipt precedence.
- build_site_preview: local candidate create-only; title, goal, kind=website|app.
- validate_site_preview: deterministic static checks.
- plan_cloud_action: read-only request plan, no dispatch.

## Canonical production integration design — NEXT VERSION
Skybridge MCP view -> authenticated X1 API gateway (not localhost cloud loopback) -> tenant/role authorization -> canonical Supabase x1_work_queue/idempotency/leases -> approved execution workers (JARVIS WSL2 and Railway) -> GitHub branch -> Vercel noindex preview -> Supabase staging/RLS -> QA + Guardian -> approval -> release -> GSC/GA4/receipt monitor using existing scheduler.
Provider credentials stay server-side with audience and tenant scope. Preserve source SHA, exact project ID, spend ceiling, action class, retries, approval ref and rollback pointer per work packet. Never create a second queue or scheduler.

## Explicit known blockers
- GitHub repo and README accessible through connector; root package.json returned 404 (path missing). Canonical main SHA 0994f0393619777cb701b9a6193c3d340bc706ba verified. Skybridge app itself lacks GitHub server-side credentials.
- ChatGPT connector grants do not grant Skybridge process cloud API access. Dedicated OAuth gateway and resource-scope mapping not installed.
- Local 127.0.0.1:4311 cannot be used as a cloud-accessible gateway address.
- Prior JARVIS hardware-recovery hold: local model inference / heavy autonomous builds not enabled without clearance.
- Skybridge dependency chain still contains four high npm advisories in production audit; no safe automated downgrade verified.
- Security/tenant, live preview browsing, UI/mobile/accessibility, host export, independent QA and deployment checks incomplete.
- No public exposure, production deployment, cloud writes or external messaging authorized.

## Acceptance gates
[x] Local source and receipt state verified
[x] Local service health connected
[x] Existing worker smoke dispatched READ only, pass receipt read back
[x] Website/app preview HTML generated deterministically and SHA recorded
[x] 7 static checks passed on synthetic preview
[x] 12 unit/integration tests
[x] TypeScript and build succeed (rerun after final changes)
[x] Seven MCP tools discovery/invocation successful (rerun after final changes)
[ ] Actual browser desktop/mobile screenshot validation
[ ] Host UI export real run
[ ] Vulnerabilities remediated or risk waived by security authority
[ ] App-server secure OAuth and tenant identity
[ ] Cloud write path permission and scoped approval
[ ] Independent Guardian validates browser + security and source hash
[ ] Live end-to-end website preview to cloud
[ ] Persistent monitoring of delivered project with measured data
[ ] Production release approval

## Bounded alternatives
1. Skybridge: existing MCP React view, appropriate inside ChatGPT; keep.
2. LangGraph: useful for durable stateful agent steps but do not add separate state store/queue when X1 already has one.
3. n8n/Windmill-style workflows: suitable for visible orchestration but another scheduler could create duplication; prefer adapters to existing X1 worker and queue.
Benchmarks are architectural patterns, not tested feature parity or performance scores.


## v0.3.0 delta (2026-10-22)
Added read-only job receipt MCP lookup, trusted local backend-only worker enqueue module with deterministic idempotency and atomic inbox packet, exact script path gate, production startup/write denial, genuine Windows Chrome desktop/mobile calculator browser tests, 17 deterministic tests, GitHub feature branch and auto-created X1 Vercel preview evidence. Four high dependency advisories persist. Fault Line independently reviewed code but did not run tests; verdict NOT_VERIFIED. No public /mcp, OAuth/tenant isolation, full-stack autonomous build/repair, or live release. See WORKBOOK.md for the complete gate matrix.