# X1 frontend integration receipt | 2026-10-11

## Source truth and authority
- REPOSITORY: Strategic-Minds-AI/X1-OPERATING-SYSTEM
- WORKSTREAM: frontend visual only, no agent-worker runtime changes.
- INTEGRATION BRANCH: `feature/smai-v2-approved-frontend-import-20261011`, never auto-merge.
- SOURCE: `Strategic-Minds-AI/dominance-engine` branch `feature/smai-v2-cinematic-motion-20261011`, SHA `50a80252140fe3f39f7603c5214e93886b855dce`.
- PACKAGE: `apps/strategic-minds-v2/` self-hosted React/Vite V2 cinematic A/B/C variants, with zero Base44 SDK dependencies.
- APP HEAD AT IMPORT: `897dbf37323efca261c1aeb902559096a98dea73`.
- SOURCE DESIGN: dark cosmic Earth, chrome S, wordmark, HTML correctly spelled INTELLIGENCE IN MOTION, top oval blue navigation, green CALL EDEN on left, blue CALL NOW on right, motion with reduced-motion fallback.
- ORIGINAL EDEN PHOTO preserved byte-for-byte and independently repository-blob-addressed: `public/v2-assets/eden-skye-original.avif`.

## Three independent validation passes on JARVIS-COMMAND
Authorized local QA checkout:
`C:\_Strategic_Minds_AI_OS\12_Stratetegic_Minds_AI_CORPERATE SITE\STRATEGIC MINDS 2.0\01_FRONTEND_VISUALS\X1_FRONTEND_STAGING\apps\strategic-minds-v2`.
Each fresh pass included `npm run check` and `node tests/browser-journey.mjs`. All ran from the standalone X1 checkout.
- PASS 1: 7 unit/source checks, Vite production build PASS, **42 Chromium functional assertions** PASS, 3 variants at 1440x900 and 390x844, interactive mobile menu, full 4-step demo discovery, OS reduced-motion.
- PASS 2: same separate production build + 7 checks + 42 browser assertions, PASS.
- PASS 3: same separate production build + 7 checks + 42 browser assertions, PASS.
- Automated browser snapshots per variant and device retained locally under `qa_e2e/screens/`.
- IMPORTANT: a cached HTTP 304 was initially considered a false test failure; corrected assertion accepts 200/304 and passes fresh reruns. Record it honestly; no 500 or route outage was observed.
- CI workflow in `.github/workflows/x1-smai-v2-frontend.yml` is staged. Its actual provider-hosted PASS must be verified independently; local runs do not certify GitHub CI or Vercel.

## No-build-duplication, integration boundary
The Website Launch Engine agent is independently building an **eight-question** progressive Eden onboarding in development. **DO NOT overwrite that workflow** with this temporary, client-only four-question demo. Before release, consume its authenticated consent-safe profile/API adapter and replace the demo when validated.
- Current demo only opens user-triggered email drafts; it does not write CRM or send email.
- CALL EDEN phone number is proposed but voice routing/HeyGen are not integrated or verified.
- Preview selector is manual, not actual randomized A/B conversion analytics.
- The expected runtime is X1/Supabase/Railway; the frontend is pure Vite independent of Base44, with no new worker, queue, duplicate supervisor, secret or cron.
- SEO preview remains noindex (edge header, robots and meta). Public SEO release needs a separate approved, indexable site architecture.

## PR release acceptance
- Preview must be deployed from X1 repository branch and verify exact source SHA.
- Verify 3 full acceptance runs of the **deployed** preview before calling it production ready. The 3 PASSES documented above are local, pre-deployment.
- Manually verify 3 screenshots for pixel parity, accessible controls, working tel/mail links, status disclosure and customer data privacy.
- No production, billing, DNS, live posting, emails, integrations or main-branch merge without scoped operator authorization.

## Recommendation
Mount V2 as the **public marketing shell** of X1 and use existing mission/queue runtime for client onboarding after owner approval. Do not create an additional second backend or try to import the old Base44 application tree.
