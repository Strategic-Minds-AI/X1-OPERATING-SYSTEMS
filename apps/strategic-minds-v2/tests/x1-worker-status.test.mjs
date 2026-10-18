import test from "node:test";
import assert from "node:assert/strict";
import {runWorkerStatus} from "../server/x1-worker-status.mjs";
import {STAGING_ORIGIN} from "../server/x1-staging.mjs";
const USER_ID="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const TENANT_ID="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ENV={VERCEL_ENV:"preview",SUPABASE_URL:STAGING_ORIGIN,SUPABASE_ANON_KEY:"public-test-key",SUPABASE_SERVICE_ROLE_KEY:"server-test-key"};
function sink(){return {statusCode:200,headers:{},body:null,setHeader(k,v){this.headers[k]=v;},end(s){try{this.body=JSON.parse(s);}catch{this.body=null;}}};}
function reply(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json"}});}
function fakeFetch(calls=[],tenantId=TENANT_ID){
 return async(url,options={})=>{
  const u=new URL(url),method=options.method||"GET",body=options.body?JSON.parse(options.body):null;calls.push({url:u.toString(),method,body});
  assert.equal(u.origin,STAGING_ORIGIN);
  if(u.pathname==="/auth/v1/user")return reply({id:USER_ID});
  if(u.pathname==="/rest/v1/x1_tenant_memberships")return reply([{tenant_id:TENANT_ID,role:"OWNER",status:"ACTIVE"}]);
  if(u.pathname==="/rest/v1/x1_tenants")return reply([{tenant_id:TENANT_ID,status:"ACTIVE"}]);
  if(u.pathname==="/rest/v1/x1_work_queue")return reply([{status:"COMPLETED"}]);
  if(u.pathname==="/rest/v1/rpc/x1_worker_status_summary"&&method==="POST"){
   assert.equal(body.p_tenant_id,TENANT_ID);
   return reply({tenant_id:tenantId,observed_at:"2026-10-18T14:00:00Z",workers:[
    {worker_id:"x1-swarm-preview-1",environment:"preview",execution_plane:"railway",enabled:true,credential_binding_state:"BOUND",allowed_action_classes:["READ_ONLY"],allowed_capabilities:["agent:smai:07-qa"],lease_hold:false,lease_allowed:true,runtime_state:"ONLINE",heartbeat_at:"2026-10-18T13:59:20Z",heartbeat_age_seconds:40,worker_status:"READ_ONLY",branch_write_ready:false,privateToken:"never-return-this"},
    {worker_id:"jarvis-local-ollama-1",environment:"preview",execution_plane:"local-ollama",enabled:false,credential_binding_state:"BOUND",allowed_action_classes:["READ_ONLY"],allowed_capabilities:["ollama_chat"],lease_hold:true,lease_allowed:false,runtime_state:null,heartbeat_at:null,heartbeat_age_seconds:null,worker_status:"HELD",branch_write_ready:false,privateToken:"never-return-this"}
   ]});
  }
  throw new Error("Unexpected endpoint "+u.pathname);
 };
}
test("worker status endpoint rejects unauthenticated access",async()=>{
 const calls=[],res=sink();
 await runWorkerStatus({method:"GET",headers:{}},res,{env:ENV,fetchImpl:fakeFetch(calls)});
 assert.equal(res.statusCode,401);
 assert.equal(calls.some(c=>c.url.includes("x1_worker_status_summary")),false);
});
test("worker status endpoint returns tenant-scoped sanitized worker readiness",async()=>{
 const calls=[],res=sink();
 await runWorkerStatus({method:"GET",headers:{authorization:"Bearer x1-user-token"}},res,{env:ENV,fetchImpl:fakeFetch(calls)});
 assert.equal(res.statusCode,200);
 assert.equal(res.body.status,"WORKER_STATUS_VERIFIED");
 assert.equal(res.body.tenant_id,TENANT_ID);
 assert.equal(res.body.readiness.branchWriteWorkers,0);
 assert.equal(res.body.readiness.readOnlyWorkers,1);
 assert.equal(res.body.readiness.heldWorkers,1);
 assert.equal(res.body.readiness.staleWorkers,1);
 assert.equal(res.body.workers[0].workerStatus,"READ_ONLY");
 assert.equal(res.body.workers[0].branchWriteReady,false);
 assert.equal("privateToken" in res.body.workers[0],false);
 assert.ok(calls.some(c=>c.url.includes("x1_worker_status_summary")&&c.body.p_tenant_id===TENANT_ID));
});
test("worker status endpoint rejects mismatched tenant readback",async()=>{
 const calls=[],res=sink();
 await runWorkerStatus({method:"GET",headers:{authorization:"Bearer x1-user-token"}},res,{env:ENV,fetchImpl:fakeFetch(calls,"cccccccc-cccc-4ccc-8ccc-cccccccccccc")});
 assert.equal(res.statusCode,503);
 assert.equal(res.body.reason,"WORKER_STATUS_INVALID");
});
test("worker status endpoint allows only GET",async()=>{
 const res=sink();
 await runWorkerStatus({method:"POST",headers:{}},res,{env:ENV,fetchImpl:fakeFetch()});
 assert.equal(res.statusCode,405);
 assert.equal(res.headers.Allow,"GET");
});
