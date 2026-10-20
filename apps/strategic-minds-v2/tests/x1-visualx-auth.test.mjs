import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {readVisualXOperator,rejectVisualXMutation} from "../server/x1-visualx-auth.mjs";
import {resolveStagingBinding,STAGING_ORIGIN} from "../server/x1-staging.mjs";
import {runWorkItems} from "../server/x1-work-items.mjs";
import {runPromptAssets} from "../server/x1-prompt-assets.mjs";
import {runAgentChat} from "../api/x1/agent-chat.js";
import {runPromptEvaluation} from "../server/x1-prompt-evaluate.mjs";
import {previewReady} from "../server/x1-preview-dispatch.mjs";

const TENANT="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const SECRET="x1vx_"+"A".repeat(43); // Synthetic only. Never put a real token in tests.
const ENV={VERCEL_ENV:"production",X1_PRODUCTION_BINDING_ENABLED:"true",
 SUPABASE_URL:STAGING_ORIGIN,SUPABASE_ANON_KEY:"synthetic-public",
 SUPABASE_SERVICE_ROLE_KEY:"synthetic-server",
 X1_VISUALX_READ_ENABLED:"true",X1_VISUALX_TENANT_ID:TENANT};
const req=(method="GET",more={})=>({method,headers:{authorization:"Bearer "+SECRET,...more}});
function sink(){return {statusCode:200,headers:{},body:null,setHeader(k,v){this.headers[k]=v;},end(s){this.body=JSON.parse(s);}};}
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json"}});
function fixture({active=true,auditSuccess=true}={}){
 const calls=[];
 const fetchImpl=async(url,o)=>{
  const u=new URL(url);calls.push({path:u.pathname,method:o.method,body:o.body});
  assert.equal(u.origin,STAGING_ORIGIN);
  if(u.pathname==="/rest/v1/x1_service_auth_hashes")
   return reply([{active,token_sha256:createHash("sha256").update(SECRET).digest("hex")}]);
  if(u.pathname==="/rest/v1/x1_tenants")return reply([{tenant_id:TENANT,status:"ACTIVE"}]);
  if(u.pathname==="/rest/v1/x1_audit_receipts"){
   const b=JSON.parse(o.body)[0];
   return auditSuccess?reply([{audit_id:"cccccccc-cccc-4ccc-8ccc-cccccccccccc",receipt_id:b.receipt_id,tenant_id:TENANT}],201):reply([],503);
  }
  if(u.pathname==="/rest/v1/x1_work_queue")return reply([{status:"COMPLETED"},{status:"PENDING"}]);
  throw Error("Unexpected endpoint "+u.pathname);
 };
 return {calls,fetchImpl};
}
test("production remains OFF without operator opt-in; exact database URL required",()=>{
 const bind=resolveStagingBinding(ENV);
 assert.equal(bind.ok,true);
 assert.deepEqual(resolveStagingBinding({...ENV,X1_PRODUCTION_BINDING_ENABLED:"false"}),{ok:false,code:"NON_PREVIEW_RUNTIME"});
 assert.equal(resolveStagingBinding({...ENV,SUPABASE_URL:"https://vgsmyhqqtkkluhypxyua.supabase.co"}).code,"NON_STAGING_TARGET");
});
test("service read requires stored active hash, fixed tenant and a durable audit receipt",async()=>{
 const f=fixture();const op=await readVisualXOperator(req(),resolveStagingBinding(ENV),f.fetchImpl,{env:ENV,route:"operator-status"});
 assert.equal(op.tenant_id,TENANT);
 assert.equal(op.sample.counts.COMPLETED,1);
 assert.equal(op.status,"STAGING_READ_VERIFIED");
 assert.equal(op.audit_id,"cccccccc-cccc-4ccc-8ccc-cccccccccccc");
 assert.deepEqual(f.calls.map(c=>c.path),["/rest/v1/x1_service_auth_hashes","/rest/v1/x1_tenants","/rest/v1/x1_audit_receipts","/rest/v1/x1_work_queue"]);
 assert.equal(f.calls.find(c=>c.path==="/rest/v1/x1_audit_receipts").body.includes(SECRET),false);
});
test("revoked hash denies before receipt, mismatched tenant denies before upstream",async()=>{
 const f=fixture({active:false});
 await assert.rejects(readVisualXOperator(req(),resolveStagingBinding(ENV),f.fetchImpl,{env:ENV,route:"worker-status"}),{code:"AUTH_INVALID"});
 assert.equal(f.calls.some(x=>x.path.includes("audit")),false);
 const g=fixture();
 await assert.rejects(readVisualXOperator(req("GET",{"x-x1-tenant-id":"cccccccc-cccc-4ccc-8ccc-cccccccccccc"}),resolveStagingBinding(ENV),g.fetchImpl,{env:ENV,route:"worker-status"}),{code:"TENANT_SCOPE_DENIED"});
 assert.equal(g.calls.length,0);
});
test("no audit receipt means no authorized X1 read",async()=>{
 const f=fixture({auditSuccess:false});
 await assert.rejects(readVisualXOperator(req(),resolveStagingBinding(ENV),f.fetchImpl,{env:ENV,route:"worker-status"}),{code:"VISUALX_READ_AUDIT_UNAVAILABLE"});
});
test("Visual X token is rejected on every mutation family even if production writes are enabled",async()=>{
 const env={...ENV,X1_PRODUCTION_WRITES_ENABLED:"true"};
 const f=fixture();
 for(const run of [
  (r,s)=>runWorkItems({...r,body:{title:"Do not write",description:"This is a denied write attempt."}},s,{env,fetchImpl:f.fetchImpl}),
  (r,s)=>runPromptAssets({...r,body:{title:"Do not write",promptText:"No write please",category:"general"}},s,{env,fetchImpl:f.fetchImpl}),
  (r,s)=>runAgentChat({...r,body:{session_id:"dddddddd-dddd-4ddd-8ddd-dddddddddddd",request_id:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",message:"Please write"}},s,{env,fetchImpl:f.fetchImpl}),
  (r,s)=>runPromptEvaluation({...r,body:{promptText:"At least twenty characters prompt",testInput:"Sample"}},s,{env,fetchImpl:f.fetchImpl})
 ]){
  const res=sink();
  await run(req("POST"),res);
  assert.equal(res.statusCode,403);
  assert.equal(res.body.reason,"VISUALX_READ_TOKEN_WRITE_DENIED");
 }
 assert.equal(f.calls.length,0);
 assert.throws(()=>rejectVisualXMutation(req("POST")),{code:"VISUALX_READ_TOKEN_WRITE_DENIED"});
});
test("production dispatch requires independent opt-ins and audit flag; preview remains unchanged",()=>{
 const f={VERCEL_ENV:"production",X1_PRODUCTION_BINDING_ENABLED:"true",
 X1_PRODUCTION_WRITES_ENABLED:"true",X1_PRODUCTION_DISPATCH_ENABLED:"true",
 X1_DB_COMPLETION_FENCING_PASS:"true",X1_PREVIEW_WORKER_READY:"true"};
 assert.equal(previewReady(f),false);
 assert.equal(previewReady({...f,X1_PRODUCTION_DISPATCH_AUDIT_ENABLED:"true"}),true);
 assert.equal(previewReady({...f,X1_PRODUCTION_DISPATCH_AUDIT_ENABLED:"true",X1_PRODUCTION_DISPATCH_ENABLED:"false"}),false);
 assert.equal(previewReady({VERCEL_ENV:"preview",X1_PREVIEW_DISPATCH_ENABLED:"true",
  X1_DB_COMPLETION_FENCING_PASS:"true",X1_PREVIEW_WORKER_READY:"true"}),true);
});
test("CSP frame-ancestors scopes HTML and preserves noindex / nosniff",()=>{
 const j=JSON.parse(readFileSync(new URL("../vercel.json",import.meta.url),"utf8"));
 const global=j.headers.find(x=>x.source==="/(.*)");
 assert.equal(global.headers.some(x=>x.key==="X-Frame-Options"),false);
 assert.ok(global.headers.some(x=>x.key==="X-Content-Type-Options"&&x.value==="nosniff"));
 for(const route of ["/","/v2/:path*","/pricing","/portal","/portal/:path*","/admin","/admin/:path*"]){
  const match=j.headers.find(x=>x.source===route);
  assert.ok(match?.headers.some(h=>h.key==="Content-Security-Policy"&&h.value==="frame-ancestors 'self' https://visual-x1.base44.app"));
 }
 for(const route of ["/admin","/admin/:path*","/portal","/portal/:path*","/api/:path*"]){
  assert.ok(j.headers.find(x=>x.source===route)?.headers.some(h=>h.key==="X-Robots-Tag"&&h.value.includes("noindex")));
 }
});
