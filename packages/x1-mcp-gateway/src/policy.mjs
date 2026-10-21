/**
 * Pure, dependency-free X1 gateway security policy.
 * Tested with node:test and reused in the TypeScript server.
 * No database writes, message sends, production deploys, or payments.
 */
export const capabilityGroups = Object.freeze({
  supergpt: ["inventory", "mission_plan", "job_status"],
  website: ["template_inventory", "preview_prepare", "preview_status"],
  search: ["site_audit", "analytics_report"],
  social: ["campaign_draft", "performance_report"],
  revenue: ["opportunities_report", "proposal_draft"]
});
const slug = /^[a-z][a-z0-9_]*$/;
export function checkOperation(group, operation) {
  if (!slug.test(String(group)) || !slug.test(String(operation)) ||
      !Object.hasOwn(capabilityGroups, group) ||
      !capabilityGroups[group].includes(operation)) {
    throw new Error("OPERATION_NOT_ALLOWED");
  }
  return group + "." + operation;
}
export function checkTenant(tenantId) {
  if (typeof tenantId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tenantId)) {
    throw new Error("TENANT_INVALID");
  }
  return tenantId.toLowerCase();
}
export function assertDryRun(dryRun) {
  if (dryRun !== true) throw new Error("DRY_RUN_REQUIRED");
  return true;
}
export function requireSecureEndpoint(value) {
  if (!value) throw new Error("ADAPTER_NOT_CONFIGURED");
  const parsed = new URL(value);
  const isLoopback = ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
  if (parsed.username || parsed.password || parsed.hash || parsed.search ||
      (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && isLoopback))) {
    throw new Error("UNSAFE_ADAPTER_URL");
  }
  return parsed.origin + parsed.pathname.replace(/\/$/, "");
}
export function allowOrigin(origin, allowed) {
  if (!origin) return true; // machine-to-machine clients generally send no Origin
  return allowed.split(",").map(s => s.trim()).filter(Boolean).includes(origin);
}
export function requireMatchingAuthorization(answer, actorId, tenantId, capability) {
  if (!answer || answer.allowed !== true || answer.actor_id !== actorId ||
      answer.tenant_id !== tenantId || answer.capability !== capability) {
    throw new Error("AUTHORIZATION_DENIED");
  }
  return true;
}
