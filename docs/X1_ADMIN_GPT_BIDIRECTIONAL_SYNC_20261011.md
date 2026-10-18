# X1 Admin GPT Command Bridge | Branch-only integration contract

Scope: **X1 Operating System administrator** only. Existing approved X1 cosmic/silver/electric-blue front-end preserved.

## User experience
- Existing \`/admin/studio\` remains unchanged visually except a functional route link.
- New \`/admin/agent\` shares the studio rail, theme and images. Email-code sign-in uses X1 **Staging** Supabase Auth, never a browser-visible service key.
- A verified OWNER/ADMIN can chat, synchronize the tenant's durable transcript, inspect bounded X1 work status, and review the existing Apex Output Bus events.
- Backend \`GET /api/x1/agent-config\` advertises public anon key only once the preview staging identity is verified.
- Backend \`GET /api/x1/agent-chat?session_id=<uuid>\` verifies JWT and active tenant membership before reading that user's session and tenant output events.
- Backend \`POST /api/x1/agent-chat\` verifies JWT, OWNER/ADMIN, staging project, UUID session/request, message size and writes one idempotent user turn. GPT responses use an explicitly enabled, server-side Vercel AI Gateway binding and are persisted as one assistant turn. Duplicate request IDs cannot bill a model again.

## Important truth about GPT
The integrated assistant is a **GPT-model API session**, not an embedded copy of the signed-in user's private ChatGPT.com conversations or ChatGPT workspace. Vercel AI Gateway OpenAI-compatible route: \`https://ai-gateway.vercel.sh/v1/chat/completions\`; model default \`openai/gpt-5.4\`, overridable with a valid OpenAI model ID.

The bridge is bi-directional at the **X1 API/event level**: admin messages -> authenticated agent/session persistence and optional GPT, while X1 queue status and existing Apex Output Bus events -> admin conversation context and UI. A separate ChatGPT custom GPT/Plugin would need to authenticate using the same user-bound API (or a separately approved OAuth integration); it cannot read private ChatGPT chat histories. No second job queue, background task scheduler, or new "supervisor."

## Safety and unbound state
- All server routes require \`VERCEL_ENV=preview|development\`, EXACT \`SUPABASE_URL=https://uvdkzsbjackpjvpoxtyk.supabase.co/\`, server-side \`SUPABASE_SERVICE_ROLE_KEY\`, and \`SUPABASE_ANON_KEY\`.
- Default GPT is **OFF**. The operator must separately confirm budget and set \`X1_GPT_CHAT_ENABLED=true\` plus server-side \`AI_GATEWAY_API_KEY\` (or authenticated Vercel \`VERCEL_OIDC_TOKEN\`). These are permission- and spend-gated changes. Never put secret variables in \`VITE_*\` or browsers.
- The assistant cannot enqueue, modify, deploy, contact customers, merge branches, or approve production. Requests for work are review-only suggestions; never claim execution.
- Chat messages and GPT answers are stored in the **staging-only** \`x1_admin_chat_turns\` table. No direct \`anon\` or \`authenticated\` table grants, forced RLS, service-role-only insert/select. No outbound communication except explicitly user-initiated email sign-in OTP.
- Existing output bus \`apex_output_events\` is read-only; no duplicate \`apex_output_outbox\` insertion or privileged action route is created.
- No active X1 staging admin tenant memberships were observed as of implementation. An approved operator identity needs to be onboarded through existing Auth/membership governance. Do not invent or bypass identity.
- X1 Vercel preview bindings were not independently verified for staging, and the AI Gateway key was absent from the read-only variable metadata. Missing values return HTTP 503 \`UNBOUND\`, not an invented connected state.

## QA acceptance
1. Run branch CI \`npm run test\` + \`npm run build\` in \`apps/strategic-minds-v2\`, including role/tenant negative tests, GPT mock billing de-duplication, history and output-event sync.
2. Independently inspect Supabase staging migration, apply only to \`uvdkzsbjackpjvpoxtyk\` after readback/preflight; verify forced RLS and revoked anon/auth.
3. Verify preview login route and \`GET /api/x1/agent-config\`; in an unbound environment, HTTP 503 is a safe and expected result.
4. After operator-permitted managed staging identity binding, use a real admin Auth JWT and independently exercise GET and POST, SQL readback and cross-tenant denied tests.
5. Only after scoped AI budget approval bind server-side Vercel Gateway and test ONE bounded GPT request, verified receipt, model token usage and response in admin.
6. Screenshots at 1440x900 and 390x844, focus/click tests and parity review against existing \`/admin/studio\` before promoting.

## Rollback
- Revert this feature branch or turn off \`X1_GPT_CHAT_ENABLED\`. No production baseline or existing worker changed.
- Staging chat storage emergency rollback: \`ops/security/x1_staging_admin_agent_chat_ROLLBACK_20261011.sql\` revokes server write/read while retaining all transcript records (no data deletion).
- No protected production deployment without exact operator approval.
