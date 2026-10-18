// X1 branch-only release and security diagnostic gates.
// Pure, side-effect-free policy helpers. This module does NOT change deployments,
// credentials, policies, supervisor leases, or production data.
export const X1_TARGETS = Object.freeze({
  staging: "uvdkzsbjackpjvpoxtyk",
  production: "vgsmyhqqtkkluhypxyua"
});
const SHA = /^[a-f0-9]{40}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function assessDatabaseRoute(route) {
  const { runtime, supabaseProjectRef, target } = route || {};
  if (!["preview", "production"].includes(runtime)) return { status: "BLOCKED", code: "INVALID_RUNTIME" };
  if (!["staging", "production"].includes(target)) return { status: "BLOCKED", code: "INVALID_DATABASE_TARGET" };
  const expected = X1_TARGETS[target];
  if (supabaseProjectRef !== expected) return { status: "BLOCKED", code: "DATABASE_IDENTITY_MISMATCH" };
  if (runtime === "production" && target !== "production") return { status: "BLOCKED", code: "PRODUCTION_BOUND_TO_STAGING" };
  if (runtime === "preview" && target !== "staging") return { status: "BLOCKED", code: "PREVIEW_BOUND_TO_PRODUCTION" };
  return { status: "PASS", code: "ENVIRONMENT_ISOLATED" };
}

export function assessReleaseCandidate(packet) {
  const p = packet || {};
  if (p.deployTarget !== "production") return { status: "BLOCKED", code: "NOT_PRODUCTION_RELEASE" };
  if (!SHA.test(p.commitSha ?? "")) return { status: "BLOCKED", code: "COMMIT_SHA_REQUIRED" };
  if (p.sourceBranch !== "main") return { status: "BLOCKED", code: "FEATURE_BRANCH_PRODUCTION" };
  if (p.approval?.approved !== true || p.approval?.commitSha !== p.commitSha ||
    typeof p.approval?.operator !== "string" || !p.approval.operator.trim())
    return { status: "BLOCKED", code: "EXACT_OPERATOR_APPROVAL_REQUIRED" };
  if (p.ci?.sha !== p.commitSha || p.ci?.conclusion !== "success")
    return { status: "BLOCKED", code: "EXACT_CI_REQUIRED" };
  if (p.independentValidation?.sha !== p.commitSha ||
    p.independentValidation?.status !== "PASS")
    return { status: "BLOCKED", code: "INDEPENDENT_VALIDATION_REQUIRED" };
  if (p.rollback?.sha === undefined || !SHA.test(p.rollback.sha) ||
    !p.rollback.deploymentId)
    return { status: "BLOCKED", code: "ROLLBACK_REQUIRED" };
  return { status: "PASS", code: "RELEASE_PACKET_COMPLETE" };
}

export function assessTableExposure(tables) {
  if (!Array.isArray(tables)) return { status: "BLOCKED", code: "TABLE_INVENTORY_MISSING", flagged: [] };
  const flagged = tables.filter(t => t && t.rlsEnabled !== true &&
    (t.anonSelect === true || t.anonInsert === true || t.authSelect === true || t.authWrite === true))
    .map(t => ({ table: t.table, reason: t.anonSelect || t.anonInsert
      ? "ANONYMOUS_PRIVILEGE_WITHOUT_RLS" : "AUTHENTICATED_PRIVILEGE_WITHOUT_RLS" }));
  return { status: flagged.length ? "FAIL" : "PASS", code: flagged.length ?
    "TABLE_ACCESS_REQUIRES_REVIEW" : "NO_EXPOSED_RLS_GAPS_IN_INPUT", flagged };
}

export function assessTenantAccess({ authenticatedUserId, tenantId, memberships, role } = {}) {
  if (!UUID.test(authenticatedUserId ?? "") || !UUID.test(tenantId ?? ""))
    return { status: "BLOCKED", code: "VERIFIED_USER_AND_TENANT_REQUIRED" };
  if (!Array.isArray(memberships)) return { status: "BLOCKED", code: "MEMBERSHIP_EVIDENCE_REQUIRED" };
  const m = memberships.find(x => x.userId === authenticatedUserId && x.tenantId === tenantId &&
    x.status === "ACTIVE" && x.role === role);
  if (!m) return { status: "BLOCKED", code: "TENANT_MEMBERSHIP_DENIED" };
  if (!["OWNER", "ADMIN", "BUILDER", "VALIDATOR"].includes(m.role))
    return { status: "BLOCKED", code: "OPERATOR_ROLE_DENIED" };
  return { status: "PASS", code: "AUTHORIZED_TENANT_IN_INPUT" };
}

export function assessSupervisorSingleton(leases, now = Date.now()) {
  if (!Array.isArray(leases)) return { status: "BLOCKED", code: "LEASE_EVIDENCE_MISSING" };
  const live = leases.filter(x => x && x.state === "ACTIVE" && Number.isFinite(x.expiresAtMs) && x.expiresAtMs > now);
  if (!live.length) return { status: "BLOCKED", code: "NO_ACTIVE_SUPERVISOR_LEASE", live: 0 };
  const keys = new Set();
  for (const l of live) {
    if (!l.scope || !l.holder) return { status: "BLOCKED", code: "LEASE_SCOPE_OR_HOLDER_UNKNOWN", live: live.length };
    if (keys.has(l.scope)) return { status: "FAIL", code: "OVERLAPPING_SUPERVISOR_LEASES", live: live.length };
    keys.add(l.scope);
  }
  return { status: "PASS", code: "DISTINCT_AUTHORIZED_LEASE_SCOPES_IN_INPUT", live: live.length };
}

export function assessPreviewCanary({ sourceSha, tenantId, worker, builder, validator, receipt, screenshots, billing } = {}) {
  if (!SHA.test(sourceSha ?? "") || !UUID.test(tenantId ?? ""))
    return { status: "BLOCKED", code: "SOURCE_AND_TENANT_REQUIRED" };
  if (billing?.mode !== "synthetic_no_spend")
    return { status: "BLOCKED", code: "BILLING_GATE_NOT_PROVEN" };
  if (!worker?.leaseId || worker?.tenantId !== tenantId || worker?.state !== "COMPLETED")
    return { status: "BLOCKED", code: "DURABLE_WORKER_RECEIPT_MISSING" };
  if (!builder?.id || !builder?.artifactSha || !SHA.test(builder.artifactSha))
    return { status: "BLOCKED", code: "SOURCE_ARTIFACT_MISSING" };
  if (!validator?.id || validator.id === builder.id || validator.status !== "PASS" ||
      validator.artifactSha !== builder.artifactSha)
    return { status: "BLOCKED", code: "INDEPENDENT_QA_MISSING" };
  if (!receipt?.id || receipt.sourceSha !== sourceSha || receipt.tenantId !== tenantId ||
      receipt.status !== "PREVIEW_VALIDATED")
    return { status: "BLOCKED", code: "VALIDATION_RECEIPT_MISSING" };
  if (!screenshots?.desktop1440x900 || !screenshots?.mobile390x844)
    return { status: "BLOCKED", code: "RESPONSIVE_EVIDENCE_MISSING" };
  return { status: "PASS", code: "SYNTHETIC_PREVIEW_RECEIPTS_COMPLETE_IN_INPUT" };
}

export function assessMonitoring(snapshot = {}) {
  const { nowMs, heartbeatMs, pending, deadLetter, workerBound,
    cronCount, reportedBudgetCents, configuredBudgetCents } = snapshot;
  const alerts = [];
  if (!Number.isFinite(nowMs) || !Number.isFinite(heartbeatMs) || nowMs - heartbeatMs > 10 * 60_000 ||
      heartbeatMs > nowMs + 60_000) alerts.push("STALE_OR_UNKNOWN_HEARTBEAT");
  if (workerBound !== true) alerts.push("WORKER_NOT_AUTHORIZED_OR_BOUND");
  if (!Number.isInteger(cronCount) || cronCount !== 1) alerts.push("SINGLE_HEARTBEAT_NOT_PROVEN");
  if (!Number.isInteger(pending) || pending < 0) alerts.push("QUEUE_METRICS_MISSING");
  if (!Number.isInteger(deadLetter) || deadLetter < 0 || deadLetter > 0) alerts.push("DEAD_LETTER_REVIEW_REQUIRED");
  if (!Number.isInteger(reportedBudgetCents) || !Number.isInteger(configuredBudgetCents) ||
      configuredBudgetCents <= 0 || reportedBudgetCents > configuredBudgetCents)
    alerts.push("SPEND_CAP_NOT_PROVEN");
  return { status: alerts.length ? "BLOCKED" : "PASS", code: alerts.length ?
    "MONITORING_GATES_OPEN" : "MONITORING_SNAPSHOT_CLEAR", alerts };
}
