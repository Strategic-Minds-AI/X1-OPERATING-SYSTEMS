import {readOperatorOrVisualX} from "../../server/x1-visualx-auth.mjs";
import {PublicApiError,readBearer,readStagingOperatorStatus,resolveStagingBinding,respond} from '../../server/x1-staging.mjs';
import {readBrowserEngineHealth} from '../../server/x1-browser-engine.mjs';

export async function runBrowserHealth(req,res,{env=process.env,fetchImpl=fetch}={}){
  if(req.method!=='GET'){
    res.setHeader('Allow','GET');
    return respond(res,405,{status:'METHOD_NOT_ALLOWED'});
  }
  try{
    readBearer(req.headers);
    const binding=resolveStagingBinding(env);
    if(!binding.ok)throw new PublicApiError(503,binding.code);
    const op=await readOperatorOrVisualX(req,binding,fetchImpl,{env,route:"browser-health",readUser:readStagingOperatorStatus});
    if(op.status!=='STAGING_READ_VERIFIED'||!['OWNER','ADMIN'].includes(op.role)){
      throw new PublicApiError(403,'X1_BROWSER_ADMIN_ROLE_REQUIRED');
    }
    const result=await readBrowserEngineHealth({env,fetchImpl});
    return respond(res,200,{...result,tenant_id:op.tenant_id});
  }catch(err){
    if(err instanceof PublicApiError)return respond(res,err.status,{status:'BLOCKED',reason:err.code});
    return respond(res,503,{status:'BLOCKED',reason:'X1_BROWSER_BRIDGE_UNAVAILABLE'});
  }
}
export default function handler(req,res){return runBrowserHealth(req,res);}
