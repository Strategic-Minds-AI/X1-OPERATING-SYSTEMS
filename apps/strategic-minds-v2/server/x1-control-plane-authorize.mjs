// X1 existing-worker bootstrap authorizer; staging only. No queue/scheduler provisioning.
import { createHash, createHmac, randomUUID } from "node:crypto";
import { PublicApiError, readBearer, resolveStagingBinding, respond } from "./x1-staging.mjs";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TOKEN_LIMIT=8192;
const ACTION="READ_ONLY";
const POLICY_VERSION="x1-preview-read-only-v1";
const MECHANISMS=new Set(["skill","tool","connector","model","modality","plugin","mcp","api","policy"]);
function canonical(value) {
  if(Array.isArray(value)) return "["+value.map(canonical).join(",")+"]";
  if(value!==null&&typeof value==="object")
    return "{"+Object.entries(value).sort(([a],[b])=>a.localeCompare(b))
      .map(([k,v])=>JSON.stringify(k)+":"+canonical(v)).join(",")+"}";
  return JSON.stringify(value);
}
export function validateAuthorizationRequest(raw) {
  if(!raw||typeof raw!=="object"||Array.isArray(raw)||JSON.stringify(raw).length>8192)
    throw new PublicApiError(400,"AUTH_REQUEST_INVALID");
  const {taskId,agentId,tenantId,requestedAction,requiredCapabilities}=raw;
  if(typeof taskId!=="string"||taskId.length<3||taskId.length>128||
    !/^[a-zA-Z0-9._:-]+$/.test(taskId)||
    typeof agentId!=="string"||agentId.length<3||agentId.length>128||
    !/^[a-zA-Z0-9._:-]+$/.test(agentId)||
    typeof tenantId!=="string"||!UUID.test(tenantId)||
    requestedAction!==ACTION||!Array.isArray(requiredCapabilities)||
    requiredCapabilities.length<1||requiredCapabilities.length>12)
    throw new PublicApiError(400,"AUTH_REQUEST_SCOPE_INVALID");
  const normalized=requiredCapabilities.map(v=>{
    if(!v||typeof v!=="object"||typeof v.id!=="string"||
      !/^[a-zA-Z0-9._:-]{3,128}$/.test(v.id)||!MECHANISMS.has(v.mechanism))
      throw new PublicApiError(400,"AUTH_CAPABILITY_INVALID");
    return {id:v.id,mechanism:v.mechanism};
  });
  if(new Set(normalized.map(v=>v.id)).size!==normalized.length)
    throw new PublicApiError(400,"AUTH_CAPABILITY_DUPLICATE");
  return {taskId,agentId,tenantId:tenantId.toLowerCase(),requestedAction,requiredCapabilities:normalized};
}
export function workerIsLeaseReady(worker,expectedId) {
  return worker?.worker_id===expectedId &&
    worker.enabled===true && worker.lease_allowed===true && worker.lease_hold!==true &&
    worker.credential_binding_state==="BOUND" &&
    (worker.runtime_state==="ONLINE"||worker.runtime_state==="READY") &&
    worker.heartbeat_age_seconds!==null && worker.heartbeat_age_seconds!==undefined &&
    Number.isFinite(Number(worker.heartbeat_age_seconds)) &&
    Number(worker.heartbeat_age_seconds)>=0 && Number(worker.heartbeat_age_seconds)<=300 &&
    Array.isArray(worker.allowed_action_classes)&&worker.allowed_action_classes.includes(ACTION);
}
export function capabilitiesMatch(requested,stored,registry) {
  if(!Array.isArray(stored)||!Array.isArray(registry)||requested.length!==stored.length)
    return false;
  const sort=x=>JSON.stringify(x.map(c=>c.id+":"+c.mechanism).sort());
  if(sort(requested)!==sort(stored))return false;
  return requested.every(cap=>registry.some(row=>row.capability_id===cap.id&&
    row.mechanism===cap.mechanism&&row.available===true&&row.authorized===true&&
    row.fresh===true&&row.validated===true&&row.platform_gated!==true&&
    row.impossible_by_skill!==true));
}
async function databaseRequest(fetchImpl,binding,path,{method="GET",body}={}) {
  let response;
  try{
    response=await fetchImpl(binding.origin+path,{
      method,redirect:"error",signal:AbortSignal.timeout(7000),
      headers:{apikey:binding.serviceKey,authorization:"Bearer "+binding.serviceKey,
        accept:"application/json",...(body?{"content-type":"application/json"}:{})},
      ...(body?{body:JSON.stringify(body)}:{})
    });
  }catch{throw new PublicApiError(503,"AUTHORIZE_UPSTREAM_UNAVAILABLE");}
  if(!response.ok)throw new PublicApiError(503,"AUTHORIZE_UPSTREAM_REJECTED");
  if(response.status===204)return null;
  try {return await response.json();} catch{throw new PublicApiError(503,"AUTHORIZE_UPSTREAM_INVALID");}
}
function query(table,params){
  return "/rest/v1/"+table+"?"+new URLSearchParams(params).toString();
}
function signAuthorization(fields,key) {
  return {...fields,signature:{algorithm:"HMAC-SHA256",
    value:createHmac("sha256",key).update(canonical(fields)).digest("hex")}};
}
/** Real stage-only /api/authorize for the pre-existing X1 swarm worker contract.
 * Nothing is authorized from caller-supplied tenant/agent alone: verified credential binding,
 * tenant-scoped leased work, matching holder, capabilities and fresh registry are mandatory.
 */
export async function runControlPlaneAuthorize(req,res,{env=process.env,fetchImpl=fetch,now=()=>new Date()}={}) {
  if(req.method!=="POST"){res.setHeader("Allow","POST");return respond(res,405,{code:"METHOD_NOT_ALLOWED"});}
  try{
    const binding=resolveStagingBinding(env);
    if(!binding.ok)throw new PublicApiError(503,binding.code);
    const serviceName=env.X1_CONTROL_PLANE_SERVICE_NAME;
    const signingKey=env.CAPABILITY_BOOTSTRAP_SIGNING_KEY;
    if(!serviceName||!/^[a-z0-9._:-]{3,100}$/i.test(serviceName)||!signingKey||signingKey.length<32)
      throw new PublicApiError(503,"AUTHORIZE_CONFIG_INCOMPLETE");
    const reqToken=readBearer(req.headers);
    if(reqToken.length>TOKEN_LIMIT)throw new PublicApiError(401,"AUTHENTICATION_REQUIRED");
    const input=validateAuthorizationRequest(req.body);
    const hash=createHash("sha256").update(reqToken).digest("hex");
    const workerId=await databaseRequest(fetchImpl,binding,"/rest/v1/rpc/x1_match_worker_auth",{
      method:"POST",body:{p_service_name:serviceName,p_token_sha256:hash}
    });
    if(workerId!==input.agentId)throw new PublicApiError(403,"WORKER_IDENTITY_DENIED");
    const summary=await databaseRequest(fetchImpl,binding,"/rest/v1/rpc/x1_worker_status_summary",{
      method:"POST",body:{p_tenant_id:input.tenantId}
    });
    if(summary?.tenant_id!==input.tenantId||!Array.isArray(summary.workers)||
       !summary.workers.some(w=>workerIsLeaseReady(w,workerId)&&
       Array.isArray(w.allowed_capabilities)&&input.requiredCapabilities.every(c=>w.allowed_capabilities.includes(c.id))))
      throw new PublicApiError(403,"WORKER_LEASE_PERMISSION_DENIED");
    const works=await databaseRequest(fetchImpl,binding,query("x1_work_queue",{
      select:"task_id,tenant_id,status,action_class,lease_id,required_capabilities",
      tenant_id:"eq."+input.tenantId,task_id:"eq."+input.taskId,limit:"2"
    }));
    if(!Array.isArray(works)||works.length!==1||works[0].status!=="LEASED"||
       works[0].tenant_id!==input.tenantId||works[0].action_class!==ACTION||
       typeof works[0].lease_id!=="string")
      throw new PublicApiError(403,"LEASED_TASK_NOT_FOUND");
    const leases=await databaseRequest(fetchImpl,binding,query("x1_task_leases",{
      select:"lease_id,task_id,tenant_id,holder_agent_id,expires_at,status",
      lease_id:"eq."+works[0].lease_id,tenant_id:"eq."+input.tenantId,limit:"2"
    }));
    const lease=Array.isArray(leases)&&leases.length===1?leases[0]:null;
    if(!lease||lease.task_id!==input.taskId||lease.tenant_id!==input.tenantId||
      lease.holder_agent_id!==workerId||
      !["ACTIVE","ACQUIRED","LEASED"].includes(lease.status)||
      !Number.isFinite(Date.parse(lease.expires_at))||
      Date.parse(lease.expires_at)<=now().getTime())
      throw new PublicApiError(403,"TASK_LEASE_INVALID");
    const registries=await databaseRequest(fetchImpl,binding,query("x1_capability_registry",{
      select:"capability_id,mechanism,available,authorized,fresh,validated,platform_gated,impossible_by_skill,source",
      tenant_id:"eq."+input.tenantId,
      capability_id:"in.("+input.requiredCapabilities.map(c=>'"'+c.id.replace(/"/g,"")+'"').join(",")+")",
      limit:"20"
    }));
    if(!capabilitiesMatch(input.requiredCapabilities,works[0].required_capabilities,registries))
      throw new PublicApiError(403,"CAPABILITY_BOOTSTRAP_BLOCKED");
    const issued=now();
    const expiry=new Date(Math.min(Date.parse(lease.expires_at),issued.getTime()+60000));
    if(expiry.getTime()<=issued.getTime())throw new PublicApiError(403,"AUTHORIZATION_EXPIRED");
    const id=randomUUID(),receiptId="x1-bootstrap:"+id;
    const required=input.requiredCapabilities.map(c=>c.id);
    const fields={
      authorization_id:id,task_id:input.taskId,agent_id:workerId,tenant_id:input.tenantId,
      requested_action:ACTION,capabilities_required:required,capabilities_resolved:required,
      capability_sources:Object.fromEntries(registries.map(r=>[r.capability_id,String(r.source||"registry")])),
      policy_version:POLICY_VERSION,registry_version:"staging-registry",issued_at:issued.toISOString(),
      expires_at:expiry.toISOString(),allowed:true,blockers:[],receipt_id:receiptId
    };
    const authorization=signAuthorization(fields,signingKey);
    const receipt={
      receipt_id:receiptId,authorization_id:id,task_id:input.taskId,
      tenant_id:input.tenantId,agent_id:workerId,allowed:true,blocker_count:0,
      content_hash:createHash("sha256").update(canonical(authorization)).digest("hex"),
      created_at:issued.toISOString()
    };
    await databaseRequest(fetchImpl,binding,"/rest/v1/rpc/x1_record_bootstrap_authorization",{
      method:"POST",body:{p_authorization:authorization,p_receipt:receipt}
    });
    const readback=await databaseRequest(fetchImpl,binding,query("x1_bootstrap_receipts",{
      select:"receipt_id,content_hash,tenant_id",receipt_id:"eq."+receiptId,tenant_id:"eq."+input.tenantId,limit:"2"
    }));
    if(!Array.isArray(readback)||readback.length!==1||
      readback[0].content_hash!==receipt.content_hash||
      readback[0].receipt_id!==receiptId||
      readback[0].tenant_id!==input.tenantId)
      throw new PublicApiError(503,"AUTHORIZATION_RECEIPT_READBACK_FAILED");
    return respond(res,200,{authorization});
  }catch(err){
    if(err instanceof PublicApiError)return respond(res,err.status,{code:err.code});
    return respond(res,503,{code:"AUTHORIZE_INTERNAL_FAILURE"});
  }
}
