import { dispatchReadOnlyProbe, inspectProbeJob } from "../src/worker-bridge.js";
process.env.X1_LOCAL_PROBE_BACKEND="enabled-local-only";
const requestId="X1-SKYBRIDGE-READ-CANARY-20261022-v3";
const a=await dispatchReadOnlyProbe(requestId);
const b=await dispatchReadOnlyProbe(requestId);
if(a.idempotent||!b.idempotent||a.jobId!==b.jobId) throw Error("Idempotency check failed");
console.log(JSON.stringify({submit:a,repeat:b,initial:await inspectProbeJob(requestId)}));
