import test from "node:test";
import assert from "node:assert/strict";
import {createHmac} from "node:crypto";
import {runControlPlaneAuthorize,validateAuthorizationRequest,workerIsLeaseReady,capabilitiesMatch} from "../server/x1-control-plane-authorize.mjs";
import {STAGING_ORIGIN} from "../server/x1-staging.mjs";
const T="666f23bf-61bd-4be0-b5cb-4872e04fad9b", W="x1-swarm-preview-1";
const ENV={VERCEL_ENV:"preview",SUPABASE_URL:STAGING_ORIGIN,SUPABASE_ANON_KEY:"test-anon",
  SUPABASE_SERVICE_ROLE_KEY:"test-service",X1_CONTROL_PLANE_SERVICE_NAME:"x1-swarm",
  CAPABILITY_BOOTSTRAP_SIGNING_KEY:"test-only-signing-key-32-bytes-minimum"};
const INPUT={taskId:"task-1",agentId:W,tenantId:T,requestedAction:"READ_ONLY",
  requiredCapabilities:[{id:"connector:supabase",mechanism:"connector"}]};
const GOOD_WORKER={worker_id:W,enabled:true,lease_allowed:true,lease_hold:false,
  credential_binding_state:"BOUND",runtime_state:"ONLINE",heartbeat_age_seconds:12,
  allowed_action_classes:["READ_ONLY"],allowed_capabilities:["connector:supabase"]};
const GOOD_CAP={capability_id:"connector:supabase",mechanism:"connector",available:true,authorized:true,
  fresh:true,validated:true,platform_gated:false,impossible_by_skill:false,source:"registry"};
const AT="2026-10-21T08:00:00.000Z",EX="2026-10-21T08:02:00.000Z";
const now=()=>new Date(AT);
function sink(){return {statusCode:200,headers:{},body:null,
  setHeader(k,v){this.headers[k]=v;},end(v){this.body=JSON.parse(v);}};}
function json(v,status=200){return new Response(JSON.stringify(v),{status,headers:{"content-type":"application/json"}});}
function stub(calls=[],overrides={}){
  let saved=null;
  return async(url,options={})=>{
    const u=new URL(url); assert.equal(u.origin,STAGING_ORIGIN);
    assert.equal(options.redirect,"error");
    const body=options.body?JSON.parse(options.body):null;
    calls.push({path:u.pathname,method:options.method||"GET"});
    if(u.pathname==="/rest/v1/rpc/x1_match_worker_auth")
      return json(overrides.workerId??W);
    if(u.pathname==="/rest/v1/rpc/x1_worker_status_summary")
      return json({tenant_id:T,workers:overrides.workers??[GOOD_WORKER]});
    if(u.pathname==="/rest/v1/x1_work_queue")
      return json(overrides.works??[{tenant_id:T,task_id:"task-1",status:"LEASED",
        action_class:"READ_ONLY",lease_id:"lease-1",required_capabilities:INPUT.requiredCapabilities}]);
    if(u.pathname==="/rest/v1/x1_task_leases")
      return json(overrides.leases??[{task_id:"task-1",tenant_id:T,lease_id:"lease-1",
        holder_agent_id:W,status:"ACTIVE",expires_at:EX}]);
    if(u.pathname==="/rest/v1/x1_capability_registry")
      return json(overrides.registry??[GOOD_CAP]);
    if(u.pathname==="/rest/v1/rpc/x1_record_bootstrap_authorization"){
      saved=body;
      return new Response(null,{status:204});
    }
    if(u.pathname==="/rest/v1/x1_bootstrap_receipts"){
      if(!saved)throw new Error("write receipt first");
      return json(overrides.readback??[{receipt_id:saved.p_receipt.receipt_id,
        content_hash:saved.p_receipt.content_hash,tenant_id:T}]);
    }
    throw new Error("Unexpected mock request: "+u.pathname);
  };
}
const makeReq=(headers={authorization:"Bearer synthetic-worker-token"},body=INPUT)=>({method:"POST",headers,body});
function canonical(v){
  if(Array.isArray(v))return "["+v.map(canonical).join(",")+"]";
  if(v&&typeof v==="object")return "{"+Object.entries(v).sort(([a],[b])=>a.localeCompare(b))
    .map(([k,x])=>JSON.stringify(k)+":"+canonical(x)).join(",")+"}";
  return JSON.stringify(v);
}
test("reject non-READ_ONLY and malformed tenant/capabilities",()=>{
 assert.throws(()=>validateAuthorizationRequest({...INPUT,requestedAction:"PRODUCTION_RELEASE"}));
 assert.throws(()=>validateAuthorizationRequest({...INPUT,tenantId:"wrong"}));
 assert.throws(()=>validateAuthorizationRequest({...INPUT,requiredCapabilities:[]}));
 assert.throws(()=>validateAuthorizationRequest({...INPUT,requiredCapabilities:[INPUT.requiredCapabilities[0],INPUT.requiredCapabilities[0]]}));
});
test("deny sensor-only / no-lease worker and unvalidated capabilities",()=>{
 assert.equal(workerIsLeaseReady({...GOOD_WORKER,lease_allowed:false},W),false);
 assert.equal(workerIsLeaseReady({...GOOD_WORKER,heartbeat_age_seconds:500},W),false);
 assert.equal(capabilitiesMatch(INPUT.requiredCapabilities,INPUT.requiredCapabilities,[{...GOOD_CAP,authorized:false}]),false);
 assert.equal(capabilitiesMatch(INPUT.requiredCapabilities,[],[GOOD_CAP]),false);
});
test("POST requires staging binding and internal token; no upstream read on rejected calls",async()=>{
 const calls=[],fetchImpl=stub(calls),res=sink();
 await runControlPlaneAuthorize(makeReq({}),res,{env:ENV,fetchImpl,now});
 assert.equal(res.statusCode,401);assert.equal(calls.length,0);
 const r2=sink();
 await runControlPlaneAuthorize(makeReq(),r2,{env:{...ENV,VERCEL_ENV:"production"},fetchImpl,now});
 assert.equal(r2.statusCode,503);assert.equal(calls.length,0);
});
test("reject mismatched registered worker identity without capability grant",async()=>{
 const calls=[],res=sink();
 await runControlPlaneAuthorize(makeReq(),res,{env:ENV,fetchImpl:stub(calls,{workerId:"other"}),now});
 assert.equal(res.statusCode,403);assert.equal(res.body.code,"WORKER_IDENTITY_DENIED");
 assert.deepEqual(calls.map(x=>x.path),["/rest/v1/rpc/x1_match_worker_auth"]);
});
test("reject absent lease and unregistered capability before signing",async()=>{
 for(const overrides of [{works:[]},{registry:[{...GOOD_CAP,validated:false}]},{workers:[{...GOOD_WORKER,lease_allowed:false}]}]){
   const calls=[],res=sink();
   await runControlPlaneAuthorize(makeReq(),res,{env:ENV,fetchImpl:stub(calls,overrides),now});
   assert.equal(res.statusCode,403);
   assert.equal(calls.some(x=>x.path==="/rest/v1/rpc/x1_record_bootstrap_authorization"),false);
 }
});
test("only return signed matching authorization after receipt is durably read back",async()=>{
 const calls=[],res=sink();
 await runControlPlaneAuthorize(makeReq(),res,{env:ENV,fetchImpl:stub(calls),now});
 assert.equal(res.statusCode,200);
 const a=res.body.authorization;
 assert.equal(a.allowed,true);assert.equal(a.tenant_id,T);
 assert.equal(a.task_id,INPUT.taskId);assert.equal(a.agent_id,W);
 const {signature,...payload}=a;
 const expected=createHmac("sha256",ENV.CAPABILITY_BOOTSTRAP_SIGNING_KEY).update(canonical(payload)).digest("hex");
 assert.equal(signature.algorithm,"HMAC-SHA256");assert.equal(signature.value,expected);
 assert.ok(calls.some(x=>x.path==="/rest/v1/rpc/x1_record_bootstrap_authorization"));
 assert.ok(calls.some(x=>x.path==="/rest/v1/x1_bootstrap_receipts"));
});
test("fail closed when independent receipt readback does not match",async()=>{
 const res=sink(),calls=[];
 await runControlPlaneAuthorize(makeReq(),res,{env:ENV,fetchImpl:stub(calls,{readback:[]}),now});
 assert.equal(res.statusCode,503);assert.equal(res.body.code,"AUTHORIZATION_RECEIPT_READBACK_FAILED");
});
test("reject GET at authorizer and disclose no secret values",async()=>{
 const res=sink();
 await runControlPlaneAuthorize({method:"GET",headers:{}},res,{env:ENV,fetchImpl:stub(),now});
 assert.equal(res.statusCode,405);assert.equal(JSON.stringify(res.body).includes("test-only-signing"),false);
});
