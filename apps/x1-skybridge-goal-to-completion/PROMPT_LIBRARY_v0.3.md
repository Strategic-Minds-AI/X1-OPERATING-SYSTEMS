# X1 Goal-to-Completion — Prompt Transformer Library v0.3.0
Mission: X1-SKYBRIDGE-UNIVERSAL-20261022
All prompts accept a mission_id, tenant, source revision, environment, permissions, known receipts, budget and stop conditions. No stage may assert tests ran without receipts. Each returns a typed work packet, failure state and next safe step.

## P00-INTAKE — One sentence to acceptance
Input: user goal, business/client, constraints.
Output: concise goal definition, target audience, user-facing artifact, acceptance tests, required approvals, data sensitivity, cost ceiling, explicit unknowns.
Rule: Do not invent verified credentials, prior consent or production authority.

## P01-DISCOVERY — Canonical rehydration
Inspect approved local canonical root, GitHub repository/branch/SHA, Vercel project and environment, Supabase x1_work_queue and leases, Railway worker and existing JARVIS heartbeat. Return evidence IDs and timestamps. No blanket file crawling.

## P02-ARCHITECT — Constraint-based solution
Compare existing X1 native adapters against Skybridge/Alpic, stateful agents and other orchestration choices. Select low-cost/free first; preserve queue singleton, idempotency, per-tenant auth, secret isolation and rollback. Reject duplicate schedulers.

## P03-BUILD — Branch and preview
Use only bounded sandbox or branch. Produce reproducible source, build commands, changeset, asset SHA and noindex preview. Never write live DNS, production config or real customer data.

## P04-REPAIR — Bounded self-repair
Reproduce issue. Record fingerprint, failing test, exact source SHA, candidate diff, rollback. Apply at most three reversible repairs to one authorized branch; rerun negative and regression suites. On recurrent fingerprint fail closed.

## P05-QA-INDEPENDENT — Guardian acceptance
Separate reviewer resolves source SHA independently; replays build/test, confirms desktop/mobile, auth denial, tenant isolation, dependencies, logs, performance and accessibility. Mark each hard gate PASS, FAIL, UNKNOWN or BLOCKED. Do not claim PASS from self-reported builder output.

## P06-HARDEN — Security and cost
Check OAuth issuer/audience/JWKS, token scopes, least privilege, RLS and tenant fences, command allowlists, injection, path traversal, idempotency, rate limits, cost/CPU caps and secret redaction. Require signed receipts.

## P07-RELEASE — Exact protected approval
Input exact deployment ID, SHA, preview QA receipt, owner approval target. Verify all hard gates. Promote only the tested artifact, then re-check public response, TLS, robots/sitemap and rollback route. Never infer approval from broad user intent.

## P08-ARTIFACT-VAULT — Source + evidence preservation
Capture tree SHA, package lock, build output, screenshots, validation receipts, local path and Google Drive destination if mapped. Use create-only, redownload SHA-256 readback, no secret inclusion.

## P09-DEHYDRATE — Permanent handoff
Update living workbook and HANDOFF.md with statuses, errors, linkability, cost, exact next action, retry fingerprint, pending approvals and original mission ID. Avoid scheduling duplicates.

## P10-UI-REVIEW — Visual validation
Perform true browser viewport emulation at 390px and 1440px; verify main interactive flow, no horizontal overflow, no console errors, accessible labels and screenshots. Captured screenshots alone are not a functional PASS.

## Stop and escalation policy
Always stop before production, DNS, billing, secrets, tenant grants, customer messages, deletion, unverified replay of dead-letter work, or any stage without required approval or hard-gate evidence. Run only existing X1 background workers; never promise continuing from ChatGPT without verified external leases.
