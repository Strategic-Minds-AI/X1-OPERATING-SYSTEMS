# X1 Brand Lock | Strategic Minds AI V2 Homepage Is Source of Truth
Date 2026-10-11 | Scope: X1 shared frontend theme | Status: Feature branch only

## Canonical source
The approved /v2/a home page V2Experience.css defines the only official color palette for public pages, client portal, pricing and X1 Visual Studio. Central shared tokens live in apps/strategic-minds-v2/src/BrandTheme.css and are imported by src/main.jsx.

| Token | Canonical value | Meaning |
| --- | --- | --- |
| --smai-canvas | #02050d | Entire page background |
| --smai-header | #02060f | Navigation/headers |
| --smai-surface | #030914 | Dark panels |
| --smai-panel | #061726 | Elevated cards/forms |
| --smai-cyan | #02cfff | Electric blue |
| --smai-blue | #128cff | Secondary blue glows |
| --smai-green | #66ff9c | Very sparse neon green |
| --smai-border | rgba(74,201,255,.5) | Blue outlines |
| --smai-white | #f6fbff | Main text |
| --smai-focus | #83ffb4 | Keyboard focus |

## Immutable brand assets
The upper-left S must be the same approved /v2-assets/silver-emblem.png across home /v2/a, /v2/b, /v2/c, /pricing, /portal, /portal/demo, /admin/studio. Never use a generic letter or replacement logo. Earth visual: /v2-assets/connected-earth.jpg.

## Color and atmosphere rules
Nearly black cinematic canvas should dominate. Cyan blue supplies navigation outlines, active elements, and glows. Green is limited to Eden/success/high-intent CTA accents. Elevated panels derive from the same midnight hue, not standalone slate/teal schemes. Each layout may vary but may not change the corporate palette. Design agents must use shared tokens, not guess visually similar HEX codes.

## Acceptance / visual QA
1. Browser screenshots for /v2/a, /pricing, /portal, /portal/demo, /admin/studio at 1440x900 and 390x844.
2. Computed base background must equal RGB(2,5,13). Shared root CSS variables match the exact values above. No horizontal overflow.
3. All five route families render the same S asset; test responsive layout and keyboard focus.
4. Independently inspect screenshots for major drift, not only CSS tests. No claim of 99% parity unless pixel diff measured.
5. Reduced motion must disable nonessential motion. Any regression in original approved homepage blocks release.

## Release status
Brand lock changes are confined to isolated X1 feature branch and noindex preview. No Supabase, Stripe, X1 queue, GitHub default branch or production site mutation is authorized by this visual work. Real AI agents and sandboxes are NOT connected to X1 Visual Studio yet.
