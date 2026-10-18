import test from "node:test";
import assert from "node:assert/strict";
import {chatConfig,postAgentTurn} from "../server/x1-agent-chat.mjs";
import {previewPrompt,previewReady,compilePremiumPreview,dispatchPreviewFromChat} from "../server/x1-preview-dispatch.mjs";
import {STAGING_ORIGIN} from "../server/x1-staging.mjs";

const USER="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const TENANT="666f23bf-61bd-4be0-b5cb-4872e04fad9b";
const SESSION="dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const REQUEST="eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const WORK="ffffffff-ffff-4fff-8fff-ffffffffffff";
const SOURCE="f88c814d4f9e9fec0a04010382f68c69581793b8";
const PROMPT="Build preview: premium epoxy garage floor estimate website for Boca Raton FL";
const ENV={VERCEL_ENV:"preview",SUPABASE_URL:STAGING_ORIGIN+"/",
 SUPABASE_ANON_KEY:"test-public-key",SUPABASE_SERVICE_ROLE_KEY:"test-server-service-key",
 X1_PREVIEW_DISPATCH_ENABLED:"true",X1_DB_COMPLETION_FENCING_PASS:"true",
 X1_PREVIEW_WORKER_READY:"true"};
const op={status:"STAGING_READ_VERIFIED",user_id:USER,tenant_id:TENANT,role:"OWNER"};
function req(){return {method:"POST",url:"/api/x1/agent-chat",
 headers:{authorization:"Bearer demo-verified-jwt"},
 body:{session_id:SESSION,request_id:REQUEST,message:PROMPT}};}
function fixture({role="OWNER",otherTenant=false}={}){
 const calls=[],turns=[];let work;
 const fetchImpl=async(url,opt)=>{
  const u=new URL(url);calls.push({path:u.pathname,url,method:opt.method});
  const reply=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:{"content-type":"application/json"}});
  if(u.pathname==="/auth/v1/user")return reply({id:USER});
  if(u.pathname==="/rest/v1/x1_tenant_memberships")return reply([{tenant_id:otherTenant?"cccccccc-cccc-4ccc-8ccc-cccccccccccc":TENANT,role,status:"ACTIVE"}]);
  if(u.pathname==="/rest/v1/x1_tenants")return reply([{tenant_id:TENANT,status:"ACTIVE"}]);
  if(u.pathname==="/rest/v1/apex_output_events")return reply([]);
  if(u.pathname==="/rest/v1/x1_work_queue"){
   if(opt.method==="GET"&&u.searchParams.has("work_id")){
    assert.equal(u.searchParams.get("tenant_id"),"eq."+TENANT);
    return reply([{work_id:WORK,tenant_id:TENANT,task_id:work.task_id,status:"PENDING",
      source_sha:work.source_sha,idempotency_key:work.idempotency_key}]);
   }
   return reply([{status:"PENDING"}]);
  }
  if(u.pathname==="/rest/v1/rpc/x1_enqueue_work"){
   assert.equal(opt.method,"POST");
   assert.equal(opt.headers.authorization,"Bearer "+ENV.SUPABASE_SERVICE_ROLE_KEY);
   work=JSON.parse(opt.body).p_work;
   return reply(WORK);
  }
  if(u.pathname==="/rest/v1/x1_admin_chat_turns"){
   if(opt.method==="POST"){
    const item=JSON.parse(opt.body);
    assert.equal(item.tenant_id,TENANT);
    if(item.role==="assistant")assert.equal(item.status,"X1_SYNC_ONLY");
    const r={...item,turn_id:"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",created_at:"2026-10-11T15:00:00Z"};
    turns.push(r);return reply([r],201);
   }
   return reply(turns);
  }
  throw Error("Unexpected integration endpoint "+u.pathname);
 };
 return {fetchImpl,calls,turns,get work(){return work}};
}
test("explicit command classification, premium compiled app and X1 staging mode",()=>{
 assert.equal(previewPrompt("What is a good website platform?"),null);
 assert.equal(previewPrompt(PROMPT)!==null,true);
 assert.equal(previewReady(ENV),true);
 assert.equal(chatConfig(ENV).dispatch,"PREVIEW_BUILD_READY");
 assert.equal(chatConfig({...ENV,VERCEL_ENV:"production"}).status,"UNBOUND");
 const src=compilePremiumPreview(PROMPT);
 assert.ok(src.html.startsWith("<!doctype html>"));
 assert.ok(src.html.includes("NOT A REAL BUSINESS"));
 assert.ok(src.html.includes("noindex,nofollow"));
 assert.ok(src.html.includes('id="amount"'));
 assert.match(src.sha256,/^[a-f0-9]{64}$/);
 assert.throws(()=>compilePremiumPreview("Build preview: a customer invoicing SaaS"),
  /X1_DETERMINISTIC_COMPILER_REQUIRES_FLOORING_INTENT/);
});
test("one admin command -> existing queue RPC -> exact tenant/source readback; no paid GPT",async()=>{
 const d=fixture();const out=await postAgentTurn(req(),{env:ENV,fetchImpl:d.fetchImpl});
 assert.equal(out.dispatch,"QUEUED_NOT_DEPLOYED");
 assert.equal(out.work.workId,WORK);
 assert.equal(out.mode,"X1_SYNC_ONLY");
 assert.match(out.response,/QUEUED, not deployed yet/);
 assert.equal(out.work.sourceSha,SOURCE);
 assert.equal(d.work.action_class,"NON_PRODUCTION_MUTATION");
 assert.equal(d.work.payload.release_mode,"preview");
 assert.equal(d.work.payload.no_spend,true);
 assert.equal(d.work.payload.customer_outbound,false);
 assert.equal(d.work.max_attempts,1);
 assert.equal(d.work.source_sha,SOURCE);
 assert.equal(d.work.required_capabilities[0].id,"agent:smai:13-digital-dominance");
 assert.equal(d.calls.filter(x=>x.path==="/rest/v1/rpc/x1_enqueue_work").length,1);
 assert.equal(d.calls.filter(x=>x.path==="/rest/v1/x1_work_queue"&&x.url.includes("work_id")).length,1);
 assert.equal(d.calls.filter(x=>x.path.includes("ai-gateway")).length,0);
 assert.equal(d.turns.length,2);
});
test("preview feature flags default OFF; no accepted turn or queue mutation",async()=>{
 const d=fixture();
 await assert.rejects(()=>postAgentTurn(req(),{
  env:{...ENV,X1_PREVIEW_WORKER_READY:"false"},fetchImpl:d.fetchImpl
 }),/X1_PREVIEW_WORKER_NOT_ACTIVATED/);
 assert.equal(d.calls.filter(x=>x.path==="/rest/v1/rpc/x1_enqueue_work").length,0);
 assert.equal(d.turns.length,0);
});
test("VIEWER membership and cross-tenant identity cannot dispatch",async()=>{
 for(const options of [{role:"VIEWER"},{otherTenant:true}]){
  const d=fixture(options);
  await assert.rejects(()=>postAgentTurn(req(),{env:ENV,fetchImpl:d.fetchImpl}));
  assert.equal(d.calls.filter(x=>x.path==="/rest/v1/rpc/x1_enqueue_work").length,0);
  assert.equal(d.turns.length,0);
 }
});
test("same command has stable source and no credential in receipt",async()=>{
 const d=fixture();const packet=await dispatchPreviewFromChat({
  binding:{origin:STAGING_ORIGIN,serviceKey:ENV.SUPABASE_SERVICE_ROLE_KEY},
  operator:op,message:PROMPT,sessionId:SESSION,requestId:REQUEST,
  env:ENV,fetchImpl:d.fetchImpl});
 assert.equal(packet.status,"QUEUED_NOT_DEPLOYED");
 assert.equal(packet.workId,WORK);
 assert.equal(JSON.stringify(packet).includes(ENV.SUPABASE_SERVICE_ROLE_KEY),false);
});
