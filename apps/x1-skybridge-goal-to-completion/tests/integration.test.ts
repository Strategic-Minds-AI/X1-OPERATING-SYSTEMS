import test from "node:test";
import assert from "node:assert/strict";
import { renderCandidate,createCandidate,validateCandidate } from "../src/site-factory.js";
import { getSystemSnapshot,getLocalJobs } from "../src/operations.js";

test("website candidate HTML is escaped and noindex",()=>{
 const html=renderCandidate("Help <people> & customers","<script>alert(1)</script>","website");
 assert.match(html,/noindex,nofollow/);
 assert.doesNotMatch(html,/<script>alert\(1\)<\/script>/);
 assert.match(html,/Help &lt;people&gt; &amp; customers/);
});
test("app preview has calculator and privacy statements",()=>{
 const html=renderCandidate("Quote planning", "Local estimator", "app");
 assert.match(html,/id="result"/);
 assert.match(html,/No real pricing data is connected/);
 assert.match(html,/No customer data collected/);
});
test("candidate builds deterministically and validates",async()=>{
 const a=await createCandidate("Epoxy floor quote tool","Epoxy estimator test","app");
 const b=await createCandidate("Epoxy floor quote tool","Epoxy estimator test","app");
 assert.equal(a.candidateId,b.candidateId);
 assert.equal(a.sha256,b.sha256);
 const r=await validateCandidate(a.candidateId);
 assert.equal(r.failed,0);
 assert.equal(r.passed,7);
 assert.equal(r.releaseAuthorized,false);
});
test("blocks unsafe candidate ID path traversal",async()=>{
 await assert.rejects(()=>validateCandidate("../../credentials"),/Invalid candidate ID/);
});
test("system snapshot is read only and release denied",async()=>{
 const snapshot=await getSystemSnapshot();
 assert(snapshot.services.length>=8);
 assert.equal(snapshot.policy.productionRelease,"DENIED");
 assert(snapshot.services.filter(s=>s.scope==="cloud").every(s=>s.status==="REQUIRES_SERVER_AUTH"));
});
test("job inspection only accesses existing mirror",async()=>{
 const jobs=await getLocalJobs();
 assert.equal(jobs.readOnly,true);
 assert(Array.isArray(jobs.jobs));
});