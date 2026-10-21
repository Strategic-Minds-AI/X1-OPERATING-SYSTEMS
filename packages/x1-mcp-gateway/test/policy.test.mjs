import { test } from "node:test";
import assert from "node:assert/strict";
import { capabilityGroups, checkOperation, checkTenant, assertDryRun,
  requireSecureEndpoint, allowOrigin, requireMatchingAuthorization } from "../src/policy.mjs";
const T="a64c00a1-e493-4c11-a2a5-0f444c999999";
test("five capability namespaces and 12 allowlisted operations", () => {
  assert.equal(Object.keys(capabilityGroups).length, 5);
  assert.equal(Object.values(capabilityGroups).reduce((n,a)=>n+a.length,0),12);
  for(const [g,ops] of Object.entries(capabilityGroups)) for(const op of ops)
    assert.equal(checkOperation(g,op),g+"."+op);
});
test("reject arbitrary operations and publication", () => {
  for(const [g,op] of [["website","publish"],["social","send_message"],["foo","inventory"],
     ["supergpt","delete"],["revenue","deploy"]]) assert.throws(()=>checkOperation(g,op));
});
test("enforce UUID-shaped tenant identity", () => {
  assert.equal(checkTenant(T),T);
  for (const s of ["tenant-1","",null,"00000000-0000-0000-0000-000000000000"])
    assert.throws(()=>checkTenant(s));
});
test("dry-run enforcement blocks mutations", () => {
  assert.equal(assertDryRun(true),true);
  for(const x of [false,undefined,"true",0]) assert.throws(()=>assertDryRun(x));
});
test("require TLS and reject credential injection in adapter URLs", () => {
  assert.equal(requireSecureEndpoint("https://x1.example.test/bridge/"),"https://x1.example.test/bridge");
  assert.equal(requireSecureEndpoint("http://127.0.0.1:4311"),"http://127.0.0.1:4311");
  for(const s of ["http://external.example.test","https://user:pass@example.test",
    "https://example.test/path?token=x","file:///etc/passwd",""])
    assert.throws(()=>requireSecureEndpoint(s));
});
test("browser origins are explicit allowlist, server clients allowed", () => {
  assert.equal(allowOrigin(null,"https://x1.example.test"),true);
  assert.equal(allowOrigin("https://evil.example","https://x1.example.test"),false);
  assert.equal(allowOrigin("https://x1.example.test","https://x1.example.test"),true);
});
test("authorization must agree on subject, tenant and capability", () => {
  const d={allowed:true,actor_id:"actor1",tenant_id:T,capability:"website.preview_prepare"};
  assert.equal(requireMatchingAuthorization(d,"actor1",T,"website.preview_prepare"),true);
  for(const bad of [{...d,allowed:false},{...d,tenant_id:"else"},{...d,actor_id:"actor2"},
    {...d,capability:"social.campaign_draft"},null])
    assert.throws(()=>requireMatchingAuthorization(bad,"actor1",T,"website.preview_prepare"));
});
