# X1 Visual Studio | Source-truth benchmark and product research
Date: 2026-10-11. Scope: v0.app, Base44 and Bolt.new. Public/documented features only. **No claim about proprietary model weights, prompts, internal algorithms or unpublished architecture.**

## Executive decision
Build an **owned** Vite/React frontend with split-view AI chat and visual canvas, backed by the **existing X1** Supabase tenant identity and mission/queue ledger, GitHub as authoritative code, Vercel Sandbox isolated per task/chat branch, Railway as the existing durable worker, Vercel for preview hosting and AI Gateway/AI SDK for LLM routing. Xtreme Cloud Browser supplies headless screenshots and click-path QA, NOT a substitute for isolated code execution. Do not create a second X1 supervisor.

## Primary sources checked
- v0 https://v0.app/docs : natural language full-stack app generation, design iteration, GitHub and Vercel integration.
- v0 https://v0.app/docs/sandbox : real isolated Vercel Sandbox per chat, shared filesystem, dev server, terminal and code, preview, idle lifecycle, production isolation, max session length, optional network policy.
- v0 https://v0.app/docs/design-mode : select a DOM element in live preview, stage style changes, undo/redo, before-after, apply as reviewable new version. Design Mode not on mobile and not in read-only chats, per docs at time of research.
- v0 https://v0.app/docs/code-editing : editor syntax highlighting, diffs, global search and save/reset.
- v0 https://v0.app/docs/github : branch-per-chat, automatic code commits, PR review, GitHub source of truth, protected main.
- v0 https://v0.app/docs/agentic-features : web/browser use, bash commands, testing and diagnostics, MCP and integration connectors, Ask/Auto/Full agent permissions.
- v0 https://v0.app/docs/ai-models : Vercel AI Gateway model access.
- Base44 https://docs.base44.com/sdk-getting-started/client : preconfigured @base44/sdk client, auth, entities; backend service-role privileges are available in hosted functions but not on external backends. Lock-in risk is **documented SDK dependency**, not a claim that Base44 cannot export code.
- Base44 public editor surface: https://base44.com . Need authenticated UI verification for specifics. We have not inspected Base44 proprietary source or authenticated workflow; status UNKNOWN.
- Bolt https://support.bolt.new/building/quickstart : chat prompt, live preview, selector-based edit, backup/restore, code view, publishing and built-in auth/database flows.
- Bolt https://support.bolt.new/faqs/troubleshooting/webcontainer : Bolt's browser-based runtime uses StackBlitz WebContainers. Different from v0's VM sandbox.
- Vercel https://vercel.com/docs/sandbox and https://vercel.com/docs/vercel-sandbox/concepts/snapshots : SDK-powered isolated execution, run commands, provision developer servers and snapshot files/dependencies; snapshots stop the sandbox.
- Vercel https://vercel.com/docs/ai-gateway/sdks-and-apis and https://vercel.com/docs/ai-gateway/authentication-and-byok : provider-compatible gateway, streaming and auth via OIDC or server-side key.
- Vercel https://vercel.com/kb/guide/ai-gateway-and-ai-sdk : multi-tool agents, Sandbox, Workflow SDK for durable resumable tasks, scoped external credentials.

## Evidence-based comparison
| Capability | v0 | Base44 | Bolt | X1 design decision |
| --- | --- | --- | --- | --- |
| Natural language prompt-to-app | Officially documented | Official platform product; implementation details not independently tested | Official quickstart documented | Prompt -> typed mission draft |
| Chat left / live preview right | Documented chat and preview surfaces | Visual behavior requires authenticated browser evidence | Quickstart live preview | Persistent side-by-side workspace |
| Select visual element for edit | Documented Design Mode | UNKNOWN pending authenticated verification | Documented selector | Inspect selection, DOM map, versioned patch |
| Real isolated code execution | Per-chat Vercel Sandbox, official docs | UNKNOWN sandbox runtime internals | StackBlitz WebContainers, documented | Per-task Vercel Sandbox with isolation/leases |
| Direct code editing | Officially documented | SDK/code tooling, editor needs independent verification | Officially documented code view | Monaco editor and file navigator, Phase 2 |
| Git branch/PR/source ownership | Officially documented | Export/Git abilities vary by plan; verify current docs | Version history, export | GitHub is canonical, never Base44 code |
| Live backend | Supports backend integrations | Preconfigured Base44 SDK and hosted functions documented | Built-in database/auth demo | Existing X1 Supabase + Railway, not replicated |
| Agent scheduling while user sleeps | Multi-step agent tools documented; persistence limits per runtime | UNKNOWN | UNKNOWN | Existing durable X1 queue/reconciler, bounded scopes |
| Voice-first operator input | No general parity claim verified | UNKNOWN | UNKNOWN | Browser dictation first, server STT optional later |
| Transparent spend/receipts | Vercel deployment tooling documented | UNKNOWN | Token meter documented | Budget+leases+artifacts per job |

**No numerical product scores assigned.** Live authenticated workflows, comparable task trials, accessibility, timing/cost, security, and pixel screenshots are not fully verified. Missing verification is UNKNOWN, not a fail or an imaginary 100% parity pass.

## What to borrow and what to avoid
**Borrow as functional patterns:** v0 per-chat VM, design selection and version history; Base44's approachable natural-language editing; Bolt's simple selector prompt and restore; GitHub branch/PR integration; editor modes (Preview/Code/Diff/Console); mobile-safe controls.

**Avoid:** Base44 SDK in generated X1 apps, proprietary v0/Bolt/Base44 assets or exact copyrighted source, WebContainers running production credentials, direct agent access to live tenant databases, trusting iframe DOM or user content, crossing project/tenant sandbox boundaries, duplicate supervisors, opaque overnight spend, silently released deployments.

## Not observed / blocked
- No authenticated internal Base44 editor session was available in this research; proprietary stack, internal prompt system and agent orchestration cannot be asserted.
- Public v0 browser landing page can show marketing functionality, but does not prove a logged-in session's internal sandbox configuration.
- The X1 visual admin currently ships a **design sandbox simulation**; real Vercel Sandbox, AI Gateway, voice provider, GitHub changes and overnight agent schedules are not connected until verified server-to-server adapters exist.
- X1's feature/canonical-os-convergence-20261011 source (AGENTS.md, docs/X1_SOURCE_TRANSFER.md and src/providers.mjs) explicitly reports runtime providers UNBOUND in repo and the original Digital Dominance visual editor not yet running inside X1. Keep this finding visible to the other X1 GPT.

## Release implication
Do not market X1 Visual Studio as v0 parity until authenticated chat/tool routing, real sandbox provisioning, visual source mapping, branch changes, CI/browser validation, cost budgets and overnight recovery have completed receipts. The initial frontend is functional as a UI and change-spec builder only.
