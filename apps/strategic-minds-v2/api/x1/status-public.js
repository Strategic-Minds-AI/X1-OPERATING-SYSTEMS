import {resolveStagingBinding,respond} from "../../server/x1-staging.mjs";

// Anonymous, non-tenant-sensitive availability projection. No queue details, tenant
// identifiers, worker IDs, conversations, prompt bodies, or secrets leave this route.
export async function runStatusPublic(req,res,{env=process.env,fetchImpl=fetch}={}){
 if(req.method!=="GET"){res.setHeader("Allow","GET");return respond(res,405,{status:"METHOD_NOT_ALLOWED"});}
 const binding=resolveStagingBinding(env);
 if(!binding.ok)return respond(res,503,{status:"UNBOUND",reason:binding.code,readOnly:true});
 let upstream;
 try{
  upstream=await fetchImpl(binding.origin+"/rest/v1/x1_tenants?select=tenant_id&limit=1",{
   method:"GET",headers:{apikey:binding.serviceKey,authorization:"Bearer "+binding.serviceKey,accept:"application/json"},
   redirect:"error",signal:AbortSignal.timeout(7000)
  });
 }catch{return respond(res,503,{status:"BLOCKED",reason:"X1_UPSTREAM_UNAVAILABLE",readOnly:true});}
 if(!upstream.ok)return respond(res,503,{status:"BLOCKED",reason:"X1_UPSTREAM_REJECTED",readOnly:true});
 let data;try{data=await upstream.json()}catch{return respond(res,503,{status:"BLOCKED",reason:"X1_UPSTREAM_INVALID_RESPONSE",readOnly:true});}
 if(!Array.isArray(data))return respond(res,503,{status:"BLOCKED",reason:"X1_UPSTREAM_INVALID_RESPONSE",readOnly:true});
 return respond(res,200,{status:"LIVE_DATA_VERIFIED",service:"x1-operating-system",source:"X1_EXISTING_SUPABASE",readOnly:true,
  checkedAt:new Date().toISOString()});
}
export default function handler(req,res){return runStatusPublic(req,res);}
