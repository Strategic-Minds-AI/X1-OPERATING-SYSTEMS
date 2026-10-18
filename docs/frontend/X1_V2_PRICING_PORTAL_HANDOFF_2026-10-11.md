# X1 Strategic Minds AI V2 | Pricing + Client Portal frontend
Date: 2026-10-11 | Workstream owner: Frontend GPT | Release: STAGING BRANCH ONLY

## Implementation
- /pricing: three proposed engagement categories AI Launch, AI Growth, AI Enterprise. Billable scope selector and a user-controlled proposal email draft. No fixed prices approved by operator, so all prices show Custom quote.
- /portal: branded client access gateway. SECURE SIGN-IN IS NOT AVAILABLE YET; only explicit synthetic demo.
- /portal/demo: full navigable demo Overview, Projects, Approvals, Lead Center, Creative Vault, Billing and Support. Local-only approval interactions, search and filtering, responsive mobile sidebar, and honest provider connection states.
- /v2/a, /v2/b, /v2/c: preserved original visual identity and enhanced navigation/footer to connect Pricing and Portal.
- All routes NOINDEX in staging. No new Base44 runtime dependencies or service access.

## Source of truth and handoff to Website Launch Engine GPT
Existing X1 canonical queue, Supabase tenants, Eden onboarding and approvals remain authoritative. Do NOT duplicate workers or replace the separate eight-question Eden onboarding with this frontend's older four-question demo. This handoff is not a live cross-chat message.

## Recommended tenant-scoped backend contract (not deployed)
Client: tenant_id, client_id, display_name, status.
Member: tenant_id, user_id, role (owner / billing_admin / reviewer / viewer), MFA and invitation status.
Project: tenant_id, project_id, scope_version, milestone, state, version.
Deliverable: tenant_id, deliverable_id, kind (logo_pack / brand_pack / web_pack / social_pack), preview reference, revision SHA, state.
Approval receipt: tenant_id, deliverable_id, revision, actor, signed decision, idempotency key, issued_at, receipt hash.
Lead: tenant_id, lead_id, consent reference, source, status, creation timestamp.
Agreement: tenant_id, agreement_id, scope version, signature provider receipt, state.
Invoice: tenant_id, invoice_id, payment provider verified status, amount_minor, currency.
Eden intake: reuse existing authenticated, versioned client responses with consent and X1 receipts.

All records and asset storage must enforce verified tenant memberships in Supabase RLS. Client browser must not set authoritative tenant IDs or expose service keys. Approval mutations require revision/version and actor checks, idempotency and durable receipts.

## Protected future sequence
1. Eden and CRM intake with customer consent and verified business identity.
2. Operator-approved scoped proposal with final terms and pricing.
3. Digitally signed agreement.
4. Deposit verified by Stripe webhook, not success redirect.
5. Tenant-scoped invitation and forced password reset, MFA/role review.
6. Project, pack previews, leads and invoices served only to the authenticated tenant.
7. Immutable pack approval receipts tied to exact asset versions.
8. Provision via single existing X1 supervisor and approved queue. No unsolicited outreach, spend, or production release.

## Proposed future adapters; NOT real endpoints
GET /api/client/me
GET /api/client/projects
GET /api/client/projects/:id/milestones
GET /api/client/approvals
POST /api/client/approvals/:id/decision
GET /api/client/leads
GET /api/client/assets
GET /api/client/assets/:id/link (expiring access)
GET /api/client/billing
POST /api/client/support
Eden sessions: integrate existing agent's consented eight-step profile flow, do not rebuild.

## Acceptance / release gates
Rebuild and test /pricing, /portal and /portal/demo at desktop/mobile. Test pricing toggles and proposal draft, portal synthetic-only navigation, local approval, lead/asset filters, no real billing records, accessible keyboard focus, reduced motion, and no sideways scroll. Test direct URL refresh in Vercel preview and noindex HTTP header. Draft only, do not merge X1 main or bind corporate domain without separate operator approval, secure backend and payment integration, and new independent QA.

Pricing package names and included examples are **proposed directions**, not approved public service commitments or legally binding entitlements.
