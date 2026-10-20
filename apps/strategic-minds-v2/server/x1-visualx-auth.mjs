// Server-only, revocable Visual X read client. No service-role credential reaches Visual X.
// Credential hashes and access receipts reside in existing X1 staging tables.
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { PublicApiError, readBearer, STAGING_ORIGIN } from "./x1-staging.mjs";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SECRET=/^x1vx_[A-Za-z0-9_-]{43}$/;
const ROUTES=new Set(["health","worker-status","work-items","operator-status","browser-health","agent-sessions","prompt-assets"]);
const SERVICE="visual-x-read";
const digest=s=>createHash("sha256").update(s).digest("hex");
const keyHeaders=k=>({apikey:k,authorization:"Bearer "+k,accept:"application/json"});
const rest=(origin,path,params)=>origin+"/rest/v1/"+path+"?"+new URLSearchParams(params);

async function json(fetchImpl,url,options,code){
 let response;
 try{response=await fetchImpl(url,{...options,redirect:"error",signal:AbortSignal.timeout(7000)});}
 catch{throw new PublicApiError(503,code);}
 if(!response.ok)throw new PublicApiError(503,code);
 try{return await response.json();}
 catch{throw new PublicApiError(503,code);}
}

// Keep the service token rejected even if somebody turns on production writes.
export function rejectVisualXMutation(req){
 const v=req?.headers?.authorization??req?.headers?.Authorization;
 if(typeof v==="string" && /^Bearer\s+x1vx_/i.test(v))
  throw new PublicApiError(403,"VISUALX_READ_TOKEN_WRITE_DENIED");
}

// The only auth entry for Visual X is called from an allowlisted GET handler.
// X1 is the durable authority: changing active=false revokes the client immediately.
export async function readVisualXOperator(req,binding,fetchImpl,{env,route}){
 if(req.method!=="GET" || !ROUTES.has(route))
  throw new PublicApiError(403,"VISUALX_READ_ONLY_ROUTE");
 if(env.X1_VISUALX_READ_ENABLED!=="true" || binding.origin!==STAGING_ORIGIN)
  throw new PublicApiError(503,"VISUALX_READ_BINDING_DISABLED");
 const tenantId=String(env.X1_VISUALX_TENANT_ID||"").toLowerCase();
 if(!UUID.test(tenantId))throw new PublicApiError(503,"VISUALX_TENANT_NOT_CONFIGURED");
 const wanted=req.headers?.["x-x1-tenant-id"];
 if(wanted && (typeof wanted!=="string" || wanted.toLowerCase()!==tenantId))
  throw new PublicApiError(403,"TENANT_SCOPE_DENIED");
 const token=readBearer(req.headers);
 if(!SECRET.test(token))throw new PublicApiError(401,"AUTHENTICATION_REQUIRED");
 const hashes=await json(fetchImpl,rest(binding.origin,"x1_service_auth_hashes",{
  select:"token_sha256,active",service_name:"eq."+SERVICE,limit:"1"
 }),{method:"GET",headers:keyHeaders(binding.serviceKey)},"VISUALX_TOKEN_REGISTRY_UNAVAILABLE");
 const expected=hashes?.[0]?.token_sha256;
 if(hashes?.length!==1||hashes[0].active!==true||!(/^[a-f0-9]{64}$/).test(expected??""))
  throw new PublicApiError(401,"AUTH_INVALID");
 const actual=Buffer.from(digest(token),"hex"),stored=Buffer.from(expected,"hex");
 if(!timingSafeEqual(actual,stored))throw new PublicApiError(401,"AUTH_INVALID");
 const tenants=await json(fetchImpl,rest(binding.origin,"x1_tenants",{
  select:"tenant_id,status",tenant_id:"eq."+tenantId,status:"eq.ACTIVE",limit:"1"
 }),{method:"GET",headers:keyHeaders(binding.serviceKey)},"VISUALX_TENANT_UNAVAILABLE");
 if(!Array.isArray(tenants)||tenants.length!==1||tenants[0].tenant_id!==tenantId)
  throw new PublicApiError(403,"TENANT_NOT_ACTIVE");
 // Fail closed if the audit write or readback fails; no silent unaudited access.
 const receiptId=randomUUID();
 const records=await json(fetchImpl,rest(binding.origin,"x1_audit_receipts",{
  select:"audit_id,receipt_id,tenant_id"
 }),{method:"POST",headers:{...keyHeaders(binding.serviceKey),"content-type":"application/json",prefer:"return=representation"},
  body:JSON.stringify([{tenant_id:tenantId,receipt_type:"VISUALX_READ",receipt_id:receiptId,
   source_system:"visual-x-read-bridge",
   payload:{route,method:"GET",token_fingerprint:digest(token).slice(0,12),read_only:true}}])
 },"VISUALX_READ_AUDIT_UNAVAILABLE");
 if(!Array.isArray(records)||records.length!==1||
     records[0].receipt_id!==receiptId||records[0].tenant_id!==tenantId)
  throw new PublicApiError(503,"VISUALX_READ_AUDIT_UNVERIFIED");
 let sample;
 if(route==="operator-status"){
  const rows=await json(fetchImpl,rest(binding.origin,"x1_work_queue",{
   select:"status",tenant_id:"eq."+tenantId,order:"updated_at.desc",limit:"201"
  }),{method:"GET",headers:keyHeaders(binding.serviceKey)},"STAGING_QUEUE_UNAVAILABLE");
  if(!Array.isArray(rows))throw new PublicApiError(503,"STAGING_INVALID_RESPONSE");
  const counts=Object.fromEntries(["PENDING","LEASED","COMPLETED","FAILED","BLOCKED","DEAD_LETTER"].map(x=>[x,0]));
  for(const row of rows.slice(0,200))if(Object.hasOwn(counts,row.status))counts[row.status]++;
  sample={limit:200,truncated:rows.length>200,counts};
 }
 return {status:"STAGING_READ_VERIFIED",tenant_id:tenantId,
  role:"ADMIN",user_id:null,service_identity:SERVICE,audit_id:records[0].audit_id,
  ...(sample?{sample}:{}),writes:"DISABLED",dispatch:"DISABLED"};
}
export function isVisualXReadRequest(req){
 const v=req?.headers?.authorization??req?.headers?.Authorization;
 return typeof v==="string"&&/^Bearer\s+x1vx_/i.test(v);
}
export async function readOperatorOrVisualX(req,binding,fetchImpl,{env,route,readUser}){
 if(isVisualXReadRequest(req))return readVisualXOperator(req,binding,fetchImpl,{env,route});
 return readUser(req,binding,fetchImpl);
}
