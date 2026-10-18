import test from "node:test";
import assert from "node:assert/strict";
import {runPromptEvaluation,validateEvaluationInput} from "../server/x1-prompt-evaluate.mjs";
import {STAGING_ORIGIN} from "../server/x1-staging.mjs";

const USER_ID="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const TENANT_ID="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ENV={VERCEL_ENV:"preview",SUPABASE_URL:STAGING_ORIGIN,SUPABASE_ANON_KEY:"public-test-key",SUPABASE_SERVICE_ROLE_KEY:"server-test-key",X1_GPT_CHAT_ENABLED:"true",X1_LLM_PROVIDER:"ollama",OLLAMA_TUNNEL_URL:"https://smai-example.ngrok-free.app",OLLAMA_TUNNEL_TOKEN:"synthetic-test-bearer-only",X1_OLLAMA_MODEL:"llama3.1:8b"};
function sink(){return {statusCode:200,headers:{},body:null,setHeader(k,v){this.headers[k]=v;},end(s){try{this.body=JSON.parse(s);}catch{this.body=null;}}};}
function reply(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json"} });}
function fakeFetch(calls=[],modelText=JSON.stringify({simulated_output:"Here is a synthetic draft.",self_review:{status:"REVISE",score:72,hallucination_risks:["One assumption needs confirmation."],unsupported_claims:["No sources were supplied."],rubric_results:["Output format followed"],recommendations:["Cite verified sources."],confidence_note:"Model self-review only."}})){
 return async(url,options={})=>{
  const u=new URL(url),method=options.method||"GET",body=options.body?JSON.parse(options.body):null;
  calls.push({url:u.toString(),method,body});
  if(u.origin===STAGING_ORIGIN){
   if(u.pathname==="/auth/v1/user")return reply({id:USER_ID});
   if(u.pathname==="/rest/v1/x1_tenant_memberships")return reply([{tenant_id:TENANT_ID,role:"OWNER",status:"ACTIVE"}]);
   if(u.pathname==="/rest/v1/x1_tenants")return reply([{tenant_id:TENANT_ID,status:"ACTIVE"}]);
   if(u.pathname==="/rest/v1/x1_work_queue")return reply([{status:"COMPLETED"}]);
   if(u.pathname==="/rest/v1/x1_prompt_runs"&&method==="GET")return reply([]);
   if(u.pathname==="/rest/v1/x1_prompt_runs"&&method==="POST"){
    const row=body[0];return reply([{run_id:"cccccccc-cccc-4ccc-8ccc-cccccccccccc",created_at:"2026-10-18T13:00:00Z",model:row.model}],201);
   }
  }
  if(u.origin==="https://smai-example.ngrok-free.app"&&u.pathname==="/api/chat"&&method==="POST"){
   assert.equal(options.headers.authorization,"Bearer synthetic-test-bearer-only");
   const payload=body;
   assert.equal(payload.stream,false);
   assert.equal(payload.messages[0].role,"system");
   assert.match(payload.messages[0].content,/no tools, network, files, credentials/i);
   return reply({message:{content:modelText}});
  }
  throw new Error("Unexpected endpoint "+u.toString());
 };
}
test("Prompt evaluation rejects invalid prompt and test input sizes",()=>{
 assert.equal(validateEvaluationInput({promptText:"short",testInput:"example"}).ok,false);
 assert.equal(validateEvaluationInput({promptText:"Act as a safe assistant and produce a structured output.".repeat(20),testInput:""}).ok,false);
 assert.equal(validateEvaluationInput({promptText:"Act as a safe assistant and produce a structured output.".repeat(20),testInput:"synthetic case"}).ok,true);
});
test("Prompt evaluation executes only through configured Ollama tunnel and persists its self-review",async()=>{
 const calls=[],res=sink();
 await runPromptEvaluation({method:"POST",headers:{authorization:"Bearer x1-user-token"},body:{title:"Synthetic intake prompt",promptText:"Act as a careful intake assistant. Return a structured summary and clearly label unknown facts.",testInput:"Synthetic caller says their air conditioner stopped working in summer. Ask only for missing details."}},res,{env:ENV,fetchImpl:fakeFetch(calls)});
 assert.equal(res.statusCode,200);
 assert.equal(res.body.status,"SIMULATED_NOT_INDEPENDENTLY_VALIDATED");
 assert.equal(res.body.persisted,true);
 assert.equal(res.body.output,"Here is a synthetic draft.");
 assert.equal(res.body.review.score,72);
 const saved=calls.find(c=>c.url.includes("/rest/v1/x1_prompt_runs")&&c.method==="POST").body[0];
 assert.equal(saved.tenant_id,TENANT_ID);
 assert.equal(saved.prompt_title,"Synthetic intake prompt");
 assert.equal(saved.model,"llama3.1:8b");
 assert.equal(calls.some(c=>c.url.includes("/api/chat")),true);
});
test("Prompt evaluation fails closed when model execution is disabled",async()=>{
 const calls=[],res=sink();
 await runPromptEvaluation({method:"POST",headers:{authorization:"Bearer x1-user-token"},body:{title:"Synthetic intake prompt",promptText:"Act as a careful intake assistant. Return a structured summary and clearly label unknown facts.",testInput:"Synthetic test input."}},res,{env:{...ENV,X1_GPT_CHAT_ENABLED:"false"},fetchImpl:fakeFetch(calls)});
 assert.equal(res.statusCode,503);
 assert.equal(res.body.reason,"MODEL_EXECUTION_DISABLED");
 assert.equal(calls.some(c=>c.url.includes("/api/chat")),false);
});
test("Prompt evaluation refuses production database bindings",async()=>{
 const calls=[],res=sink();
 await runPromptEvaluation({method:"POST",headers:{authorization:"Bearer x1-user-token"},body:{title:"Synthetic intake prompt",promptText:"Act as a careful intake assistant. Return a structured summary and clearly label unknown facts.",testInput:"Synthetic test input."}},res,{env:{...ENV,VERCEL_ENV:"production"},fetchImpl:fakeFetch(calls)});
 assert.equal(res.statusCode,503);
 assert.equal(calls.length,0);
});
