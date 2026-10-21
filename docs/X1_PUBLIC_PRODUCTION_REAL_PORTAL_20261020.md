# X1 Real Production Conversion — Living Handoff, 2026-10-20

## User objective
Remove fake/demo customer experiences; provide a public marketing website and protected tenant-scoped real client portal, with live data and real operations. Never treat a demo as a real implementation or expose client content, secret keys, RLS-protected inventory, or worker controls publicly.

## Rehydrated source of truth
- Repository Strategic-Minds-AI/X1-OPERATING-SYSTEMS.
- This work branch feature/x1-public-real-portal-20261020, based on feature/x1-production-visualx-bridge-20261020.
- Vercel project x1-operating-system, project ID prj_PIDgTashnTCpsWbKUBCjHz55yXqT, www.strategicmindsai.com, current production unchanged.
- Previous handoff docs/X1_VISUALX_PRODUCTION_HANDOFF_20261020.md.
- Visual X Base44 app 6ad5e96eb2cfcf9aafe9f1df. Latest checkpoint 6ad75d33ab6699f8b6f84589.
- X1 staging Supabase uvdkzsbjackpjvpoxtyk has one tenant membership and 95 queue records; X1 production vgsmyhqqtkkluhypxyua has zero tenant memberships and six queue records. No duplicate queue provisioned.
- Vercel preview https://x1-operating-system-rbpp14qia-strategic-minds-advisory.vercel.app, initial exact source SHA e0468e1353254a7cc811cf098fc8d09544440803 (READY, no production alias).

## Actual source changes
- Replaced public client portal's synthetic approvals, leads, timelines, billing and interactive demo with genuine Supabase email OTP sign-in and authenticated tenant-scoped operator/work-item GETs. No fake live metrics and no speculative payments.
- /portal/demo redirects to /portal; links in Agent and Visual Studio route to real portal.
- Added /api/x1/status-public safe GET projection, probing existing Supabase table through server-only credential; does NOT expose table data, tenant ID, credentials or queue records. Does not infer database connectivity from environment variables.
- Added three negative/security tests and replaced former demo tests with real sign-in/tenant tests.
- Visual X backend bridge now includes public_status; status strip only marks LIVE_DATA_VERIFIED/read-verified payloads as positive. Base44 npm run build and lint PASS. npm run typecheck FAIL: 1215 pre-existing JSX TypeScript diagnostics across many components, not fixed.
- Visual X checkpoint 6ad75d33ab6699f8b6f84589, git 717aa33b5e1b6fb73e0063b5b72de3e5f90d3323.

## Verification
- X1 isolated npm run check at SHA e0468e1353254a7cc811cf098fc8d09544440803: **PASS** — 146 tests / 146 pass / 0 fail; Vite build succeeds; local SEO defaults noindex.
- Vercel READY preview source exact e0468e1353254a7cc811cf098fc8d09544440803.
- Live preview GET /portal HTTP200 SPA, GET /portal/demo HTTP200 SPA route (client redirect not verified in browser), GET /v2/b HTTP200 CSP frame-ancestors allows visual-x1.base44.app.
- Live preview GET /api/x1/health HTTP200 CONFIGURED_NOT_VALIDATED; only keys present; NOT connected proof.
- Live preview GET /api/x1/agent-config HTTP200 STAGING_CONFIGURED_NOT_AUTHENTICATED; public anon key only; model disabled.
- Live preview GET /api/x1/status-public **HTTP503 BLOCKED X1_UPSTREAM_REJECTED** from actual server-side Supabase GET. Therefore database service binding FAIL, real tenant login + data not verified.
- Vercel preview SUPABASE_ANON_KEY matches current staging Supabase publishable key. Preview SUPABASE_SERVICE_KEY has a nonstandard 64-character value (not recognized as Supabase JWT or sb_secret key). Production SUPABASE_SERVICE_ROLE_KEY exists as a sensitive variable but cannot be read back from connector. No secret values displayed or committed. Production SUPABASE_URL matches exact staging origin.
- Supabase DB queried only for table summaries (no production data mutation). Production Supabase has no tenant membership, so migrating to its tenant data without onboarding would fail.
- Independent Guardian invocation failed with provider schema error (422 instructions required). No independent QA receipt.
- No production variables changed; no production deployment or alias promotion.

## Release gates and TODO
- [x] Remove public demo entry and fake metrics, use authorized X1-backed portal, fail closed.
- [x] Add connectivity check and negative tests.
- [x] 146 X1 tests/build pass.
- [x] Visual X build and lint pass; checkpoint verified.
- [ ] Repair invalid preview Supabase SERVICE credential via provider-native scoped secret reference; prefer legitimate X1 staging service role, do not paste value in chat or source.
- [ ] Re-deploy preview and verify status-public HTTP200 LIVE_DATA_VERIFIED, then test actual authenticated tenant JWT, read-only workspace and revoked/other-tenant negatives.
- [ ] Get independent QA receipt on exact final source SHA with browser desktop/mobile, privacy, JWT, RLS, and function tests.
- [ ] Fix Visual X current typecheck (1215 diagnostics). Prioritize release-relevant paths; do not claim green.
- [ ] Finish live site SEO approval/configuration when production release passes; previews remain noindex.
- [ ] Resolve GitHub default main/app-root mismatch, exact-SHA release and rollback approval.
- [ ] Release verified production site, check HTTP status and JSON keys, collect permanent receipts.
- [ ] Publish Visual X checkpoint and verify bridge after correct tenant-bound token provisioning.
- [ ] Review synthetic generation pathway; do not strip mandatory synthetic/noindex warnings from preview canary or represent sample quotes as real rates.

## Security / cost
Never set production writes/dispatch or expose service_role publicly to fix a GET. Backend default remains read-only, with existing queue/scheduler unchanged. Public marketing can be open; admin/portal are authenticated. No external paid calls or production DDL, RLS or tenant grants made.

## Next executable
Use official Supabase provider-managed staging service secret and correct Vercel preview server binding with approval/credential scoping. Preview connectivity check is the first hard gate. After it passes, exercise actual tenant sign-in, independent validation, then production release.
