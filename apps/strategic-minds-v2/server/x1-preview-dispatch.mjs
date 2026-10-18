// One admin command -> existing X1 Staging x1_enqueue_work. No extra queue.
import {createHash} from "node:crypto";
import {PREMIUM_FLOORING_PREVIEW_HTML} from "./x1-preview-demo-template.mjs";
import {PublicApiError} from "./x1-staging.mjs";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STAGING="https://uvdkzsbjackpjvpoxtyk.supabase.co";
const BASE_SHA="f88c814d4f9e9fec0a04010382f68c69581793b8";
const hash=s=>createHash("sha256").update(s).digest("hex");
const escape=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export function previewPrompt(message){
 if(typeof message!=="string"||message.length>2400)return null;
 const v=message.trim();
 if(/^build preview:\s*\S/i.test(v))return v.replace(/^build preview:\s*/i,"");
 if(/^(?:please\s+)?build\s+(?:me\s+)?(?:a\s+|an\s+)?(?:premium\s+)?(?:website|site|landing page|instant estimate|epoxy website)\b/i.test(v))return v;
 return null;
}
export function previewReady(env={}){
 return env.VERCEL_ENV==="preview"&&env.X1_PREVIEW_DISPATCH_ENABLED==="true"&&
   env.X1_DB_COMPLETION_FENCING_PASS==="true"&&env.X1_PREVIEW_WORKER_READY==="true";
}
export function compilePremiumPreview(message){
 const prompt=previewPrompt(message);
 if(!prompt||!/(epoxy|garage floor|concrete floor|flooring|polished concrete)/i.test(prompt))
  throw new PublicApiError(422,"X1_DETERMINISTIC_COMPILER_REQUIRES_FLOORING_INTENT");
 let html=PREMIUM_FLOORING_PREVIEW_HTML;
 if(!html.includes("NOT A REAL BUSINESS")||!html.includes("noindex,nofollow")||
    !html.includes("id=\"amount\"")||!html.includes("</body></html>"))
  throw new PublicApiError(503,"X1_PREMIUM_TEMPLATE_NOT_VERIFIED");
 const name=prompt.match(/(?:named|called|brand(?:ed)?(?: as)?)\s+["']?([a-z0-9][a-z0-9 .&-]{2,35})["']?(?:,|\.|$)/i);
 if(name)html=html.replaceAll("SURFACE ONE",escape(name[1].trim()));
 html=html.replace("</body></html>",
  "<!-- X1_PROMPT_SHA="+hash(prompt)+"; PREVIEW_ONLY; NOT A REAL BUSINESS --></body></html>");
 if(Buffer.byteLength(html,"utf8")<1300||Buffer.byteLength(html,"utf8")>160000||
   !/name="robots" content="noindex,nofollow"/i.test(html)||
   /fetch\s*\(|XMLHttpRequest|navigator\.sendBeacon|document\.cookie/.test(html))
  throw new PublicApiError(422,"X1_PREVIEW_CODE_POLICY_DENIED");
 return {html,prompt,sha256:hash(html)};
}
export async function dispatchPreviewFromChat({binding,operator,message,sessionId,requestId,env=process.env,fetchImpl=fetch}){
 if(!previewPrompt(message))return null;
 if(!previewReady(env))throw new PublicApiError(503,"X1_PREVIEW_WORKER_NOT_ACTIVATED");
 if(binding?.origin!==STAGING||!binding.serviceKey)
  throw new PublicApiError(503,"X1_STAGING_PREVIEW_BINDING_REQUIRED");
 if(operator?.status!=="STAGING_READ_VERIFIED"||
    !["OWNER","ADMIN"].includes(operator.role)||
    !UUID.test(operator.user_id??"")||!UUID.test(operator.tenant_id??""))
  throw new PublicApiError(403,"X1_VERIFIED_OPERATOR_REQUIRED");
 if(!UUID.test(sessionId)||!UUID.test(requestId))
  throw new PublicApiError(400,"X1_PREVIEW_REQUEST_UUID_INVALID");
 const code=compilePremiumPreview(message);
 const key=hash(["x1-preview-v1",operator.tenant_id,operator.user_id,
  sessionId,requestId,BASE_SHA,code.sha256].join("|"));
 const work={tenant_id:operator.tenant_id,mission_id:"X1-ADMIN-"+requestId,
  work_packet_id:"X1-ADMIN-PREVIEW-"+requestId,
  task_id:"x1.preview.build."+requestId,
  requested_by:"admin:"+operator.user_id,action_class:"NON_PRODUCTION_MUTATION",
  required_capabilities:[{id:"agent:smai:13-digital-dominance",mechanism:"policy"}],
  payload:{kind:"X1_PROMPT_TO_VERCEL_PREVIEW_V1",prompt:code.prompt,
   files:[{path:"index.html",content:code.html}],release_mode:"preview",
   synthetic:true,no_customer_data:true,no_spend:true,customer_outbound:false,
   domain_purchase:false,external_mutation:true},
  source_sha:BASE_SHA,idempotency_key:key,priority:100,max_attempts:1,
  approval_reference:"X1-STAGING-PREVIEW-"+requestId};
 async function call(url,method,body){
  let r;
  try{r=await fetchImpl(url,{method,redirect:"error",signal:AbortSignal.timeout(10000),
   headers:{apikey:binding.serviceKey,authorization:"Bearer "+binding.serviceKey,
    accept:"application/json",...(body?{"content-type":"application/json"}:{})},
   ...(body?{body:JSON.stringify(body)}:{})});}
  catch{throw new PublicApiError(503,"X1_PREVIEW_QUEUE_NETWORK_UNCONFIRMED");}
  if(!r.ok)throw new PublicApiError(503,"X1_PREVIEW_QUEUE_RPC_FAILED");
  try{return await r.json();}catch{throw new PublicApiError(503,"X1_PREVIEW_QUEUE_JSON_INVALID");}
 }
 const workId=await call(STAGING+"/rest/v1/rpc/x1_enqueue_work","POST",{p_work:work});
 if(typeof workId!=="string"||!UUID.test(workId))
  throw new PublicApiError(503,"X1_PREVIEW_WORK_ID_UNVERIFIED");
 const params=new URLSearchParams({select:"work_id,tenant_id,task_id,status,source_sha,idempotency_key",
   work_id:"eq."+workId,tenant_id:"eq."+operator.tenant_id,limit:"1"});
 const rows=await call(STAGING+"/rest/v1/x1_work_queue?"+params,"GET");
 if(!Array.isArray(rows)||rows.length!==1||rows[0]?.work_id!==workId||
  rows[0].tenant_id!==operator.tenant_id||rows[0].task_id!==work.task_id||
  rows[0].source_sha!==BASE_SHA||rows[0].idempotency_key!==key)
  throw new PublicApiError(503,"X1_PREVIEW_QUEUE_READBACK_MISMATCH");
 return Object.freeze({status:"QUEUED_NOT_DEPLOYED",workId,
   queueStatus:rows[0].status,sourceSha:BASE_SHA,htmlSha256:code.sha256});
}
