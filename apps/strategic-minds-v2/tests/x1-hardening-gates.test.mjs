import test from "node:test";
import assert from "node:assert/strict";
import {
  X1_TARGETS, assessDatabaseRoute, assessReleaseCandidate, assessTableExposure,
  assessTenantAccess, assessSupervisorSingleton, assessPreviewCanary, assessMonitoring
} from "../server/x1-hardening-gates.mjs";

const SHA="1234567890abcdef1234567890abcdef12345678";
const OLD_SHA="f".repeat(40);
const TENANT="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const OTHER_TENANT="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const USER="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function packet() {
  return {
    deployTarget:"production", sourceBranch:"main", commitSha:SHA,
    approval:{approved:true,commitSha:SHA,operator:"operator-approved-scope"},
    ci:{sha:SHA,conclusion:"success"},
    independentValidation:{sha:SHA,status:"PASS"},
    rollback:{sha:OLD_SHA,deploymentId:"dpl_verified_prior"}
  };
}
function canary() {
  return {
    sourceSha:SHA, tenantId:TENANT, billing:{mode:"synthetic_no_spend"},
    worker:{tenantId:TENANT,state:"COMPLETED",leaseId:"synthetic-lease"},
    builder:{id:"builder-A",artifactSha:SHA},
    validator:{id:"validator-B",artifactSha:SHA,status:"PASS"},
    receipt:{id:"receipt",sourceSha:SHA,tenantId:TENANT,status:"PREVIEW_VALIDATED"},
    screenshots:{desktop1440x900:"synthetic-proof-desktop",mobile390x844:"synthetic-proof-mobile"}
  };
}
function snap() {
  return {nowMs:1000000,heartbeatMs:950000,pending:0,deadLetter:0,
    workerBound:true,cronCount:1,reportedBudgetCents:0,configuredBudgetCents:100};
}
test("preview routes ONLY to X1 staging",()=>{
  assert.equal(assessDatabaseRoute({runtime:"preview",target:"staging",supabaseProjectRef:X1_TARGETS.staging}).status,"PASS");
});
test("production routes ONLY to X1 production",()=>{
  assert.equal(assessDatabaseRoute({runtime:"production",target:"production",supabaseProjectRef:X1_TARGETS.production}).status,"PASS");
});
test("production refuses staging database",()=>{
  assert.equal(assessDatabaseRoute({runtime:"production",target:"staging",supabaseProjectRef:X1_TARGETS.staging}).code,"PRODUCTION_BOUND_TO_STAGING");
});
test("preview refuses production database",()=>{
  assert.equal(assessDatabaseRoute({runtime:"preview",target:"production",supabaseProjectRef:X1_TARGETS.production}).code,"PREVIEW_BOUND_TO_PRODUCTION");
});
test("unknown or spoofed database ref fails closed",()=>{
  assert.equal(assessDatabaseRoute({runtime:"preview",target:"staging",supabaseProjectRef:"other"}).code,"DATABASE_IDENTITY_MISMATCH");
});
test("unknown runtime fails closed",()=>{
  assert.equal(assessDatabaseRoute({runtime:"test",target:"staging",supabaseProjectRef:X1_TARGETS.staging}).status,"BLOCKED");
});
test("feature branch cannot qualify as production source",()=>{
  assert.equal(assessReleaseCandidate({...packet(),sourceBranch:"feature/x1-staging-readonly-api-20261011"}).code,"FEATURE_BRANCH_PRODUCTION");
});
test("production requires exact SHA operator approval",()=>{
  assert.equal(assessReleaseCandidate({...packet(),approval:{approved:true,commitSha:OLD_SHA,operator:"operator"}}).code,"EXACT_OPERATOR_APPROVAL_REQUIRED");
});
test("production requires independent CI for exact SHA",()=>{
  assert.equal(assessReleaseCandidate({...packet(),ci:{sha:OLD_SHA,conclusion:"success"}}).code,"EXACT_CI_REQUIRED");
});
test("production requires independent validation separate from CI",()=>{
  assert.equal(assessReleaseCandidate({...packet(),independentValidation:{sha:SHA,status:"UNKNOWN"}}).code,"INDEPENDENT_VALIDATION_REQUIRED");
});
test("production requires exact rollback commit and deployment",()=>{
  assert.equal(assessReleaseCandidate({...packet(),rollback:{sha:OLD_SHA}}).code,"ROLLBACK_REQUIRED");
});
test("complete production packet is eligible only after source-of-truth proof",()=>{
  assert.equal(assessReleaseCandidate(packet()).code,"RELEASE_PACKET_COMPLETE");
});
test("unprotected anonymous table is flagged",()=>{
  const r=assessTableExposure([{table:"agent_secret",rlsEnabled:false,anonSelect:true,anonInsert:true}]);
  assert.equal(r.status,"FAIL");
  assert.equal(r.flagged[0].reason,"ANONYMOUS_PRIVILEGE_WITHOUT_RLS");
});
test("unprotected non-privileged table is not claimed externally exposed",()=>{
  const r=assessTableExposure([{table:"offline_internal",rlsEnabled:false,anonSelect:false,anonInsert:false,authSelect:false,authWrite:false}]);
  assert.equal(r.status,"PASS");
});
test("no inventory is not a PASS",()=>{
  assert.equal(assessTableExposure().status,"BLOCKED");
});
test("cross-tenant membership denied",()=>{
  assert.equal(assessTenantAccess({authenticatedUserId:USER,tenantId:OTHER_TENANT,role:"OWNER",memberships:[
    {userId:USER,tenantId:TENANT,role:"OWNER",status:"ACTIVE"}
  ]}).code,"TENANT_MEMBERSHIP_DENIED");
});
test("inactive membership is denied",()=>{
  assert.equal(assessTenantAccess({authenticatedUserId:USER,tenantId:TENANT,role:"OWNER",memberships:[
    {userId:USER,tenantId:TENANT,role:"OWNER",status:"SUSPENDED"}
  ]}).status,"BLOCKED");
});
test("viewer cannot access operator functionality",()=>{
  assert.equal(assessTenantAccess({authenticatedUserId:USER,tenantId:TENANT,role:"VIEWER",memberships:[
    {userId:USER,tenantId:TENANT,role:"VIEWER",status:"ACTIVE"}
  ]}).code,"OPERATOR_ROLE_DENIED");
});
test("authorized active operator may access own tenant in evidence input",()=>{
  assert.equal(assessTenantAccess({authenticatedUserId:USER,tenantId:TENANT,role:"OWNER",memberships:[
    {userId:USER,tenantId:TENANT,role:"OWNER",status:"ACTIVE"}
  ]}).status,"PASS");
});
test("duplicate supervisor lease scope is a failure",()=>{
  const now=1000;
  assert.equal(assessSupervisorSingleton([
    {scope:"x1/staging/lease",holder:"worker-1",state:"ACTIVE",expiresAtMs:1500},
    {scope:"x1/staging/lease",holder:"worker-2",state:"ACTIVE",expiresAtMs:1800}
  ],now).code,"OVERLAPPING_SUPERVISOR_LEASES");
});
test("no active lease does not count as working",()=>{
  assert.equal(assessSupervisorSingleton([{scope:"x1/staging/lease",holder:"worker-1",state:"ACTIVE",expiresAtMs:500}],1000).code,"NO_ACTIVE_SUPERVISOR_LEASE");
});
test("one valid lease scope passes its evidence check",()=>{
  assert.equal(assessSupervisorSingleton([{scope:"x1/staging/lease",holder:"worker-1",state:"ACTIVE",expiresAtMs:1500}],1000).status,"PASS");
});
test("a synthetic receipt packet can pass isolated validation without triggering execution",()=>{
  assert.equal(assessPreviewCanary(canary()).code,"SYNTHETIC_PREVIEW_RECEIPTS_COMPLETE_IN_INPUT");
});
test("builder cannot validate own source",()=>{
  const p=canary();p.validator.id=p.builder.id;
  assert.equal(assessPreviewCanary(p).code,"INDEPENDENT_QA_MISSING");
});
test("unmatched generated artifact fails QA",()=>{
  const p=canary();p.validator.artifactSha=OLD_SHA;
  assert.equal(assessPreviewCanary(p).code,"INDEPENDENT_QA_MISSING");
});
test("canary requires tenant isolation and durable worker receipt",()=>{
  const p=canary();p.worker.tenantId=OTHER_TENANT;
  assert.equal(assessPreviewCanary(p).code,"DURABLE_WORKER_RECEIPT_MISSING");
});
test("canary requires responsive screenshot evidence",()=>{
  const p=canary();p.screenshots.mobile390x844="";
  assert.equal(assessPreviewCanary(p).code,"RESPONSIVE_EVIDENCE_MISSING");
});
test("canary cannot silently enable spending",()=>{
  const p=canary();p.billing.mode="paid-auto";
  assert.equal(assessPreviewCanary(p).code,"BILLING_GATE_NOT_PROVEN");
});
test("stale heartbeat and multiple supervisors block monitoring",()=>{
  const r=assessMonitoring({...snap(),heartbeatMs:0,cronCount:2});
  assert.ok(r.alerts.includes("STALE_OR_UNKNOWN_HEARTBEAT"));
  assert.ok(r.alerts.includes("SINGLE_HEARTBEAT_NOT_PROVEN"));
});
test("dead letter, unbound worker, and budget overflow block readiness",()=>{
  const r=assessMonitoring({...snap(),deadLetter:20,workerBound:false,reportedBudgetCents:200});
  assert.ok(r.alerts.includes("DEAD_LETTER_REVIEW_REQUIRED"));
  assert.ok(r.alerts.includes("WORKER_NOT_AUTHORIZED_OR_BOUND"));
  assert.ok(r.alerts.includes("SPEND_CAP_NOT_PROVEN"));
});
test("healthy monitoring snapshot may pass, but is not proof of real production telemetry",()=>{
  assert.equal(assessMonitoring(snap()).status,"PASS");
});
