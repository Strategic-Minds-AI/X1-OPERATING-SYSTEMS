import { PublicApiError, readStagingOperatorStatus, resolveStagingBinding, respond } from "./x1-staging.mjs";
const READ_ROLES=new Set(["OWNER","ADMIN","BUILDER","VALIDATOR"]);
const ACTION_CLASSES=new Set(["READ_ONLY","DRAFT","BRANCH_WRITE","PREVIEW_WRITE","PROTECTED"]);
function safeWorker(row){
 const actions=Array.isArray(row.allowed_action_classes)?row.allowed_action_classes.filter(x=>ACTION_CLASSES.has(x)):[];
 const capabilities=Array.isArray(row.allowed_capabilities)?row.allowed_capabilities.filter(x=>typeof x==="string").map(x=>x.slice(0,100)).slice(0,40):[];
 const age=Number.isFinite(Number(row.heartbeat_age_seconds))?Math.max(0,Number(row.heartbeat_age_seconds)):null;
 return {workerId:String(row.worker_id||"").slice(0,100),environment:"preview",executionPlane:String(row.execution_plane||"unknown").slice(0,80),enabled:row.enabled===true,credentialBindingState:String(row.credential_binding_state||"UNKNOWN").slice(0,40),allowedActionClasses:actions,allowedCapabilities:capabilities,leaseHold:row.lease_hold===true,leaseAllowed:row.lease_allowed===true,runtimeState:typeof row.runtime_state==="string"?row.runtime_state.slice(0,40):null,heartbeatAt:typeof row.heartbeat_at==="string"?row.heartbeat_at:null,heartbeatAgeSeconds:age,workerStatus:String(row.worker_status||"UNKNOWN").slice(0,40),branchWriteReady:row.branch_write_ready===true};
}
export async function runWorkerStatus(req,res,{env=process.env,fetchImpl=fetch}={}){
 if(req.method!=="GET"){res.setHeader("Allow","GET");return respond(res,405,{status:"METHOD_NOT_ALLOWED"});}
 try{
  const binding=resolveStagingBinding(env);if(!binding.ok)return respond(res,503,{status:"BLOCKED",reason:binding.code});
  const operator=await readStagingOperatorStatus(req,binding,fetchImpl);if(!READ_ROLES.has(operator.role))throw new PublicApiError(403,"WORKER_STATUS_ROLE_REQUIRED");
  let response;try{response=await fetchImpl(binding.origin+"/rest/v1/rpc/x1_worker_status_summary",{method:"POST",headers:{apikey:binding.serviceKey,authorization:"Bearer "+binding.serviceKey,"content-type":"application/json",accept:"application/json"},body:JSON.stringify({p_tenant_id:operator.tenant_id}),redirect:"error",signal:AbortSignal.timeout(7000)});}catch{throw new PublicApiError(503,"WORKER_STATUS_UNAVAILABLE");}
  if(!response.ok)throw new PublicApiError(503,"WORKER_STATUS_UNAVAILABLE");
  let data;try{data=await response.json();}catch{throw new PublicApiError(503,"WORKER_STATUS_INVALID");}
  if(!data||data.tenant_id!==operator.tenant_id||!Array.isArray(data.workers))throw new PublicApiError(503,"WORKER_STATUS_INVALID");
  const workers=data.workers.map(safeWorker);
  return respond(res,200,{status:"WORKER_STATUS_VERIFIED",tenant_id:operator.tenant_id,role:operator.role,observed_at:data.observed_at,workers,readiness:{branchWriteWorkers:workers.filter(w=>w.branchWriteReady).length,readOnlyWorkers:workers.filter(w=>w.enabled&&w.leaseAllowed&&!w.leaseHold&&w.allowedActionClasses.includes("READ_ONLY")).length,heldWorkers:workers.filter(w=>!w.enabled||!w.leaseAllowed||w.leaseHold).length}});
 }catch(err){if(err instanceof PublicApiError)return respond(res,err.status,{status:"BLOCKED",reason:err.code});return respond(res,503,{status:"BLOCKED",reason:"WORKER_STATUS_UNAVAILABLE"});}
}
