// Existing Cloud Browser engine adapter. No browser duplication or new worker.
// Only read-only health is exposed to authenticated X1 staging admins.
import {PublicApiError} from './x1-staging.mjs';
const SAFE_HOST=/^(?:[a-z0-9-]+\.)+(?:up\.railway\.app|run\.app|vercel\.app|strategicmindsai\.com|xtremecloudbrowser\.com)$/i;
export function resolveBrowserEngine(env=process.env){
  let url;
  try{url=new URL(env.BROWSER_ENGINE_URL||'');}
  catch{return {ok:false,reason:'BROWSER_ENGINE_URL_UNBOUND'};}
  if(url.protocol!=='https:'||url.port||url.username||url.password||url.search||url.hash||
     url.pathname!=='/'||!SAFE_HOST.test(url.hostname)){
    return {ok:false,reason:'BROWSER_ENGINE_ORIGIN_NOT_APPROVED'};
  }
  const key=env.ENGINE_API_KEY||env.BROWSER_ENGINE_API_KEY;
  if(typeof key!=='string'||key.length<16)return {ok:false,reason:'BROWSER_ENGINE_KEY_UNBOUND'};
  return {ok:true,origin:url.origin};
}
export async function readBrowserEngineHealth({env=process.env,fetchImpl=fetch}={}){
  const cfg=resolveBrowserEngine(env);
  if(!cfg.ok)throw new PublicApiError(503,cfg.reason);
  let response;
  try{
    response=await fetchImpl(cfg.origin+'/health',{
      method:'GET',
      headers:{'x-api-key':env.ENGINE_API_KEY||env.BROWSER_ENGINE_API_KEY,accept:'application/json'},
      redirect:'error',signal:AbortSignal.timeout(6000)
    });
  }catch{throw new PublicApiError(503,'BROWSER_ENGINE_UNAVAILABLE');}
  if(!response.ok)throw new PublicApiError(503,'BROWSER_ENGINE_REJECTED');
  let result;
  try{result=await response.json();}
  catch{throw new PublicApiError(503,'BROWSER_ENGINE_INVALID_HEALTH');}
  // Never pass arbitrary engine metadata or credentials to the browser.
  if(result?.ok!==true&&result?.status!=='ok'&&result?.status!=='healthy'&&
     result?.status!=='operational'){
    throw new PublicApiError(503,'BROWSER_ENGINE_UNVERIFIED');
  }
  return {status:'BROWSER_ENGINE_HEALTH_VERIFIED',read_only:true,
    engine_version:typeof result.engine_version==='string'?result.engine_version.slice(0,36):null,
    checked_at:new Date().toISOString()};
}
