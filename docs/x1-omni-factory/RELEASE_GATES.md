# Independent Release Gates
G00 exact repo SHA + current deployment captured
G01 client data/consent complete, no secrets in source
G02 3 cited industry benchmark websites
G03 50 domain candidate statuses backed by registrar checks
G04 10 REAL DESKTOP + 10 REAL MOBILE mockup exports + 10 logo assets
G05 design selection version and approval
G06 Supabase tenant RLS plus admin/client auth
G07 unit, integration, E2E browser checks
G08 CRM lead write attribution and idempotency
G09 estimate/proposal/invoice rate-card consistency
G10 Stripe sandbox checkout and signed webhook replay/failed-payment tests
G11 verified channel consent / opt-out / human handoff
G12 WCAG 2.2 AA accessibility
G13 measured CWV evidence
G14 robots/sitemap/canonical/schema files and route coverage
G15 actual verified GSC property and GA4 instrumentation
G16 original useful service/location content and image rights
G17 visual diff against approved mockups mobile and desktop
G18 secret scanning, dependency/security/rate limits
G19 rollback, retention, backup and recovery receipt
G20 independent Guardian signed report >=95 target, zero critical FAIL
G21 staged client walkthrough and signed acceptance
G22 scoped production publish approval and post-release verification
All begin NOT_RUN, never pass without receipts. Gate G04 requires actual generated image assets (mere design descriptions are insufficient).
