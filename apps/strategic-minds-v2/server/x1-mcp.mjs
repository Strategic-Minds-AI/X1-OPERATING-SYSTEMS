import { PublicApiError, readStagingOperatorStatus, resolveStagingBinding, respond } from "./x1-staging.mjs";
import { runWorkItems } from "./x1-work-items.mjs";
import { runPromptAssets } from "./x1-prompt-assets.mjs";

const PROTOCOL_VERSION="2025-03-26";
const READ_ROLES=new Set(["OWNER","ADMIN","BUILDER","VALIDATOR"]);
const WRITE_ROLES=new Set(["OWNER","ADMIN","BUILDER"]);
const TOOLS=[
 {name:"x1_get_queue_status",description:"Read bounded queue counts and authenticated X1 tenant status. Does not execute or dispatch work.",inputSchema:{type:"object",properties:{},additionalProperties:false}},
 {name:"x1_list_work_items",description:"List up to 100 coding tasks for the authenticated X1 tenant from the staging queue.",inputSchema:{type:"object",properties:{},additionalProperties:false}},
 {name:"x1_enqueue_coding_task",description:"Queue a non-production coding task through the canonical X1 enqueue RPC. The task is not executed by this tool; an independently verified worker must claim it.",inputSchema:{type:"object",properties:{title:{type:"string",minLength:3,maxLength:120},description:{type:"string",minLength:10,maxLength:4000},category:{type:"string",enum:["engineering","frontend","backend","security","integrations","seo-analytics","data-intelligence"]},acceptanceCriteria:{type:"array",items:{type:"string",maxLength:240},maxItems:8}},required:["title","description"],additionalProperties:false}},
 {name:"x1_list_prompts",description:"List the authenticated X1 tenant's saved prompt assets from staging.",inputSchema:{type:"object",properties:{},additionalProperties:false}},
 {name:"x1_save_prompt",description:"Create or version a tenant-scoped X1 prompt asset. This stores a draft only; it does not execute the prompt or certify it as safe.",inputSchema:{type:"object",properties:{assetId:{type:"string",format:"uuid"},title:{type:"string",minLength:3,maxLength:120},promptText:{type:"string",minLength:1,maxLength:16000},category:{type:"string",enum:["general","engineering","frontend","backend","security","data-intelligence","marketing","seo-analytics","agent-workflows"]},metadata:{type:"object"}},required:["title","promptText","category"],additionalProperties:false}}
];
function bodyOf(req){
 if(req.body&&typeof req.body==="object"&&!Array.isArray(req.body))return req.body;
 if(typeof req.body==="string"&&req.body.length<=24000){try{return JSON.parse(req.body);}catch{}}
 throw new PublicApiError(400,"MCP_JSON_BODY_INVALID");
}
function sink(){
 return {statusCode:200,headers:{},body:null,setHeader(k,v){this.headers[k]=v;},end(s){try{this.body=JSON.parse(s);}catch{this.body=null;}}};
}
async function invoke(handler,req,opts){
 const res=sink();await handler(req,res,opts);return {status:res.statusCode,body:res.body};
}
function rpcError(id,code,message,data){
 return {jsonrpc:"2.0",id:id??null,error:{code,message,...(data?{data}:{})}};
}
function rpcResult(id,result){return {jsonrpc:"2.0",id,result};}
function toolResult(value,isError=false){
 return {content:[{type:"text",text:JSON.stringify(value)}],structuredContent:value,isError};
}
function corsHeaders(req,res,env){
 const origin=req.headers?.origin;
 const allowed=String(env.X1_MCP_ALLOWED_ORIGINS||"").split(",").map(x=>x.trim()).filter(Boolean);
 if(origin&&allowed.includes(origin)){res.setHeader("Access-Control-Allow-Origin",origin);res.setHeader("Vary","Origin");}
 res.setHeader("Access-Control-Allow-Headers","Authorization, Content-Type, Accept, Mcp-Protocol-Version, X-X1-Tenant-ID");
 res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");
 res.setHeader("Access-Control-Max-Age","600");
}
export async function runMcp(req,res,{env=process.env,fetchImpl=fetch}={}){
 corsHeaders(req,res,env);
 if(req.method==="OPTIONS"){res.statusCode=204;return res.end("");}
 if(req.method!=="POST"){res.setHeader("Allow","POST, OPTIONS");return respond(res,405,{status:"METHOD_NOT_ALLOWED",reason:"MCP_STREAMABLE_HTTP_POST_REQUIRED"});}
 const declared=Number(req.headers?.["content-length"]??0);
 if(!Number.isFinite(declared)||declared>24000)return respond(res,413,{status:"BODY_TOO_LARGE"});
 let body,id=null;
 try{
  body=bodyOf(req);id=body.id??null;
  if(body.jsonrpc!=="2.0"||typeof body.method!=="string")return respond(res,400,rpcError(id,-32600,"Invalid JSON-RPC request"));
  const binding=resolveStagingBinding(env);
  if(!binding.ok)return respond(res,503,rpcError(id,-32003,"X1 staging MCP is not bound",{reason:binding.code}));
  const operator=await readStagingOperatorStatus(req,binding,fetchImpl);
  if(!READ_ROLES.has(operator.role))throw new PublicApiError(403,"MCP_ROLE_NOT_PERMITTED");
  if(!Object.prototype.hasOwnProperty.call(body,"id")&&body.method.startsWith("notifications/")){res.statusCode=202;return res.end("");}
  let result;
  switch(body.method){
   case "initialize":
    result={protocolVersion:PROTOCOL_VERSION,capabilities:{tools:{listChanged:false}},serverInfo:{name:"x1-operating-system",version:"0.1.0"}};
    break;
   case "ping":
    result={};
    break;
   case "tools/list":
    result={tools:TOOLS};
    break;
   case "resources/list":
    result={resources:[]};
    break;
   case "prompts/list":
    result={prompts:[]};
    break;
   case "tools/call":{
    const params=body.params&&typeof body.params==="object"?body.params:{};
    const args=params.arguments&&typeof params.arguments==="object"&&!Array.isArray(params.arguments)?params.arguments:{};
    let call;
    if(params.name==="x1_get_queue_status"){
     result=toolResult({status:"X1_STAGING_READ_VERIFIED",tenant_id:operator.tenant_id,role:operator.role,queue:operator.sample?.counts??{},dispatch:"NOT_DISPATCHED_BY_MCP",environment:"preview"});
     break;
    }
    if(params.name==="x1_list_work_items"){
     call=await invoke(runWorkItems,{method:"GET",headers:req.headers},{env,fetchImpl});
    }else if(params.name==="x1_enqueue_coding_task"){
     if(!WRITE_ROLES.has(operator.role))throw new PublicApiError(403,"MCP_WRITE_ROLE_REQUIRED");
     call=await invoke(runWorkItems,{method:"POST",headers:req.headers,body:args},{env,fetchImpl});
    }else if(params.name==="x1_list_prompts"){
     if(!WRITE_ROLES.has(operator.role))throw new PublicApiError(403,"MCP_PROMPT_ROLE_REQUIRED");
     call=await invoke(runPromptAssets,{method:"GET",headers:req.headers},{env,fetchImpl});
    }else if(params.name==="x1_save_prompt"){
     if(!WRITE_ROLES.has(operator.role))throw new PublicApiError(403,"MCP_WRITE_ROLE_REQUIRED");
     call=await invoke(runPromptAssets,{method:args.assetId?"PATCH":"POST",headers:req.headers,body:args},{env,fetchImpl});
    }else{
     return respond(res,200,rpcError(id,-32602,"Unknown tool name",{name:String(params.name||"")}));
    }
    result=toolResult(call.body??{status:"BLOCKED",reason:"EMPTY_TOOL_RESPONSE"},call.status>=400);
    break;
   }
   default:
    return respond(res,200,rpcError(id,-32601,"Method not found",{method:body.method}));
  }
  res.setHeader("MCP-Protocol-Version",PROTOCOL_VERSION);
  return respond(res,200,rpcResult(id,result));
 }catch(err){
  if(err instanceof PublicApiError)return respond(res,err.status,rpcError(id,err.status===401?-32001:err.status===403?-32003:-32000,err.code,{status:"BLOCKED"}));
  return respond(res,400,rpcError(id,-32700,"Invalid MCP request"));
 }
}
