import test from "node:test";
import assert from "node:assert/strict";
import { validateWorkItemInput } from "../server/x1-work-items.mjs";
import { validatePromptInput } from "../server/x1-prompt-assets.mjs";

test("coding queue accepts bounded non-production work descriptions",()=>{
 const result=validateWorkItemInput({title:"Port Prompt Lab to X1",description:"Migrate prompt assets and editor interactions to the X1-native staging API.",category:"engineering",acceptanceCriteria:["Tests pass","No Base44 runtime dependency"]});
 assert.equal(result.ok,true);
 assert.equal(result.value.title,"Port Prompt Lab to X1");
 assert.equal(result.value.acceptanceCriteria.length,2);
});
test("coding queue rejects short, oversized, or malformed task inputs",()=>{
 assert.equal(validateWorkItemInput({title:"x",description:"too short",category:"engineering"}).ok,false);
 assert.equal(validateWorkItemInput({title:"Valid title",description:"This is long enough.",category:"invalid category"}).ok,false);
 assert.equal(validateWorkItemInput({title:"Valid title",description:"x".repeat(4001),category:"engineering"}).ok,false);
});
test("Prompt Lab validates and normalizes X1 prompt assets",()=>{
 const result=validatePromptInput({title:"Emergency Intake Agent",promptText:"Act as a careful emergency-services intake assistant. Ask concise questions and output a structured summary.",category:"agent-workflows",metadata:{owner:"x1"}});
 assert.equal(result.ok,true);
 assert.equal(result.value.category,"agent-workflows");
});
test("Prompt Lab rejects invalid categories and empty prompt text",()=>{
 assert.equal(validatePromptInput({title:"A valid title",promptText:"",category:"general"}).ok,false);
 assert.equal(validatePromptInput({title:"A valid title",promptText:"Write a useful result.",category:"../../admin"}).ok,false);
});
