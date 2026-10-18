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

import { runWorkItems } from "../server/x1-work-items.mjs";
import { runPromptAssets } from "../server/x1-prompt-assets.mjs";
import { STAGING_ORIGIN } from "../server/x1-staging.mjs";

const USER_ID="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const TENANT_ID="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const STAGING_ENV={VERCEL_ENV:"preview",SUPABASE_URL:STAGING_ORIGIN,SUPABASE_ANON_KEY:"public-test-key",SUPABASE_SERVICE_ROLE_KEY:"server-test-key"};
function responseSink(){return {statusCode:200,headers:{},body:null,setHeader(k,v){this.headers[k]=v;},end(s){this.body=JSON.parse(s);}};}
function reply(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json"}});}
function fakeX1(fetchLog=[]){
 let createdRow=null;
 return async (url,options={})=>{
  const u=new URL(url);fetchLog.push({url:u.toString(),method:options.method||"GET",body:options.body?JSON.parse(options.body):null});
  assert.equal(u.origin,STAGING_ORIGIN);
  if(u.pathname==="/auth/v1/user")return reply({id:USER_ID});
  if(u.pathname==="/rest/v1/x1_tenant_memberships")return reply([{tenant_id:TENANT_ID,role:"OWNER",status:"ACTIVE"}]);
  if(u.pathname==="/rest/v1/x1_tenants")return reply([{tenant_id:TENANT_ID,status:"ACTIVE"}]);
  if(u.pathname==="/rest/v1/x1_work_queue"&&(options.method||"GET")==="GET"){
   if(u.searchParams.get("select")==="status")return reply([{status:"COMPLETED"}]);
   if(u.searchParams.has("work_id"))return reply(createdRow?[createdRow]:[]);
   return reply([{work_id:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",task_id:"task-existing",work_packet_id:"wp-existing",mission_id:"mission-existing",status:"PENDING",action_class:"NON_PRODUCTION_MUTATION",priority:100,attempts:0,payload:{title:"Existing task",description:"Task description",category:"engineering",acceptanceCriteria:[]},created_at:"2026-10-18T12:00:00Z",updated_at:"2026-10-18T12:00:00Z"}]);
  }
  if(u.pathname==="/rest/v1/rpc/x1_enqueue_work"&&options.method==="POST"){
   const row=options.body.p_work;
   createdRow={...row,work_id:"dddddddd-dddd-4ddd-8ddd-dddddddddddd",status:"PENDING",attempts:0,last_error_code:null,created_at:"2026-10-18T12:00:00Z",updated_at:"2026-10-18T12:00:00Z"};
   return reply(createdRow.work_id);
  }
  if(u.pathname==="/rest/v1/x1_prompt_assets"&&options.method==="GET")return reply([]);
  if(u.pathname==="/rest/v1/x1_prompt_assets"&&options.method==="POST"){
   const row=options.body[0];return reply([{...row,asset_id:"cccccccc-cccc-4ccc-8ccc-cccccccccccc",created_at:"2026-10-18T12:00:00Z",updated_at:"2026-10-18T12:00:00Z"}],201);
  }
  if(u.pathname==="/rest/v1/x1_prompt_assets"&&options.method==="PATCH")return reply([]);
  throw new Error("Unexpected endpoint "+u.pathname+" "+options.method);
 };
}
test("coding Kanban GET reads only authenticated tenant tasks from staging",async()=>{
 const calls=[];const sink=responseSink();
 await runWorkItems({method:"GET",headers:{authorization:"Bearer valid-test-token"}},sink,{env:STAGING_ENV,fetchImpl:fakeX1(calls)});
 assert.equal(sink.statusCode,200);
 assert.equal(sink.body.status,"STAGING_QUEUE_READ_VERIFIED");
 assert.equal(sink.body.items[0].title,"Existing task");
 assert.ok(calls.every(c=>new URL(c.url).origin===STAGING_ORIGIN));
});
test("coding Kanban POST uses the canonical enqueue RPC for a DRAFT task",async()=>{
 const calls=[];const sink=responseSink();
 await runWorkItems({method:"POST",headers:{authorization:"Bearer valid-test-token"},body:{title:"Implement prompt chaining",description:"Add a native chain editor with explicit inputs, outputs and evaluation criteria.",category:"engineering",acceptanceCriteria:["Tests pass"]}},sink,{env:STAGING_ENV,fetchImpl:fakeX1(calls)});
 assert.equal(sink.statusCode,201);
 assert.equal(sink.body.status,"DRAFT_SAVED_NOT_EXECUTED");
 const enqueue=calls.find(c=>c.url.includes("/rest/v1/rpc/x1_enqueue_work")&&c.method==="POST");
 const work=enqueue.body.p_work;
 assert.equal(sink.body.item.status,"PENDING");
 assert.equal(work.action_class,"DRAFT");
 assert.match(work.idempotency_key,/^[0-9a-f]{64}$/);
 assert.equal(calls.some(c=>c.url.includes("/rest/v1/x1_work_queue")&&c.method==="POST"),false);
 assert.equal(sink.body.dispatch,"NOT_DISPATCHED_BY_API");
});
test("coding Kanban fails closed outside Vercel preview/development",async()=>{
 const calls=[];const sink=responseSink();
 await runWorkItems({method:"POST",headers:{authorization:"Bearer valid-test-token"},body:{title:"Implement prompt chaining",description:"Add a native chain editor with explicit inputs, outputs and evaluation criteria.",category:"engineering"}},sink,{env:{...STAGING_ENV,VERCEL_ENV:"production"},fetchImpl:fakeX1(calls)});
 assert.equal(sink.statusCode,503);
 assert.equal(calls.length,0);
});
test("Prompt Lab persists new prompt assets through the tenant-scoped staging API",async()=>{
 const calls=[];const sink=responseSink();
 await runPromptAssets({method:"POST",headers:{authorization:"Bearer valid-test-token"},body:{title:"Emergency Intake Agent",promptText:"Act as a careful emergency-services intake assistant. Ask concise questions and output a structured summary.",category:"agent-workflows",metadata:{editor:"test"}}},sink,{env:STAGING_ENV,fetchImpl:fakeX1(calls)});
 assert.equal(sink.statusCode,201);
 assert.equal(sink.body.status,"PROMPT_SAVED");
 const insert=calls.find(c=>c.url.includes("/rest/v1/x1_prompt_assets")&&c.method==="POST").body[0];
 assert.equal(insert.tenant_id,TENANT_ID);
 assert.equal(insert.status,"draft");
 assert.equal(insert.version,1);
});
test("Prompt Lab refuses a mismatched tenant header before touching tenant data",async()=>{
 const calls=[];const sink=responseSink();
 await runPromptAssets({method:"GET",headers:{authorization:"Bearer valid-test-token","x-x1-tenant-id":"cccccccc-cccc-4ccc-8ccc-cccccccccccc"}},sink,{env:STAGING_ENV,fetchImpl:fakeX1(calls)});
 assert.equal(sink.statusCode,403);
 assert.equal(calls.some(c=>c.url.includes("/rest/v1/x1_prompt_assets")),false);
});
