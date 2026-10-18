import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = name => readFileSync(new URL("../../../ops/security/" + name, import.meta.url),"utf8");
const targetTables = [
  "agent_profiles", "approval_requests", "capabilities", "connector_bindings",
  "event_records", "handoff_packets", "leases", "mcp_routes", "memory_entries",
  "missions", "receipts", "runtime_state", "schedule_runs", "schedule_specs", "work_items"
];

test("staging lockdown is pinned to exact staging database, not production", () => {
  const f=read("x1_staging_control_lockdown_20261011.sql");
  assert.match(f,/uvdkzsbjackpjvpoxtyk/);
  assert.doesNotMatch(f,/vgsmyhqqtkkluhypxyua/);
  assert.match(f,/BLOCKER: verify staging latest successful recoverable provider backup/);
});
test("staging lockdown has complete 15-table inventory preflight", () => {
  const f=read("x1_staging_control_lockdown_20261011.sql");
  for(const t of targetTables) assert.ok(f.includes("'" + t + "'"),"missing "+t);
  assert.match(f,/<> 15/);
  assert.match(f,/auth\.users/);
  assert.match(f,/x1_tenant_memberships/);
});
test("staging restriction does not change service_role privileges", () => {
  const f=read("x1_staging_control_lockdown_20261011.sql");
  assert.match(f,/FROM anon, authenticated/);
  assert.match(f,/has_table_privilege\('service_role'/);
  assert.doesNotMatch(f,/REVOKE\s+ALL[^;]*FROM[^;]*service_role/i);
});
test("staging rollback preserves all 15 policies and separate anon policies", () => {
  const f=read("x1_staging_control_lockdown_rollback_20261011.sql");
  for(const t of targetTables) assert.ok(f.includes("'" + t + "'"),"missing "+t);
  assert.match(f,/CREATE POLICY anon_select_capabilities/);
  assert.match(f,/CREATE POLICY anon_select_receipts/);
  assert.match(f,/CREATE POLICY anon_select_runtime_state/);
  assert.match(f,/GRANT SELECT, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN/);
});
test("SI operator-only policies are versioned and have an explicit rollback", () => {
  const f=read("si_admin_only_rls_20261011.sql");
  const undo=read("si_admin_only_rls_rollback_20261011.sql");
  assert.match(f,/si_admin_operator_guard_20261011/);
  assert.match(f,/public\.runtime_user_role\(\)/);
  assert.match(undo,/DROP POLICY si_admin_operator_guard_20261011/);
  assert.doesNotMatch(f,/\b(?:DROP|TRUNCATE)\s+TABLE\b/i);
});
test("SI privileged-function patch has fixed search paths and a recorded rollback", () => {
  const f=read("si_function_surface_20261011.sql");
  const undo=read("si_function_surface_rollback_20261011.sql");
  for(const fn of ["handle_new_user", "runtime_enqueue_entity_job", "runtime_new_user", "set_updated_at"])
    assert.match(f,new RegExp("REVOKE ALL ON FUNCTION public\\."+fn));
  assert.match(f,/SET search_path = pg_catalog, public, pg_temp/);
  assert.match(undo,/GRANT EXECUTE ON FUNCTION public\.runtime_user_role\(\) TO anon/);
});


test("staging APEX trigger search path is pinned and rollback is isolated", () => {
  const f=read("x1_staging_apex_trigger_search_path_20261011.sql");
  const b=read("x1_staging_apex_trigger_search_path_rollback_20261011.sql");
  assert.match(f,/uvdkzsbjackpjvpoxtyk/);
  for(const fn of ["apex_validate_agent_task_pass","apex_validate_todo_done","apex_gate_goal_achievement"]){
    assert.ok(f.includes("ALTER FUNCTION public."+fn+"()"));
    assert.ok(b.includes("ALTER FUNCTION public."+fn+"() RESET search_path"));
  }
  assert.match(f,/SET search_path = pg_catalog, public, pg_temp/);
  assert.doesNotMatch(f,/DROP\s+TABLE|TRUNCATE\s+TABLE/i);
});
test("production property public read-only SQL remains a draft, with a rollback", () => {
  const f=read("hpi_distressed_properties_public_readonly_DRAFT_20261011.sql");
  const b=read("hpi_distressed_properties_public_readonly_ROLLBACK_DRAFT_20261011.sql");
  assert.match(f,/DRAFT ONLY, NOT APPLIED/);
  assert.match(f,/fwtchbsebygwifmmqhur/);
  assert.match(f,/GRANT SELECT ON TABLE public.distressed_properties TO anon, authenticated/);
  assert.match(f,/FOR SELECT TO anon,authenticated USING \(true\)/);
  assert.match(b,/DROP POLICY hpi_public_listing_readonly_20261011/);
  assert.match(b,/DISABLE ROW LEVEL SECURITY/);
});
