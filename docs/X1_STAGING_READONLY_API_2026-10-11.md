# X1 | Preview-only Vercel to Supabase staging API contract

**State:** BRANCH DRAFT. Authenticated runtime connection NOT ACTIVATED or independently verified. No production merge/release, no secret/env mutation, no client communication, no worker dispatch.

## Source
- Canonical GitHub repo: Strategic-Minds-AI/X1-OPERATING-SYSTEM.
- Work branch: feature/x1-staging-readonly-api-20261011.
- Based on locked V2 frontend branch feature/x1-visual-studio-multisandbox-20261011 at d000d2bb9e6e5f383879559f6e2aa280dd138dc2.
- Vite deploy root: apps/strategic-minds-v2. Existing visual components, assets and SPA rewrites untouched.
- Safe Supabase: X1 AI Hub Staging (uvdkzsbjackpjvpoxtyk); protected Supabase production: X1 AI Hub (vgsmyhqqtkkluhypxyua).
- Existing X1 queue: public.x1_work_queue; leases: public.x1_task_leases; no duplicate queue, worker, cron, or supervisor created.

## New routes
- GET /api/x1/health: configuration gate only. 503 UNBOUND until Vercel runtime is Preview/Development, SUPABASE_URL points exactly at X1 staging, and server credentials exist. 200 CONFIGURED_NOT_VALIDATED does NOT assert network/database/auth connectivity. Never returns secret values.
- GET /api/x1/operator-status: read-only. Requires bearer Supabase Auth access token and existing ACTIVE x1_tenant_memberships role OWNER, ADMIN, BUILDER or VALIDATOR, plus ACTIVE tenant. Multiple tenant memberships require X-X1-Tenant-ID, strictly matched to caller membership. Returns a bounded, explicitly sampled X1 staging queue status only. All other methods 405; no writes, queue enqueue, email or paid model calls.
- Server helper: apps/strategic-minds-v2/server/x1-staging.mjs. Do not import into browser/Vite client code. Never put service role into VITE_* or NEXT_PUBLIC_*.

## Observed live blockers
1. The Vercel Supabase Marketplace configuration icfg_KtCBJkzRht3cbiGespSdVQy0 is linked to X1's Vercel project, but its SUPABASE_* variables have Production target. Their database identity has NOT been proven and no value has been decrypted.
2. A separate Railway Vercel Marketplace configuration icfg_SqRzcZKCSYdNuenwReFi8Ia9 contributes some Preview PostgreSQL variables; these are not proof of Supabase staging credentials.
3. X1 Supabase staging x1_tenant_memberships currently has **zero records**. Therefore no real user can successfully exercise /api/x1/operator-status until a tenant owner is explicitly onboarded through approved Auth/role processes.
4. connector_bindings, missions, approval_requests and work_items currently contain permissive authenticated RLS policies with qual/with_check=true. Do not expose these through a browser and do not call this a finished tenant-isolated connector control plane. Existing x1_tenant_memberships and x1_work_queue are service-role restricted.
5. Vercel Preview currently lacks a confirmed complete, staging-scoped SUPABASE_URL/ANON_KEY/SERVICE_ROLE_KEY binding. Secrets/env changes require scoped operator approval and provider-native managed references.

## QA acceptance
1. npm run test in apps/strategic-minds-v2; examine the new staging test suite and existing visual frontend QA.
2. Preview deployment resolves /api/x1/health to real serverless code (not SPA HTML/404). If unbound, expect deliberate 503 UNBOUND, not 200 connected.
3. Negative tests: prod URL blocked, nonpreview deploy blocked, no bearer 401, forged token 401, missing membership 403, VIEWER 403, other tenant 403, multi-tenant ambiguity 409, upstream failure 503.
4. Before activation: verify exact Vercel Preview credentials target **staging** without exposing secrets, onboard one approved synthetic operator membership in staging, run real Auth->RLS->queue GET read-back, and collect independent receipts.
5. Backend draft-only mission persistence and full queue->lease->Railway->QA flow remain separately gated and unimplemented. Never claim autonomous software generation from this adapter.

## Rollback
Delete/revert this isolated branch, or stop preview deployment. No production baseline, database schema, secrets, or worker runtime was changed.
