import test from "node:test";
import assert from "node:assert/strict";
import {runX1McpAdapter} from "../server/x1-mcp-adapter.mjs";
import {STAGING_ORIGIN} from "../server/x1-staging.mjs";
const T="666f23bf-61bd-4be0-b5cb-4872e04fad9b",A="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ENV={VERCEL_ENV:"preview",SUPABASE_URL:STAGING_ORIGIN,SUPABASE_ANON_KEY:"anon",
 SUPABASE_SERVICE_ROLE_KEY:"server",X1_MCP_ADAPTER_SERVICE_TOKEN:"test-token-that-has-at-least-32-characters"};
const payload={tenant_id:T,actor_id:A,operation:"inventory",subject:"task-test",
 dry_run:true,allowed_environment:"staging",publication_allowed:false};
const request=(opts={})=>({method:"POST",query:{group:"supergpt",operation:"inventory"},
 body:{...payload,...opts.body},headers:{authorization:"Bearer "+ENV.X1_MCP_ADAPTER_SERVICE_TOKEN,
 "x-x1-tenant-id":T,"x-x1-actor-id":A,...opts.headers},...opts.other});
const sink=()=>({statusCode:200,body:null,setHeader(){},end(s){this.body=JSON.parse(s);}});
function readbacks(calls=[],memberStatus="ACTIVE"){
 return async(url,opts)=>{
  assert.equal(new URL(url).origin,STAGING_ORIGIN);
  assert.equal(opts.redirect,"error");
  const p=new URL(url).pathname;calls.push(p);
  const out=p==="/rest/v1/x1_tenant_memberships"?
   [{tenant_id:T,user_id:A,role:"OWNER",status:memberStatus}]:
   p==="/rest/v1/x1_tenants"?[{tenant_id:T,status:"ACTIVE"}]:
   p==="/rest/v1/x1_capability_registry"?[{
    capability_id:"connector:supabase",mechanism:"connector",available:true,
    authorized:true,fresh:true,validated:true,platform_gated:false}]:
   p==="/rest/v1/x1_work_queue"?[{task_id:"task-test",tenant_id:T,status:"COMPLETED",
      action_class:"READ_ONLY",attempts:1,updated_at:"2026-10-21T00:00:00Z",validation_receipt_id:"r1"}]:
   null;
  if(!out)throw Error("Unexpected "+p);
  return new Response(JSON.stringify(out),{status:200});
 };
}
test("rejects missing service credential before database read",async()=>{
 const calls=[],res=sink();
 await runX1McpAdapter(request({headers:{authorization:"Bearer bad"}}),res,{env:ENV,fetchImpl:readbacks(calls)});
 assert.equal(res.statusCode,401);assert.equal(calls.length,0);
});
test("rejects non-read-only and tenant/actor spoofing",async()=>{
 for(const opts of [{body:{dry_run:false}},{body:{publication_allowed:true}},
  {headers:{"x-x1-tenant-id":"not-the-tenant"}}]){
  const calls=[],res=sink();
  await runX1McpAdapter(request(opts),res,{env:ENV,fetchImpl:readbacks(calls)});
  assert.equal(res.statusCode,403);assert.equal(calls.length,0);
 }
});
test("fails closed for unimplemented tools",async()=>{
 const calls=[],res=sink();
 await runX1McpAdapter(request({body:{operation:"publish"},other:{query:{group:"social",operation:"publish"}}}),
  res,{env:ENV,fetchImpl:readbacks(calls)});
 assert.equal(res.statusCode,501);assert.equal(calls.length,0);
});
test("returns real sanitized tenant-scoped capability inventory",async()=>{
 const calls=[],res=sink();
 await runX1McpAdapter(request(),res,{env:ENV,fetchImpl:readbacks(calls)});
 assert.equal(res.statusCode,200);assert.equal(res.body.items[0].id,"connector:supabase");
 assert.equal(res.body.dispatch,false);assert.equal(res.body.worker_receipt,null);
 assert.ok(calls.includes("/rest/v1/x1_capability_registry"));
});
test("returns existing queue job status without payload disclosure",async()=>{
 const calls=[],res=sink();
 await runX1McpAdapter(request({body:{operation:"job_status"},
   other:{query:{group:"supergpt",operation:"job_status"}}}),
   res,{env:ENV,fetchImpl:readbacks(calls)});
 assert.equal(res.statusCode,200);assert.equal(res.body.job.status,"COMPLETED");
 assert.equal(res.body.job.validation_receipt_id,"r1");assert.equal(res.body.dispatch,false);
 assert.equal("payload" in res.body.job,false);
});
test("denies inactive tenant/membership before reading capability or queue rows",async()=>{
 const calls=[],res=sink();
 await runX1McpAdapter(request(),res,{env:ENV,fetchImpl:readbacks(calls,"INACTIVE")});
 // The membership PostgREST filter should ensure INACTIVE is not returned; injected result is rejected here.
 assert.equal(res.statusCode,403);assert.equal(calls.length,1);
});
test("denies external environment before reads",async()=>{
 const calls=[],res=sink();
 await runX1McpAdapter(request(),res,{env:{...ENV,VERCEL_ENV:"production"},fetchImpl:readbacks(calls)});
 assert.equal(res.statusCode,503);assert.equal(calls.length,0);
});
