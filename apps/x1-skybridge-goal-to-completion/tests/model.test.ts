import test from "node:test";
import assert from "node:assert/strict";
import { makePlan, reviewEvidence } from "../src/model.js";

test("default plan has deterministic seven phases", () => {
 const p=makePlan("Launch an isolated MCP app");
 assert.equal(p.steps.length, 7);
 assert.equal(p.verification, "NOT_RUN");
 assert.equal(makePlan("Launch an isolated MCP app").planId,p.planId);
});
test("custom steps preserve acceptance criteria", () => {
 const p=makePlan("Build mockups",[{title:"Render preview",acceptance:"Visual screenshot captured",phase:"Design"}]);
 assert.equal(p.steps[0].title,"Render preview");
 assert.equal(p.source,"assistant-supplied");
});
test("invalid goals and incomplete steps are rejected", () => {
 assert.throws(()=>makePlan(" "),/Goal/);
 assert.throws(()=>makePlan("Valid goal",[{title:"a",acceptance:"b"}]),/Each step/);
});
test("oversized step arrays are rejected",()=>{
 assert.throws(()=>makePlan("Valid goal",Array.from({length:13},()=>({title:"valid step",acceptance:"must test"}))),/Maximum/);
});
test("evidence review does not certify successful delivery",()=>{
 const r=reviewEvidence("Launch app",[{title:"Run tests",acceptance:"Test suite succeeds",status:"review",evidence:"test log provided"}]);
 assert.equal(r.releaseApproved,false);
 assert.equal(r.independentVerification,"NOT_RUN");
 assert.equal(r.evidenceSupplied,1);
});
test("review flags missing evidence",()=>{
 const r=reviewEvidence("Launch app",[{title:"Run tests",acceptance:"Test suite succeeds",status:"review",evidence:""}]);
 assert.deepEqual(r.missingEvidence,[1]);
 assert.equal(r.releaseApproved,false);
});