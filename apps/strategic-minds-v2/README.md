# Strategic Minds AI 2.0 | X1 Operating System frontend
This standalone public React/Vite site is the **approved cinematic marketing frontend** copied into X1 for staging. It is not the X1 agent backend, and it does not replace the Eden eight-question portal currently being developed by another agent.

## Run
From `apps/strategic-minds-v2`, run `npm install`, `npm run check`, then `npm run dev`.
For Vercel preview: set the project **Root Directory** to `apps/strategic-minds-v2`; build `npm run build`; output directory `dist`. The frontend uses its own assets under `public/v2-assets`; it has **zero Base44 SDK dependencies**.

## Routes and behavior
- `/` redirects to `/v2/a`.
- `/v2/a` cinematic mystery homepage, centered chrome S, clean CTA.
- `/v2/b` extended AI service/company homepage.
- `/v2/c` and `/v2/eden` Eden Skye portrait and a **four-question FRONTEND DEMO** discovery. This does not replace X1's independent authenticated progressive **eight-question** Eden onboarding; hand off/replace only after its adapter is QA-approved.
- CALL EDEN phone link: +1 866-571-1174. CALL NOW: +1 772-209-0266. Actual Twilio voice/HeyGen streaming remains unverified.
- Design has subtle neon-green highlights, electric-blue oval top navigation, cinematic Earth/chrome/stars motion. Motion disabled for reduced-motion OS setting.
- All contact information is voluntary; the demo only creates an optional user-triggered mailto draft, without a server-side CRM.
- Buttons formerly linking back to legacy /strategic-minds are mapped to routes in this standalone frontend.

## Release contract
No production merge, DNS or domain changes, API secrets, new crons, automated customer messaging, live social posting, or Base44 backend calls.
All routes are explicitly **NOINDEX** until a separately approved public launch, then move robots handling under release controls. Three independent round-trip validation passes and a working-frontend URL require actual CI/browser evidence, not a green build alone. Preview URL not yet provisioned for this new repo.

## Integration handoff to X1 and other GPT
- X1 agent: consume frontend as a standalone Vite package; DO NOT duplicate queue supervisors or override persistent workers.
- Eden agent: provide versioned authenticated API adapter for consented eight-step portal, research permissions, and on-server receipts.
- Backend owns database, research permissions, HeyGen, calls, analytics and delivery. Frontend emits `smai:v2-interaction` **browser events only** (not telemetry).
- Preserve accessible controls, focus states, reduced motion, privacy disclosures, synthetic test clients and staged release gates.
- Known issue: A/B/C links are **manual preview selector**, not traffic-randomized controlled trials.
- Provenance: Strategic-Minds-AI/dominance-engine, branch `feature/smai-v2-cinematic-motion-20261011`, source SHA `50a80252140fe3f39f7603c5214e93886b855dce`.
