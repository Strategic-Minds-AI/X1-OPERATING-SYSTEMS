import { PublicApiError, readStagingOperatorStatus, resolveStagingBinding, respond } from "./x1-staging.mjs";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CATEGORIES=new Set(["general","engineering","frontend","backend","security","data-intelligence","marketing","seo-analytics","agent-workflows"]);
function urlFor(binding,query){return binding.origin+"/rest/v1/x1_prompt_assets?"+new URLSearchParams(query).toString();}
async function rest(binding,fetchImpl,url,{method="GET",body,prefer}={}){
 let response;
 try{response=await fetchImpl(url,{method,headers:{apikey:binding.serviceKey,authorization:"Bearer "+binding.serviceKey,accept:"application/json",...(body?{"content-type":"application/json"}:{}),...(prefer?{Prefer:prefer}:{})},...(body?{body:JSON.stringify(body)}:{}),redirect:"error",signal:AbortSignal.timeout(7000)});}
 catch{throw new PublicApiError(503,"PROMPT_STORAGE_UNAVAILABLE");}
 if(!response.ok)throw new PublicApiError(response.status===409?409:503,"PROMPT_STORAGE_REJECTED");
 try{const data=await response.json();if(!Array.isArray(data))throw Error("rows");return data;}
 catch{throw new PublicApiError(503,"PROMPT_STORAGE_INVALID");}
}
function bodyOf(req){
 if(req.body&&typeof req.body==="object"&&!Array.isArray(req.body))return req.body;
 if(typeof req.body==="string"&&req.body.length<=20000){try{return JSON.parse(req.body);}catch{}}
 throw new PublicApiError(400,"PROMPT_BODY_INVALID");
}
export function validatePromptInput(body){
 const b=body&&typeof body==="object"&&!Array.isArray(body)?body:{};
 const title=typeof b.title==="string"?b.title.trim():"";
 const promptText=typeof b.promptText==="string"?b.promptText.trim():"";
 const category=typeof b.category==="string"?b.category.trim():"general";
 const metadata=b.metadata&&typeof b.metadata==="object"&&!Array.isArray(b.metadata)?b.metadata:{};
 if(title.length<3||title.length>120)return {ok:false,code:"PROMPT_TITLE_INVALID"};
 if(!promptText||promptText.length>16000)return {ok:false,code:"PROMPT_TEXT_INVALID"};
 if(!CATEGORIES.has(category))return {ok:false,code:"PROMPT_CATEGORY_INVALID"};
 if(JSON.stringify(metadata).length>8000)return {ok:false,code:"PROMPT_METADATA_TOO_LARGE"};
 return {ok:true,value:{title,promptText,category,metadata}};
}
export async function runPromptAssets(req,res,{env=process.env,fetchImpl=fetch}={}){
 if(!["GET","POST","PATCH"].includes(req.method)){res.setHeader("Allow","GET, POST, PATCH");return respond(res,405,{status:"METHOD_NOT_ALLOWED"});}
 try{
  const binding=resolveStagingBinding(env);
  if(!binding.ok)return respond(res,503,{status:"UNBOUND",reason:binding.code});
  if(env.VERCEL_ENV==="production" && req.method!=="GET" && env.X1_PRODUCTION_WRITES_ENABLED!=="true")
   throw new PublicApiError(403,"PRODUCTION_WRITES_DISABLED");
  const operator=await readStagingOperatorStatus(req,binding,fetchImpl);
  if(!["OWNER","ADMIN","BUILDER"].includes(operator.role))throw new PublicApiError(403,"PROMPT_WRITE_ROLE_REQUIRED");
  const table=urlFor(binding,{select:"asset_id,title,prompt_text,category,status,version,metadata,created_at,updated_at"});
  if(req.method==="GET"){
   const rows=await rest(binding,fetchImpl,urlFor(binding,{select:"asset_id,title,prompt_text,category,status,version,metadata,created_at,updated_at",tenant_id:"eq."+operator.tenant_id,order:"updated_at.desc",limit:"100"}));
   return respond(res,200,{status:"PROMPT_LIBRARY_READ_VERIFIED",tenant_id:operator.tenant_id,items:rows});
  }
  const input=validatePromptInput(bodyOf(req));
  if(!input.ok)return respond(res,400,{status:"INVALID_INPUT",reason:input.code});
  if(req.method==="POST"){
   const inserted=await rest(binding,fetchImpl,table,{method:"POST",prefer:"return=representation",body:[{tenant_id:operator.tenant_id,title:input.value.title,prompt_text:input.value.promptText,category:input.value.category,status:"draft",version:1,metadata:input.value.metadata,created_by:operator.user_id}]});
   if(inserted.length!==1)throw new PublicApiError(503,"PROMPT_INSERT_UNVERIFIED");
   return respond(res,201,{status:"PROMPT_SAVED",item:inserted[0]});
  }
  const assetId=bodyOf(req).assetId;
  if(typeof assetId!=="string"||!UUID.test(assetId))throw new PublicApiError(400,"PROMPT_ASSET_ID_INVALID");
  const existing=await rest(binding,fetchImpl,urlFor(binding,{select:"asset_id,version",asset_id:"eq."+assetId,tenant_id:"eq."+operator.tenant_id,limit:"1"}));
  if(existing.length!==1)throw new PublicApiError(404,"PROMPT_ASSET_NOT_FOUND");
  const updated=await rest(binding,fetchImpl,urlFor(binding,{asset_id:"eq."+assetId,tenant_id:"eq."+operator.tenant_id}),{method:"PATCH",prefer:"return=representation",body:{title:input.value.title,prompt_text:input.value.promptText,category:input.value.category,metadata:input.value.metadata,status:"draft",version:Number(existing[0].version)+1,updated_at:new Date().toISOString()}});
  if(updated.length!==1)throw new PublicApiError(503,"PROMPT_UPDATE_UNVERIFIED");
  return respond(res,200,{status:"PROMPT_VERSION_SAVED",item:updated[0]});
 }catch(err){
  if(err instanceof PublicApiError)return respond(res,err.status,{status:"BLOCKED",reason:err.code});
  return respond(res,503,{status:"BLOCKED",reason:"PROMPT_LIBRARY_UNAVAILABLE"});
 }
}
