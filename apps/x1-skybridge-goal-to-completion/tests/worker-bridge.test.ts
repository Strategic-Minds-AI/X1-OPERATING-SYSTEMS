import test from "node:test";
import assert from "node:assert/strict";
import { deriveProbeJobId, inspectProbeJob, dispatchReadOnlyProbe } from "../src/worker-bridge.js";

test("deterministic and name-limited job identifiers",()=>{
 const id=deriveProbeJobId("X1-PROBE-TEST-20261022");
 assert.match(id,/^X1MCP-READ-[a-f0-9]{20}$/);
 assert.equal(id,deriveProbeJobId("X1-PROBE-TEST-20261022"));
 assert.throws(()=>deriveProbeJobId("../secrets"),/Invalid request identifier/);
 assert.throws(()=>deriveProbeJobId(""),/Invalid request identifier/);
});
test("remote-triggered job dispatch is denied by default", async()=>{
 const original=process.env.X1_LOCAL_PROBE_BACKEND;
 delete process.env.X1_LOCAL_PROBE_BACKEND;
 try {await assert.rejects(()=>dispatchReadOnlyProbe("X1-PROBE-TEST-DENIED"),/LOCAL_DISPATCH_DISABLED/);}
 finally {if(original===undefined) delete process.env.X1_LOCAL_PROBE_BACKEND;else process.env.X1_LOCAL_PROBE_BACKEND=original;}
});
test("nonexistent receipt does not imply success",async()=>{
 const p=await inspectProbeJob("X1-MISSING-20261022-AAAA");
 assert.equal(p.receiptVerified,false);
 assert.equal(p.status,"NOT_FOUND");
});