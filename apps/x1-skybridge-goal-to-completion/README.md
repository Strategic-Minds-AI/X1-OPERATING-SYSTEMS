# X1 Goal-to-Completion MCP — Skybridge v0.3.0

**Status:** isolated cloud/local integration candidate; **NOT approved for public MCP deployment or production execution**.

This is the chat-facing control surface for the Strategic Minds AI X1 system. It does not replace X1's existing queue, leasing fabric, reconciler, Vercel sites, Railway services or Supabase data. Current implementation proves limited local execution, not full autonomous service generation.

## Implemented MCP tools (8)
- `create_goal_plan`: goal -> tailored/default checklist and interactive view.
- `review_goal_evidence`: operator-supplied evidence completeness; never independently certified.
- `inspect_x1_systems`: live local control/Ollama/Docker/worker health plus dated cloud-read inventory.
- `inspect_x1_jobs`: existing JARVIS local queue mirror with completion-receipt precedence.
- `inspect_readonly_worker_probe`: receipt read-back for one bounded READ-only job ID.
- `build_site_preview`: create-only local static website or calculator candidate; disabled in production.
- `validate_site_preview`: seven deterministic static validations.
- `plan_cloud_action`: non-executing, gated provider task plan (GitHub/Vercel/Supabase/Railway).

The trusted backend module `src/worker-bridge.ts` dispatches **only** `smoke-standard.py` to the preexisting JARVIS inbox when explicitly enabled in a local operator process. It is not reachable as an MCP dispatch tool. Its exclusive reservation ensures idempotency for duplicate request IDs.

## Local development
Requires Node 24.18+, npm, WSL2 JARVIS backend fabric. From the project root:
```bash
npm ci
npm run dev -- --port 3217 --plain --no-open
```
Local-only DevTools: http://localhost:3217/; MCP transport: http://localhost:3217/mcp. Do **not** open a public tunnel; do not bind production credentials.

## Tests
```bash
bash validate.sh
bash smoke.sh
```
Browser QA (verified on Windows headless Chrome):
```powershell
node .\tests\browser-windows.mjs
```
It emulates real 1440 × 900 and 390 × 844 viewport sizes and validates estimate inputs, mobile overflow, browser errors, outbound requests and captures receipts/browser-desktop.png and browser-mobile.png. Plain `--window-size` mobile screenshots are **not** sufficient viewport QA.

## Cloud/source
- Canonical X1 repo: https://github.com/Strategic-Minds-AI/X1-OPERATING-SYSTEMS
- Preview-only feature branch: `feature/x1-skybridge-connector-20261022`
- App candidate sources: `apps/x1-skybridge-goal-to-completion/`
- Existing Vercel X1 project generated preview builds for branch commits. These previews serve the existing X1 root frontend, not an independently deployed Skybridge /mcp endpoint.
- Connected ChatGPT provider tools were used to inspect GitHub, Vercel, Supabase staging and Railway; their OAuth tokens are NOT inherited by the standalone Skybridge runtime.

## Hard release gates
Actual verified OAuth issuer/audience/JWKS + tenant isolation; secure cloud-to-local gateway; authoritative queue dispatch/approval; browser QA for the *Skybridge view* itself; independent Guardian execution; package advisory remediation/exception decision; source SHA/rollback; owner production approval. Current Skybridge/nodemon/chokidar/braces transitive dependency audit still flags four HIGH advisories with no published braces fix.

## Resume and receipt sources
Read SPEC.md, WORKBOOK.md, HANDOFF.md, PROMPT_LIBRARY_v0.3.md, ADR-003-cloud-local-boundary.md and `receipts/`. Rehydrate before changing anything and never represent unrun tests as passed.
