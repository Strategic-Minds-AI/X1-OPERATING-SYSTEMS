// Tenant-scoped, read-only X1 gateway adapter over the existing staging database.
// Source of truth is existing X1 Supabase; never creates another queue or scheduler.
import {timingSafeEqual} from "node:crypto";
import {PublicApiError,readBearer,resolveStagingBinding,respond} from "./x1-staging.mjs";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ROLES=new Set(["OWNER","ADMIN","BUILDER","VALIDATOR"]);
const OPERATIONS={"supergpt.inventory":"inventory","supergpt.job_status":"job_status"};
function same(a,b){
 if(typeof a!=="string"||typeof b!=="string"||a.length<32||b.length<32)return false;
 const left=Buffer.from(a),right=Buffer.from(b);
 return left.length===right.length && timingSafeEqual(left,right);
}
export function validateAdapterRequest(req,env=process.env){
 if(req.method!=="POST")throw new PublicApiError(405,"METHOD_NOT_ALLOWED");
 if(!same(readBearer(req.headers),env.X1_MCP_ADAPTER_SERVICE_TOKEN))
   throw new PublicApiError(401,"ADAPTER_SERVICE_DENIED");
 const b=req.body;
 if(!b||typeof b!=="object"||Array.isArray(b)||JSON.stringify(b).length>4000||
    b.allowed_environment!=="staging"||b.publication_allowed!==false||b.dry_run!==true)
   throw new PublicApiError(403,"ADAPTER_READONLY_SCOPE_REQUIRED");
 const group=req.query?.group,op=req.query?.operation;
 if(typeof group!=="string"||typeof op!=="string"||
    !/^[a-z][a-z0-9_]{1,30}$/.test(group)||!/^[a-z][a-z0-9_]{1,40}$/.test(op)||
    b.operation!==op)throw new PublicApiError(400,"ADAPTER_OPERATION_INVALID");
 const capability=group+"."+op;
 if(!Object.hasOwn(OPERATIONS,capability))throw new PublicApiError(501,"ADAPTER_NOT_IMPLEMENTED");
 if(!UUID.test(b.tenant_id||"")||!UUID.test(b.actor_id||"")||
    req.headers["x-x1-tenant-id"]!==b.tenant_id||
    req.headers["x-x1-actor-id"]!==b.actor_id)
   throw new PublicApiError(403,"ADAPTER_TENANT_CONTEXT_INVALID");
 const subject=typeof b.subject==="string"&&/^[a-zA-Z0-9._:-]{3,128}$/.test(b.subject)?b.subject:null;
 return {capability,tenantId:b.tenant_id,actorId:b.actor_id,subject};
}
async function readJson(fetchImpl,binding,path){
 let response;
 try{
  response=await fetchImpl(binding.origin+path,{method:"GET",
   headers:{apikey:binding.serviceKey,authorization:"Bearer "+binding.serviceKey,accept:"application/json"},
   redirect:"error",signal:AbortSignal.timeout(6500)});
 }catch{throw new PublicApiError(503,"ADAPTER_DATABASE_UNAVAILABLE");}
 if(!response.ok)throw new PublicApiError(503,"ADAPTER_DATABASE_REJECTED");
 try{return await response.json();}catch{throw new PublicApiError(503,"ADAPTER_DATABASE_INVALID");}
}
const url=(table,params)=>"/rest/v1/"+table+"?"+new URLSearchParams(params).toString();
export async function runX1McpAdapter(req,res,{env=process.env,fetchImpl=fetch}={}){
 try{
  const binding=resolveStagingBinding(env);
  if(!binding.ok)throw new PublicApiError(503,binding.code);
  const ctx=validateAdapterRequest(req,env);
  const member=await readJson(fetchImpl,binding,url("x1_tenant_memberships",{
   select:"tenant_id,user_id,role,status",tenant_id:"eq."+ctx.tenantId,
   user_id:"eq."+ctx.actorId,status:"eq.ACTIVE",limit:"2"
  }));
  if(!Array.isArray(member)||member.length!==1||member[0].tenant_id!==ctx.tenantId||
     member[0].user_id!==ctx.actorId||!ROLES.has(member[0].role))
    throw new PublicApiError(403,"ADAPTER_TENANT_MEMBERSHIP_DENIED");
  const tenants=await readJson(fetchImpl,binding,url("x1_tenants",{
   select:"tenant_id,status",tenant_id:"eq."+ctx.tenantId,status:"eq.ACTIVE",limit:"2"
  }));
  if(!Array.isArray(tenants)||tenants.length!==1||tenants[0].tenant_id!==ctx.tenantId||
      tenants[0].status!=="ACTIVE")
    throw new PublicApiError(403,"ADAPTER_TENANT_INACTIVE");
  if(ctx.capability==="supergpt.inventory"){
    const rows=await readJson(fetchImpl,binding,url("x1_capability_registry",{
      select:"capability_id,mechanism,available,authorized,fresh,validated,platform_gated",
      tenant_id:"eq."+ctx.tenantId,order:"capability_id.asc",limit:"100"
    }));
    if(!Array.isArray(rows))throw new PublicApiError(503,"ADAPTER_INVALID_REGISTRY");
    const items=rows.map(r=>({id:r.capability_id,mechanism:r.mechanism,
      available:r.available===true,authorized:r.authorized===true,
      fresh:r.fresh===true,validated:r.validated===true,platformGated:r.platform_gated===true}));
    return respond(res,200,{status:"STAGING_PROVIDER_READ",capability:ctx.capability,
      tenant_id:ctx.tenantId,items,truncated:rows.length===100,worker_receipt:null,dispatch:false});
  }
  if(!ctx.subject)throw new PublicApiError(400,"TASK_ID_REQUIRED");
  const rows=await readJson(fetchImpl,binding,url("x1_work_queue",{
    select:"task_id,tenant_id,status,action_class,attempts,updated_at,validation_receipt_id",
    tenant_id:"eq."+ctx.tenantId,task_id:"eq."+ctx.subject,limit:"2"
  }));
  if(!Array.isArray(rows)||rows.length>1)throw new PublicApiError(503,"ADAPTER_QUEUE_INVALID");
  const item=rows[0];
  return respond(res,200,{status:"STAGING_PROVIDER_READ",capability:ctx.capability,
    tenant_id:ctx.tenantId,task_id:ctx.subject,
    job:item?{status:item.status,action_class:item.action_class,attempts:item.attempts,
      updated_at:item.updated_at,validation_receipt_id:item.validation_receipt_id}:null,
    worker_receipt:null,dispatch:false});
 }catch(e){
  if(e instanceof PublicApiError)return respond(res,e.status,{code:e.code,status:"BLOCKED"});
  return respond(res,503,{status:"BLOCKED",code:"ADAPTER_INTERNAL_FAILURE"});
 }
}
