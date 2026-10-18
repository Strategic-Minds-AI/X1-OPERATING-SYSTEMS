import {PublicApiError} from './x1-staging.mjs';

// A remote Ollama connection is permitted only through a token-protected,
// publicly routable HTTPS ngrok tunnel. Never expose Ollama's 11434 port.
const NGROK=/^[a-z0-9][a-z0-9-]*\.(?:ngrok-free\.app|ngrok\.app|ngrok\.io|ngrok-free\.dev)$/i;
const MODEL=/^[a-z0-9][a-z0-9._:-]{0,80}$/i;
export function resolveOllama(env=process.env){
  if(env.X1_LLM_PROVIDER!=='ollama')return {ok:false,reason:'OLLAMA_NOT_SELECTED'};
  let url;
  try{url=new URL(env.OLLAMA_TUNNEL_URL||'');}
  catch{return {ok:false,reason:'OLLAMA_HTTPS_TUNNEL_UNBOUND'};}
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||
    url.pathname!=='/'||url.port||!NGROK.test(url.hostname)){
    return {ok:false,reason:'OLLAMA_TUNNEL_NOT_APPROVED'};
  }
  if(typeof env.OLLAMA_TUNNEL_TOKEN!=='string'||env.OLLAMA_TUNNEL_TOKEN.length<16){
    return {ok:false,reason:'OLLAMA_BEARER_TOKEN_UNBOUND'};
  }
  const model=env.X1_OLLAMA_MODEL||'llama3.1:8b';
  if(!MODEL.test(model))return {ok:false,reason:'OLLAMA_MODEL_INVALID'};
  return {ok:true,origin:url.origin,model};
}
export async function askOllama({system,history,env=process.env,fetchImpl=fetch}){
  const cfg=resolveOllama(env);
  if(!cfg.ok)throw new PublicApiError(503,cfg.reason);
  let response;
  try{
    response=await fetchImpl(cfg.origin+'/api/chat',{
      method:'POST',
      headers:{authorization:'Bearer '+env.OLLAMA_TUNNEL_TOKEN,
        'content-type':'application/json',accept:'application/json'},
      body:JSON.stringify({model:cfg.model,stream:false,messages:[
        {role:'system',content:system},...history],
        options:{temperature:0.2,num_predict:520}}),
      redirect:'error',signal:AbortSignal.timeout(25000)
    });
  }catch{throw new PublicApiError(503,'OLLAMA_TUNNEL_UNAVAILABLE');}
  if(!response.ok)throw new PublicApiError(503,'OLLAMA_UPSTREAM_REJECTED');
  let data;
  try{data=await response.json();}catch{throw new PublicApiError(503,'OLLAMA_INVALID_RESPONSE');}
  const content=data?.message?.content;
  if(typeof content!=='string'||!content.trim())throw new PublicApiError(503,'OLLAMA_EMPTY_RESPONSE');
  return {answer:content.slice(0,8000),mode:'OLLAMA_PREVIEW_DRAFT',model:cfg.model};
}
