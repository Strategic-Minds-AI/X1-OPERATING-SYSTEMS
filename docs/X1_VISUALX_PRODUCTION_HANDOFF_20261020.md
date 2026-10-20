# X1 → Visual X production handoff | Living workbook
Date: 2026-10-20. Mission X1-VISUALX-PRODUCTION-20261020.
State: **SOURCE CHECK PASS; PRODUCTION NOT RELEASED; LIVE BINDING NOT VERIFIED**.

## Source truth
- Repository: https://github.com/Strategic-Minds-AI/X1-OPERATING-SYSTEMS
- Branch: feature/x1-production-visualx-bridge-20261020, based on feature/x1-admin-preview-job-wiring-20261011
- Vercel project x1-operating-system ID prj_PIDgTashnTCpsWbKUBCjHz55yXqT; host https://www.strategicmindsai.com
- User's prior known READY production SHA: ede87a95e8dab208d6f5eeabc0e3e0ca8f2cbcaa
- Vercel metadata latest READY deployment: dpl_ENc1P7zVqFNGeX3pYhDaHyyMhLzD; deployment source SHA unverified
- Base44 Visual X: https://visual-x1.base44.app, app ID 6ad5e96eb2cfcf9aafe9f1df
- Supabase staging uvdkzsbjackpjvpoxtyk; Supabase production vgsmyhqqtkkluhypxyua
- Required source contracts: docs/X1_AUTONOMOUS_FACTORY_TARGET_ARCHITECTURE.md, docs/X1_ADMIN_GPT_BIDIRECTIONAL_SYNC_20261011.md and docs/X1_STAGING_READONLY_API_2026-10-11.md

## Decisions and implementation
1. Architecture rule 1 now permits a Base44 read-only Visual X cockpit but keeps the X1 control plane completely independent. Rule 2 (one queue/worker authority) and rule 3 (preview-first releases) unchanged.
2. X1 binds in Vercel production only with X1_PRODUCTION_BINDING_ENABLED === "true", exact staging Supabase URL and the existing server-side anon/service-role key presence. No any-URL exception.
3. Production mutations require separate X1_PRODUCTION_WRITES_ENABLED === "true"; default OFF. Preview dispatch in production additionally requires X1_PRODUCTION_DISPATCH_ENABLED, X1_PRODUCTION_DISPATCH_AUDIT_ENABLED and existing fencing/worker readiness, and inserts pre-enqueue and post-readback audit receipts. Default OFF. Does not deploy production sites.
4. Read-only Visual X token has format x1vx_ plus 43 base64url characters from 32 cryptographically random bytes. X1 checks only SHA256 in existing staging x1_service_auth_hashes service_name visual-x-read, active true, constant-time comparison. Revoking active=false stops access immediately. X1_VISUALX_READ_ENABLED and fixed X1_VISUALX_TENANT_ID required. Token plaintext belongs ONLY in Visual X backend secret store.
5. Read-only routes: health, worker-status, work-items, operator-status, browser-health, agent-sessions, prompt-assets. Every accepted read requires ACTIVE tenant + audited receipt in existing x1_audit_receipts with readback, or fails closed. Session listing for service omits chat content. Visual X token is explicitly blocked on work-items POST, prompt-assets POST/PATCH, agent-chat POST and prompt-evaluate POST even if writes enabled.
6. HTML CSP frame-ancestors allows self and https://visual-x1.base44.app; former X-Frame-Options blanket removed. Existing portal/admin/api noindex and global nosniff/referrer controls preserved.
7. CORS unchanged: Base44 calls are server side. No second scheduler, queue, registry, heartbeat or supervisor created.
8. Prompt evaluate remains **NOT AVAILABLE IN PRODUCTION — local runtime only**.

## Environment names and provisioning state
- X1 production SUPABASE_URL: present but identity UNKNOWN; do NOT change without provider owner verification. SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY: present metadata only, identity unknown.
- X1 production X1_PRODUCTION_BINDING_ENABLED: NOT SET.
- X1 production X1_VISUALX_READ_ENABLED: NOT SET.
- X1 production X1_VISUALX_TENANT_ID: NOT SET.
- X1 staging x1_service_auth_hashes row for visual-x-read: NOT PROVISIONED by this mission.
- Visual X backend X1_VISUALX_READ_TOKEN: NOT SET.
- Visual X backend X1_VISUALX_TENANT_ID: NOT SET.
- X1 production X1_PRODUCTION_WRITES_ENABLED: NOT SET (leave disabled).
- X1 production X1_PRODUCTION_DISPATCH_ENABLED: NOT SET (leave disabled).
- X1 production X1_PRODUCTION_DISPATCH_AUDIT_ENABLED: NOT SET (leave disabled).
No environment variable or live database row was changed by this mission.

## Production baseline verified with real curl (2026-10-20)
- /api/x1/health HTTP503 {"service":"x1-staging-adapter","status":"UNBOUND","reason":"NON_PREVIEW_RUNTIME","writes":"DISABLED","dispatch":"DISABLED"}
- /api/x1/worker-status HTTP503 {"status":"BLOCKED","reason":"NON_PREVIEW_RUNTIME"}
- /api/x1/work-items HTTP503 {"status":"UNBOUND","reason":"NON_PREVIEW_RUNTIME"}
- /api/x1/operator-status HTTP401 {"status":"BLOCKED","reason":"AUTHENTICATION_REQUIRED"}
- /api/x1/agent-config HTTP503 {"status":"UNBOUND","reason":"NON_PREVIEW_RUNTIME","gpt":"DISABLED","dispatch":"DISABLED"}
- /v2/b HTTP200, X-Frame-Options SAMEORIGIN (old production).
NO live production read-only token request or 200 data response was verified.

## Test evidence (isolated clone in Base44 sandbox)
- First npm run check: 143 tests, 141 passed, 2 failed due to duplicate CSP and noindex header route objects. Repaired by merging headers on identical sources rather than deleting tests or weakening headers.
- Second npm run check: **PASS**, 143/143 node tests, 0 failures, vite build succeeded with 1611 modules. Build SEO policy returned NOINDEX_SAFE_DEFAULT, sitemapPublished false. Exact code commit tested: 73e0a556197625e47bc22787899b0c76799580fa.
- Visual X separate Base44 npm run build: exit 0, caniuse-lite data age warning.
- No live RLS or token credential tests; mocked deterministic tests only. No Guardian independent signed receipt yet.
- Browser parity blocker: downloaded Chrome Headless Shell v155, Puppeteer launch failed on missing libglib-2.0.so.0 in isolated sandbox. No parity image was fabricated.
- Production source path mismatch: architecture documents default main branch has README and not apps/strategic-minds-v2. Resolve prior to production release.
- Latest READY production metadata is NOT source commit release approval, and a production-target deployment 403 occurred on list_deployments.

## Responsive parity contract — required NOT YET CAPTURED
All screenshots full page at desktop1440/tablet868/mobile390, PNG in apps/strategic-minds-v2/public/v2-assets/parity. There are 36 captures for 12 URLs:
- v2-a: /v2/a
- v2-b: /v2/b
- v2-c: /v2/c
- v2-eden: /v2/eden
- pricing: /pricing
- portal: /portal
- launch-studio: /admin/launch-studio
- visual-studio: /admin/visual-editor
- agent-console: /admin/agent
- prompt-lab: /admin/prompt-lab
- coding-kanban: /admin/coding-kanban
- intelligence-workbench: /admin/intelligence
Filename template: {slug}-{desktop|tablet|mobile}.png. URL is not valid until binary PNG committed and production HTTP200 image readback verified.

## Acceptance checklist
- [x] Read mandatory docs, inspect repository and connected infrastructure.
- [x] Scope Base44 without control-plane dependency; rules 2 and 3 untouched.
- [x] Opt-in production staging binding and harden default production mutation.
- [x] Revocable per-tenant hashed service token and durable audited read access implemented.
- [x] Mutation rejection tests across four write families.
- [x] CSP allowlist and noindex preservation.
- [x] npm run check: 143/143 PASS on tested code SHA.
- [x] Visual X frontend/backend sandbox code updated; app build passed.
- [ ] Complete Base44 checkpoint and verify readback.
- [ ] Real tenant token securely provisioned, verified production 200 real read data.
- [ ] All 36 viewport PNG screenshots, source, dimension and served-URL readbacks.
- [ ] Independent Guardian browser, auth, cross-tenant, audit and RLS validation on exact release SHA.
- [ ] Resolve main-branch/app-root mismatch, approved prod release, rollback, verified post-deploy CSP.
- [ ] Deliberately publish Visual X and test server-only secret + iframe login behavior.

## Security and cost risk register
- CRITICAL: production SUPABASE_URL exact database identity unknown; do not arbitrarily repoint Marketplace credentials.
- CRITICAL: no independent end-to-end tenant/RLS/browser validation; production release barred.
- HIGH: no server-side rate limiting added to audited read token. Bound frequent calls with existing edge controls and monitor audit volume.
- HIGH: iframe framing is not identity; keep X1 own login protections and verify the exact allowlisted origin.
- MEDIUM: Vercel production main root mismatch blocks safe automatic deployment. Keep rollback pointer.
- COST: auditing every service read adds storage rows; no paid models invoked, no new worker or queue created.

## Handoff / continuity
Next: obtain Chromium-capable browser (e.g., existing authorized JARVIS Chrome) and capture 36 truthful full-page PNGs. Run independent Guardian validation against a preview deployment. Reconcile Vercel repo/branch/root/rollback. Approve existing active X1 tenant ID, issue 32-byte read secret privately, write only its hash to x1_service_auth_hashes and plaintext only to protected Visual X server secrets. Explicitly enable read-only flag after readback. Keep X1 production writes + dispatch DISABLED. Re-run npm check on final branch SHA, get release approval and deploy, read back status, JSON keys and CSP, and append release receipts here.
Hydrate using this file and original three contracts. Never claim live/independent acceptance from mocked tests. Cloud/local/GPT Project sync not verified.
