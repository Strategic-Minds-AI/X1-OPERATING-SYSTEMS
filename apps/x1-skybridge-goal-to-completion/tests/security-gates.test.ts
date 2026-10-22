import test from "node:test";
import assert from "node:assert/strict";
import { createCandidate } from "../src/site-factory.js";
import { dispatchReadOnlyProbe } from "../src/worker-bridge.js";

test("production blocks local candidate writes",async()=>{
 const before=process.env.NODE_ENV;
 process.env.NODE_ENV="production";
 try {await assert.rejects(()=>createCandidate("Safe test goal","Safe test title","website"),/PREVIEW_WRITE_DENIED/);}
 finally {if(before===undefined) delete process.env.NODE_ENV;else process.env.NODE_ENV=before;}
});
test("worker dispatch requires backend-side gate",async()=>{
 const before=process.env.X1_LOCAL_PROBE_BACKEND;
 delete process.env.X1_LOCAL_PROBE_BACKEND;
 try{await assert.rejects(()=>dispatchReadOnlyProbe("X1-SECURITY-NEGATIVE-20261022"),/LOCAL_DISPATCH_DISABLED/);}
 finally{if(before===undefined)delete process.env.X1_LOCAL_PROBE_BACKEND;else process.env.X1_LOCAL_PROBE_BACKEND=before;}
});
