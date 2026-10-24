import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const m = JSON.parse(readFileSync(new URL("./x1-capability-fabric.v1.json", import.meta.url), "utf8"));

test("versioned manifest and source pins are explicit", () => {
  assert.equal(m.schema_version, "x1.capability-fabric.v1");
  assert.equal(m.release_state, "DESIGN_ONLY");
  assert.match(m.target.baseline_sha, /^[0-9a-f]{40}$/);
  assert.match(m.donors[0].sha, /^[0-9a-f]{40}$/);
  assert.equal(m.target.repo, "Strategic-Minds-AI/X1-OPERATING-SYSTEMS");
});
test("single queue, control plane, scheduler and Guardian are preserved", () => {
  for (const [name, a] of Object.entries(m.authorities)) {
    assert.equal(a.count, 1, name);
    assert.equal(a.existing, true, name);
    assert.equal(a.require_live_binding, true, name);
  }
  assert.equal(m.constraints.no_duplicate_queues, true);
  assert.equal(m.constraints.no_duplicate_schedulers, true);
});
test("auth, tenant, policy and execution isolation default closed", () => {
  assert.equal(m.gateway.auth, "OIDC_OAuth_scoped");
  assert.equal(m.gateway.tenant_scope, true);
  assert.ok(m.gateway.forbidden_public.includes("CDP"));
  assert.ok(!m.gateway.public.includes("browser-worker"));
  assert.equal(m.constraints.browser_requires_nonroot_sandbox, true);
  assert.equal(m.constraints.external_egress_firewall_required, true);
  assert.equal(m.constraints.deny_unsafe_browser_fallback, true);
  assert.equal(m.constraints.no_secret_copy, true);
  assert.equal(m.constraints.no_prod_without_approval, true);
  assert.equal(m.constraints.no_new_paid_services_without_approval, true);
});
test("capability IDs are unique, explicit and non-executable by registration", () => {
  assert.ok(m.capabilities.length >= 20);
  const ids = new Set();
  const states = new Set(["source_documented","source_ci_pass","connected_when_authorized","not_live_verified","planned","blocked"]);
  const classes = new Set(["READ_DRAFT","STAGING_WRITE","PROTECTED"]);
  for (const c of m.capabilities) {
    assert.match(c.id, /^[a-z][a-z0-9_-]*(?:\.[a-z][a-z0-9_-]*)+$/);
    assert.ok(!ids.has(c.id), "duplicate capability: " + c.id);
    ids.add(c.id);
    assert.match(c.version, /^\d+\.\d+\.\d+$/);
    assert.ok(states.has(c.status), "invalid state: "+ c.id);
    assert.ok(classes.has(c.action_class), "invalid permission: "+ c.id);
    assert.equal(c.execution, "deny_until_connected");
    assert.equal(c.requires_receipt, true);
    assert.ok(c.scopes.length >= 1);
  }
  assert.equal(m.capabilities.find(c=>c.id==="browser.worker").status, "blocked");
  assert.equal(m.capabilities.find(c=>c.id==="provider.railway").status, "blocked");
});
test("queue work packets include durable idempotency and lease ordering", () => {
  for (const f of ["mission_id","tenant_id","actor_id","idempotency_key","approval_state","rollback_pointer"]) assert.ok(m.work_packet.required_fields.includes(f));
  assert.ok(m.work_packet.states.includes("LEASED"));
  assert.ok(m.work_packet.states.includes("BLOCKED"));
  assert.equal(m.work_packet.max_repair_attempts, 3);
  assert.equal(m.data_ownership.sync_pattern, "outbox_idempotent_receipts_no_two_phase_commit");
});
test("backups are layered and cannot be claimed until restored", () => {
  const backup = m.backups;
  assert.ok(backup.required_layers.includes("encrypted_offsite_logical_dump"));
  assert.ok(backup.required_layers.includes("separate_artifact_object_archive"));
  assert.ok(backup.required_layers.includes("provider_native_snapshot"));
  assert.equal(backup.restore_drill_required, true);
  assert.equal(backup.restore_verified, false);
  assert.equal(backup.snapshot_verified, false);
  assert.equal(backup.target_verified, false);
});
test("all live release hard gates stay blocked without provider evidence", () => {
  assert.equal(m.release_gates.production_authorized, false);
  for (const [key, value] of Object.entries(m.release_gates)) {
    if (key === "source_sha_pinned" || key === "code_tests_required") assert.equal(value,true);
    else assert.equal(value, false, key);
  }
  assert.equal(m.staging.access, "READ_VERIFIED");
  assert.equal(m.staging.release, "BLOCKED_SECURITY");
  assert.equal(m.staging.railway_project, "4fd76d35-df2c-4358-a936-0f5ac055d9d6");
  assert.equal(m.staging.railway_environment, "abc93895-5f8e-4c9b-b913-3daaf2595ba3");
  assert.equal(m.staging.engine_source.sha, "dd9ea695d064e6b5e14bc6b42b61884632d275f7");
  assert.equal(m.staging.engine_source.unsafe_runtime, "chromium_no_sandbox");
  assert.equal(m.staging.engine_source.nonroot_verified, false);
  assert.equal(m.staging.runtime_findings.engine_session_manager, "IN_PROCESS_ONLY");
  assert.equal(m.staging.runtime_findings.session_metadata_persistence, "DISABLED_MISSING_STAGING_BINDING_AT_STARTUP");
  assert.equal(m.staging.runtime_findings.hardened_sandbox, "NOT_VERIFIED_OLD_ENGINE_NO_SANDBOX");
  assert.equal(m.staging.runtime_findings.database_restore_drill, "NOT_RUN");
  assert.equal(m.staging.legacy_project.access, "DENIED_VIEWER");
});
