import {isVisualXReadRequest,readVisualXOperator} from "../../server/x1-visualx-auth.mjs";
import { resolveStagingBinding, respond } from "../../server/x1-staging.mjs";

export async function runHealth(req, res, env = process.env, {fetchImpl=fetch} = {}) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return respond(res, 405, { status: "METHOD_NOT_ALLOWED" });
  }
  const binding = resolveStagingBinding(env);
  if (!binding.ok) {
    return respond(res, 503, {
      service: "x1-staging-adapter",
      status: "UNBOUND",
      reason: binding.code,
      writes: "DISABLED",
      dispatch: "DISABLED"
    });
  }
  if(isVisualXReadRequest(req)){
    try{
      const op=await readVisualXOperator(req,binding,fetchImpl,{env,route:"health"});
      return respond(res,200,{service:"x1-staging-adapter",status:"STAGING_READ_VERIFIED",
       tenant_id:op.tenant_id,audit_id:op.audit_id,target:"X1_STAGING_ONLY",writes:"DISABLED",dispatch:"DISABLED"});
    }catch(err){
      return respond(res,err?.status??503,{status:"BLOCKED",reason:err?.code??"VISUALX_READ_UNAVAILABLE"});
    }
  }
  // Key presence is NOT proof that Auth or PostgREST works.
  return respond(res, 200, {
    service: "x1-staging-adapter",
    status: "CONFIGURED_NOT_VALIDATED",
    target: "X1_STAGING_ONLY",
    writes: "DISABLED",
    dispatch: "DISABLED"
  });
}

export default function handler(req, res) {
  return runHealth(req, res);
}
