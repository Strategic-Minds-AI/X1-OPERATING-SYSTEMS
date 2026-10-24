# X1 Universal Capability Fabric — Clone / Refactor / Move Architecture
**Status:** VERSIONED DESIGN + NON-DEPLOYING CONTRACT | 2026-10-23
**Owner:** Strategic Minds AI | **Target:** existing X1 Operating Systems admin
**Authority:** Existing X1 Supabase queue / leases / idempotency / receipts, NOT a new queue
**Source baseline:** \`X1-OPERATING-SYSTEMS@0994f0393619777cb701b9a6193c3d340bc706ba\`
**Browser donor:** \`strategic-cloud-browser\` PR #6 at \`da0497fdded34d619bd46dd5653e0e5e4bf84fcb\` (7/7 CI PASS, hosted sandbox FAIL/UNKNOWN)
**Legacy X1 AI Browser donor:** \`x1-ai-browser\` (contains old --no-sandbox engine; never import that launch policy)
**Action authorization:** branch-only architecture/design/contract; NO cloud create, secret migration, DNS, billing, merge, production deployment or database write.

## 1. Outcome / definition of done

Deliver ONE X1 user interface and ONE authoritative control plane that turns a plain-language objective into a **versioned, tenant-scoped mission**, capability graph, agent plan, approvals, execution leases, validation artifacts and resumable business outcome. The operator sees each step, status and evidence. Keep the browser, coding, scraper, design, LLM and communication engines as independently isolated workers accessible through a common capability contract.

**Do not define "all-in-one" as one Docker container or one giant autonomous agent.** The admin/control API is the unifying surface; security-sensitive browser and code execution remain isolated. Claimed 24/7 autonomy requires a real existing scheduler/worker with verified heartbeat, queue lease and receipt. Features are discoverable by manifests, not magically installed without authenticated permissions.

Success is: a mission can be resumed after worker crash or redeploy without double execution; two tenants cannot see one another's data; approvals and provider authorization are enforced; secure worker sandbox is proven; a restore drill and a rollback drill both pass; metrics are measured and independently signed.

## 2. Verified existing vs proposed ownership

| Plane / responsibility | Canonical owner | Current evidence | Change strategy |
|---|---|---|---|
| Admin, client portal, visual editor, prompt lab | Strategic-Minds-AI/X1-OPERATING-SYSTEMS | Existing admin app + architecture docs; code has staged features | Import a Browser workspace panel and common evidence UI, NOT entire browser backend |
| X1 job authority, leases, idempotency, receipts | Existing X1 Supabase queue and X1 control plane | X1 docs name it canonical; x1-control-plane default repo server is a DRAFT_ONLY minimal bridge | Verify actual live table/rpc/lease/worker before enabling dispatch; never create shadow queue |
| Browser API | Strategic-Minds-AI/strategic-cloud-browser | PR #6 passed 7/7 disposable CI; API staging historically healthy | Keep as versioned X1 Browser Execution Adapter; do not re-implement browser auth/session owner in frontend |
| Browser execution | Secure isolated browser worker | Old Railway engine uses --no-sandbox; two secure rollout health checks failed | Require non-root Chromium sandbox, EGRESS firewall + actual live host tests; no fallback to unsafe host |
| MCP gateway | ONE X1 MCP facade/namespace with OAuth, tool scopes and approval policies | An older CloudBrowser MCP endpoint and Base44 gateway exist; X1 link not operational, separate 401 | Compose adapters behind ONE X1 MCP edge; bridge via explicit versioned tool schemas; retain old endpoint read-only during cutover |
| Code build workers | Existing X1 swarm/Railway workers + disposable sandboxes | Worker repo contains READ_ONLY preview handler per prior audit | Upgrade through staged scoped actions + Guardian, not auto-run arbitrary code in app process |
| SQL source of truth | Supabase X1 tenant/business queue; Railway Browser Postgres browser-session ownership as needed | Both storages appear in documented legacy setup, not a shared distributed transaction | Canonical job lifecycle resides ONLY in X1 Supabase; browser database is subordinate execution state, sync by outbox/receipt IDs |
| Evidence vault | Approved X1 local and cloud artifact vault | JARVIS canonical folders known; Drive sync not verified now | Immutable object hashes, manifest, retention & read-back receipt; no plaintext secrets |
| Provisioning | Existing GitHub/Vercel/Supabase/Railway connectors | Connected permissions vary by account; Railway connection currently INVALID_LINK | Capability-specific OAuth with least privilege, scoped approval and observable provider receipts |

Do **not** replace operational database tables or duplicate schedules before inventory proves exactly one canonical queue and a working worker. X1's \`x1-control-plane\` default branch currently serves only a draft-only bridge, so the fully live control-plane claim needs live verification.

## 3. Target topology

\`\`\`mermaid
flowchart TD
 U["Owner / Client / ChatGPT"] --> UI["X1 unified Admin + Client Portal"]
 UI --> EDGE["X1 Identity + OAuth + API Gateway + MCP facade"]
 EDGE --> POL["Tenant RBAC + Policy + Approval Engine"]
 POL --> WF["Universal Goal/Workflow Compiler"]
 WF --> QUEUE["CANONICAL X1 Supabase Queue + Leases + Ledger"]
 QUEUE --> AG["Single X1 Agent Dispatcher / Capability Registry"]
 AG --> B["Isolated Secure Browser Worker"]
 AG --> C["Disposable Coding Worker"]
 AG --> D["Discovery + Data Connectors"]
 AG --> L["LLM Router / Ollama / AI Gateway"]
 AG --> M["Marketing, CRM, SEO, Media and Comms adapters"]
 B --> EV["Evidence + Signed QA Receipts"]
 C --> EV
 D --> EV
 L --> EV
 M --> EV
 EV --> QA["Independent Guardian / Scoring / Regression"]
 QA --> UI
 QA --> RELEASE["Preview -> Permission Gate -> Production"]
 QUEUE --> OBS["Logs + Traces + Health + Cost Controls"]
 EV --> BACK["Artifact Vault + Backup Catalog + Restore Drills"]
 OBS --> UI
\`\`\`

**Railway communications:** Admin API issues a tenant-bound work packet to the **existing queue**. An authorized Railway worker claims a lease and calls internal versioned browser/worker APIs over private networking with service-to-service authentication; completion returns to the queue ledger with receipt ID. Remote ChatGPT MCP calls X1 facade over approved OAuth Streamable HTTP; avoid exposing the private browser engine, CDP port, database or unscoped x-api-key. No generic external HTTP proxy to run arbitrary Railway commands.

## 4. Versioned work packet / capability contract

Every mission has \`mission_id, tenant_id, actor_id, industry, services, product, geography, goal, success_metrics, budget_policy, legal_policy, data_classification, source_revision, idempotency_key, required_capabilities, dependency_graph, approval_state, expiry, rollback_pointer\`.

A **capability** manifest exposes \`id, version, owner_service, provider, action_class, input_schema, output_schema, tenant_scope, scopes, max_runtime_ms, max_cost_usd, rate_limit, concurrency, prerequisites, negative_tests, evidence_requirements, fallback_policy\` and a health/readiness probe. Registry entries are declarative; only independently bound providers become \`CONNECTED\`. Discovered=not installed; installed=not authenticated; authenticated=not successfully executed.

State machine: \`DRAFT -> PLANNED -> APPROVAL_REQUIRED / QUEUED -> LEASED -> RUNNING -> VALIDATING -> SUCCEEDED / REPAIRABLE_FAILURE / TERMINAL_FAILURE / BLOCKED\`. Leases have an expiry and unique fencing token; retries are idempotent with bounded exponential backoff and dead-letter after a small cap. Each transition writes an append-only receipt with provider trace and source SHA. External side effects use **outbox + idempotency keys**, never at-least-once blind replays.

Agent roles: Intake/Goal Interpreter, Discovery & Evidence, Architect/Benchmark, Workflow Compiler, Security/Policy, Resource/Cost Planner, Execution Orchestrator, Specialist Worker per capability, Independent QA/Guardian, Bounded Repair, Backup/Recovery, Documentation/Handoff, Release Operator. Agents submit work to ONE dispatcher and share read-only evidence; Guardian cannot self-sign builder outputs. A single agent may perform multiple roles only where independent-signature constraints do not apply.

## 5. Universal system modules, staged activation

- **Foundation:** tenant identity, OAuth + per-tool scopes, permissions, quotas, secret references, immutable source/artifact versions, audit ledger, plugin/MCP capability registry.
- **Intelligence:** model router (OpenAI/AI Gateway/local Ollama), prompt transformer + Prompt Lab versioning, RAG with source citations and data provenance, eval/scoring simulator, deterministic rules engine, document/content/media analysis.
- **Autonomy:** goal-to-DAG compiler, scheduler/lease binding, typed agents, bounded worker retries, self-heal only on allowed change classes, policy-aware approvals, kill switch, cost guard, graceful handoff.
- **Execution:** secure browser with screenshots + accessible DOM, scraper with legality/robots/license gates, sandboxed coding builder, visual editor, website generator, test runner, GitHub/Vercel/Railway/Supabase adapters.
- **Business:** CRM, lead intake, Digital Dominance SEO/AEO/GEO, analytics/Search Console, communications (Telnyx when bound), e-commerce/Shopify, service verticals (epoxy/concrete etc.), research/property intelligence with privacy & regulatory restrictions.
- **Experience:** top-down operator evidence board, mission timeline left-to-right, recommended next action, approval queue, budgets, live QA score with evidence, tenant/client views, alerts, receipt export.
- **Reliability:** trace IDs, provider receipts, error budgets, circuit breakers, queue backpressure, host health, hard budget/concurrency ceilings, backup checks, replay/recovery drills.

Each module ships disabled until capabilities are authenticated and tested, not simply because its UI is visible. AI may recommend changes, but must not autonomously mint permissions, spend, publish, contact customers, alter production, or override approvals.

## 6. Clone and move, NOT a destructive big-bang rewrite

**Source donor classification**
1. Clone from \`strategic-cloud-browser\` exact PR6 SHA as a **read-only export/source baseline**. Do not clone its environment variables, sessions, users, keys, Postgres volume or browser/CDP addresses.
2. Inspect \`x1-ai-browser\` and original CloudBrowser/Base44 for functional contracts and operator UI patterns only; retire duplicate engines after one validated X1 route exists. Old \`--no-sandbox\` logic is rejected.
3. Add an adapter package/module inside X1 Admin backend that calls the existing browser API on a versioned contract; keep the actual runtime in its isolated repository until proven stable.
4. Pin required browser API SHA and semantic version in a source manifest. Do not auto-sync unreviewed commits.
5. Run **shadow READ_ONLY** comparisons with synthetic sessions (never production data) against baseline; exact request IDs, screenshots and error classification.
6. Route a single staging approved test mission through X1 queue -> Railway worker -> secure browser -> receipt -> Guardian. Cutover only after live positive and negative tests.
7. Roll out progressively: synthetic 1 -> internal 10 -> selected clients with approval -> broader concurrency after metrics meet gates. Old routes remain opt-out until verified, then sunset with reversible rollback pointer.
8. Refactor one domain at a time. No full repository code copy into UI; no double MCP gateways, duplicate schedules, or second stateful queue.

Migration mapping:
\`\`\`
Original CloudBrowser Gateway       -> X1 MCP/browser adapter (schema + scopes)
CloudBrowser sessions/actions      -> Isolated Browser Worker (private)
CloudBrowser project API keys      -> X1 OAuth/workload identity (rotate, don't copy)
CloudBrowser screenshots/receipts  -> Encrypted X1 Evidence Vault + content hashes
CloudBrowser jobs                  -> Existing X1 queue work packets (not second queue)
CloudBrowser admin visuals         -> X1 operator evidence board
CloudBrowser runtime configuration -> per-environment provider references (no values in git)
\`\`\`

## 7. Security, hardening and zero-trust controls

- **Execution isolation**: browser and code runner separately isolated from control API; non-root Chromium sandbox enabled; required userns/seccomp features independently tested. No \`--no-sandbox\`, public CDP, arbitrary Node evaluate, privilege escalation or internet-capable shell in shared control process.
- **SSRF**: validate URL syntax, redirect hops and every A/AAAA resolution, block metadata/private/loopback addresses at **socket egress boundary**. App DNS preflight alone has TOCTOU risk. Deny arbitrary WebSockets until protected.
- **Identity**: OIDC/OAuth user identity, workload identity and short-lived scoped tokens; keys stored as secret references, redaction in logs, rotation, per-tenant RBAC/RLS, deny-by-default MCP tool policy.
- **Data**: encryption in transit and at rest, separate tenant object prefixes/KMS boundaries, attachment scanning, retention/redaction, audit receipts with immutable hashes. Never log cookies, browser auth state, customer secrets or full PII.
- **Prompt/tool safety**: retrieved sites are untrusted instructions; browser content cannot alter agent privileges or provider tool grants. Approval required for purchases, production, credentials, irreversible actions and customer outreach.
- **Supply chain**: dependency lockfiles, pinned base images/digest, SBOM, vulnerability/secret scans, signed build provenance where feasible, CI restricted writes, PR protection and independently reviewed exact SHA.
- **Safety controls**: kill switch \`X1_BROWSER_ENABLED=false\` or service-level deny, bounded URL allowlist for canary, quota defaults, safe unknown state, safe rollback. Never retry failed unsafe side effects blindly.

## 8. Reliability, backups, disaster recovery and growth

**Existing system first:** inventory provider backup schedules and existing X1 Supabase project snapshots; DO NOT toggle backup billing/settings or create replacement databases until scoped approval.

Minimum target **three complementary backup layers**:
A. Provider-native snapshot schedules for persistent Railway/Postgres volume, plus Supabase-native scheduled backups where enabled. Railway daily/weekly/monthly retention is provider-defined; confirm plan costs and source state.
B. WAL/PITR for critical DB where supported and economically approved, storing restore window and recovery point receipts.
C. Encrypted **offsite logical PostgreSQL dumps** + independent artifact object backups with checksums, manifest, least-privilege archive account, retention and lifecycle.
D. Git pinned source plus IaC and config schema (not secrets), deployment metadata, dependencies/digests, queue offsets, immutable receipt archive.

A backup is not counted until a **restore to isolated test resource** is performed, app/tenant RLS and object hashes verified, and recovery outcome logged. Proposed (unverified) internal targets: RPO <=24h at initial low-cost tier, RTO <=4h for staging; stronger RPO <=15min/RTO <=1h requires WAL/PITR, HA, rehearsals and paid engineering/resources. These are design targets, NOT achieved guarantees.

Reliability sequence: heartbeat + readiness, queue lease expiration, circuit breaker, retry with backoff/jitter (max three bounded repair attempts), dead-letter audit, worker draining during deploy, checkpointable workflows, browser session TTL/cleanup, idempotency/fencing, error budgets, optional alternate vetted worker only if it enforces identical security policies. Auto-scaling from **queue depth and safe concurrency**, NOT unlimited agent spawning. Protect monthly provider/LLM spend with tenant budgets, thresholds and kill switch.

Failures and consequences:
- Single provider / no backup: outage or deletion cannot be recovered; mitigate offsite snapshots and restore drills.
- Duplicate queues/schedulers: double actions, wrong invoices and messages; enforce singular queue identity + fences.
- Unsandboxed browser: untrusted web content can escape intended boundary; fail closed and separate host.
- Stateless app storing browser session in memory: redeploy loses active session; persist metadata and rehydrate **new** bounded session with approvals rather than pretending original is alive.
- Too many agents: token costs, conflicting state and approval bypass; dispatcher coordinates bounded specialist tasks.
- LLM-only QA: inflated scores; hard tests and external Guardian receipts before promotion.

## 9. Benchmarks / adopted lessons (not a ranking)

- **User's existing CloudBrowser**: rich session, DOM, navigation, screenshot, contextual agent tooling + MCP; adopt interaction parity and familiar operator UX, but **do not** adopt old no-sandbox engine or ambiguous gateway auth.
- **Browserless**: official documented concurrent sessions, queuing, reconnect, cleanup and session pressure; adopt bounded concurrency, explicit close and backpressure. Reference: https://docs.browserless.io/enterprise/terminology
- **Railway MCP + private networking**: official hosted Streamable HTTP MCP with OAuth/short-lived access, and private \`.railway.internal\` service calls; adopt separation of public MCP edge from private browser execution. Reference: https://docs.railway.com/guides/mcp-server
- **Railway Postgres recovery**: provider documents volume snapshots, optional PITR, offsite \`pg_dump\` and restore drills; adopt layered recovery not single rollback button. Reference: https://docs.railway.com/volumes/backups and https://docs.railway.com/databases/postgresql

## 10. Trade-off decision / cost guard

| Option | Development complexity | Security/isolation | Scale & restore | Decision |
|---|---|---|---|---|
| One monolith, one container for all systems | Lowest initial | **Unacceptable** for untrusted browser/code execution | Shared blast radius | REJECT |
| All workers on ordinary Railway shared service without proven sandbox | Low | **Insufficient** for Chromium namespace/sandbox security | Multiple service units, still blocked | REJECT |
| Existing X1 control plane + private adapters + approved isolated execution worker | Moderate | Defensible after host attestation + egress | Can scale workers and recover independently | RECOMMEND |
| New Kubernetes stack/service mesh now | High | Possible but operationally expensive | More operational burden, duplicative | DEFER |

Do not claim low cost without provider metering; full HA, isolated browser VMs, offsite archives, premium DB PITR, hosted-model calls and external scrape providers may incur charges. Existing X1 sources and one queue reduce wasted integration and duplicate hosting.

## 11. Milestones: smallest useful increments with acceptance tests

| Stage | Scope | Acceptance, evidence and rollback |
|---|---|---|
| M0 SOURCE TRUTH | Read-only inventory of Railway workspace, GitHub branches, X1 Supabase queue/worker, existing MCP, current backups | Exact account/IDs/SHA, capabilities status, data flow, no secret copies. **Current Railway connector invalid: link_id not eligible linked account.** |
| M1 CONTRACT | Versioned manifest + one X1 browser adapter + UI evidence board skeleton on isolated branch | Lint/tests and exact SHA; no production. This document and manifest are first outputs. |
| M2 SECURE BROWSER | Provision/choose an already authorized sandbox-compatible isolated browser host | Actual \`chromiumSandbox:true\`, non-root, egress denials, liveness, screenshots on staging; no unsafe fallback |
| M3 AUTH/MCP | Canonical authenticated X1 MCP facade and scoped browser adapter | OAuth discovery, least privilege, API denied tests, correct client identity, no plaintext secrets |
| M4 DURABLE LOOP | Existing queue -> lease -> worker -> result -> independent Guardian -> receipt | One synthetic end-to-end job, 2-tenant denial, idempotency, 3-retry cap, cleanup |
| M5 RECOVERY | Snapshot config + offsite encrypted logical data/object archive + restore drill | Measured RPO/RTO, restored tenant rows, artifact hashes, worker resumption, rollback |
| M6 UNIVERSAL MODULES | Registry + prompt transformer + specialist agents + coding/SEO/comms adapters | 3 distinct industry scenarios (epoxy, legal lead intake with review, general SaaS), plugin permission gates, quality benchmark at agreed evidence-based thresholds |
| M7 SCALE | bounded load test and canary expansion | P95 latency and success error budget measured, memory/cost session, quota/circuit breaker; owner-approved progressive rollout |

**Mandatory release scoreboard (proposal):** 100% critical security/auth/tenant/backup-restoration checks PASS; no untested unsafe bypasses; functional/evidence-weighted score target >=95/100 measured across task completion, reliability, correctness, accessibility, privacy, cost efficiency and UX. A score never overrides a failed security hard gate.

## 12. Current blocker and next single action

The Railway connector that once accessed the specific X1 staging project now responds \`link_id must identify an eligible linked account\` even for \`whoami\`; a prior login also produced a viewer-role denial. **A project invitation alone does not restore the ChatGPT OAuth link.** Reconnect the Railway plugin in ChatGPT (Settings -> Plugins -> Railway) and authorize the exact workspace **Strategic Minds AI** and project \`efc36e26-1f26-47bf-bc74-b81d95e8f262\`. See https://docs.railway.com/ai/mcp-server. Upon provider grant, verify \`whoami\`, project/environment, staged state, variable **names only**, backup inventory, current service health, then continue M2. No secret values requested.

**No production deployment, paid spend, schema/RLS change, DNS update, bulk data movement, Git protected merge or external/customer actions are authorized by this architecture document.** Project sources stay recoverable; JARVIS hardware recovery hold remains active pending diagnostics.
