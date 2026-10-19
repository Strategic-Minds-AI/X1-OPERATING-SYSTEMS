# X1 staging integration runbook — 2026-10-18

## Canonical environment mapping

- Vercel project: `x1-operating-system`
- Source repository: `Strategic-Minds-AI/X1-OPERATING-SYSTEMS`
- Staging Supabase project: `X1 AI Hub Staging` (`uvdkzsbjackpjvpoxtyk`)
- Staging origin: `https://uvdkzsbjackpjvpoxtyk.supabase.co`
- Production Supabase project: `X1 AI Hub` (`vgsmyhqqtkkluhypxyua`)

## Required Vercel variables

For Preview only:
- `SUPABASE_URL` must equal the staging origin above.
- `SUPABASE_ANON_KEY` must be a publishable/legacy anon key from the staging project.
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SERVICE_KEY` must be a valid service credential for the staging project, server-side only.

For Production:
- Keep production Supabase variables bound to the production project.
- Never copy production service credentials into Preview.
- Never expose service credentials via `VITE_*`, `NEXT_PUBLIC_*`, browser responses, logs, or source control.

Branch-scoped Preview variables override the general Preview variables. Audit and align all remaining branch overrides before considering Preview globally consistent.

## Validation contract

1. `GET /api/x1/health` returning `CONFIGURED_NOT_VALIDATED` proves only that the required variable names are present and the origin/runtime guard passed. It does not prove connectivity.
2. `GET /api/x1/health?deep=1` performs one fixed, zero-row, read-only PostgREST request using the server-side staging credential. It returns only a generic pass/fail result and never returns rows or credential values. It is staging-preview-only.
3. `GET /api/x1/agent-config` returning `STAGING_CONFIGURED_NOT_AUTHENTICATED` confirms the server recognizes the staging origin and publishable key, but does not prove privileged database access.
4. `GET /api/x1/operator-status` without a bearer token must return 401.
5. A malformed bearer token must return 401 `AUTH_INVALID`, including Supabase Auth responses using HTTP 403 `bad_jwt`.
6. A positive operator-status test requires a real Supabase Auth access token and an explicitly provisioned active staging tenant membership with an allowed role. It must never be faked by using service credentials as a user token.
7. Verify the service credential with a read-only staging query, then test tenant isolation, missing membership, viewer role, cross-tenant denial, upstream failure, and ensure writes/dispatch remain disabled.
8. Run tests/build on the PR Preview and perform independent validation before production promotion.

## Current verified status

- The general Vercel Preview `SUPABASE_URL` was set to the staging origin.
- The general Vercel Preview `SUPABASE_ANON_KEY` was set to the staging publishable key.
- A legacy branch-scoped Preview URL override was aligned to the staging origin.
- A fresh Preview deployment from `test/x1-intelligence-scan-boundaries-20261018` reached `READY`.
- Its health route returned `CONFIGURED_NOT_VALIDATED`; its agent-config route reported the staging origin.
- Supabase Auth returned HTTP 403 `bad_jwt` for a deliberately malformed bearer token. The API adapter originally translated this to 503; the accompanying patch normalizes it to 401 and adds a regression test.
- The staging service credential still requires a successful read-only database probe. The existing Preview `SUPABASE_SERVICE_KEY` has not been proven to be a valid key for the staging project. Do not reuse production credentials to bypass this gate.
- No production environment variables or production database objects were changed by this work.
