import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@6.1.0";
const base="https://uvdkzsbjackpjvpoxtyk.supabase.co";
const issuer=base+"/auth/v1";
const resource=base+"/functions/v1/x1-skybridge-oauth-gateway";
const jwks=createRemoteJWKSet(new URL(issuer+"/.well-known/jwks.json"));
const headers={"content-type":"application/json; charset=utf-8","cache-control":"no-store"};
const j=(body:unknown,status=200,h:Record<string,string>={})=>new Response(JSON.stringify(body),{status,headers:{...headers,...h}});
const err=(id:unknown,code:number,message:string)=>({jsonrpc:"2.0",id,error:{code,message}});
const validUUID=(x:unknown):x is string=>typeof x==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x);
const unauthorized=()=>j({error:"UNAUTHORIZED"},401,{"www-authenticate":'Bearer resource_metadata="'+resource+'/.well-known/oauth-protected-resource"'});
async function auth(token:string){
 const {payload}=await jwtVerify(token,jwks,{issuer,audience:"authenticated",algorithms:["ES256","RS256"],clockTolerance:30});
 if(!validUUID(payload.sub)||payload.role!=="authenticated"||typeof payload.exp!=="number")throw Error("AUTH_INVALID");
 return payload.sub;
}
async function scopedFetch(path:string,token:string){
 const key=Deno.env.get("SUPABASE_ANON_KEY")||Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
 if(!key)throw Error("PUBLISHABLE_KEY_UNAVAILABLE");
 const response=await fetch(base+"/rest/v1/"+path,{headers:{apikey:key,authorization:"Bearer "+token,accept:"application/json"},signal:AbortSignal.timeout(4000)});
 if(!response.ok)throw Error("BACKEND_DENIED");
 return response.json();
}
const tools=[
 {name:"x1_plan",description:"Generate non-executing goal plan with evidence gates",inputSchema:{type:"object",properties:{goal:{type:"string",minLength:3,maxLength:500}},required:["goal"],additionalProperties:false}},
 {name:"x1_my_jobs",description:"Read tenant-authorized recent work using Supabase user RLS; never dispatch",inputSchema:{type:"object",properties:{tenant_id:{type:"string",format:"uuid"}},required:["tenant_id"],additionalProperties:false}}
];
Deno.serve(async req=>{
 const path=new URL(req.url).pathname;
 if(req.method==="GET"&&path.endsWith("/.well-known/oauth-protected-resource"))return j({resource,authorization_servers:[issuer],bearer_methods_supported:["header"]});
 if(req.method==="GET"&&path.endsWith("/x1-skybridge-oauth-gateway"))return j({service:"X1 OAuth-ready MCP gateway",mode:"STAGING_READ_ONLY",health:"UP",oauthLogin:"PENDING_AUTH_SERVER",release:false});
 if(!path.endsWith("/mcp")&&!path.endsWith("/x1-skybridge-oauth-gateway"))return j({error:"NOT_FOUND"},404);
 if(req.method!=="POST")return j({error:"METHOD_NOT_ALLOWED"},405);
 if(Number(req.headers.get("content-length")||0)>16384)return j({error:"TOO_LARGE"},413);
 const match=/^Bearer ([A-Za-z0-9._~+/-]+=*)$/.exec(req.headers.get("authorization")||"");
 if(!match)return unauthorized();
 let subject:string;try{subject=await auth(match[1]);}catch{return unauthorized();}
 let rpc:Record<string,unknown>;
 try{const raw=await req.text();if(raw.length>16384)return j({error:"TOO_LARGE"},413);
  const parsed=JSON.parse(raw);if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw Error("INVALID");
  rpc=parsed;}catch{return j({error:"INVALID_JSON"},400);}
 if(rpc.jsonrpc!=="2.0"||typeof rpc.method!=="string")return j(err(rpc.id??null,-32600,"Invalid Request"));
 const id=rpc.id??null;
 if(rpc.method==="notifications/initialized")return new Response(null,{status:202});
 if(rpc.method==="initialize")return j({jsonrpc:"2.0",id,result:{protocolVersion:"2025-06-18",capabilities:{tools:{}},serverInfo:{name:"x1-skybridge-oauth-gateway",version:"0.1.0"}}});
 if(rpc.method==="ping")return j({jsonrpc:"2.0",id,result:{}});
 if(rpc.method==="tools/list")return j({jsonrpc:"2.0",id,result:{tools}});
 if(rpc.method!=="tools/call")return j(err(id,-32601,"Unknown method"));
 const params=rpc.params&&typeof rpc.params==="object"?rpc.params as Record<string,unknown>:{};
 const input=params.arguments&&typeof params.arguments==="object"?params.arguments as Record<string,unknown>:{};
 if(params.name==="x1_plan"){
  const goal=input.goal;
  if(typeof goal!=="string"||goal.trim().length<3||goal.length>500)return j(err(id,-32602,"Invalid goal"));
  const stages=["Discovery","Prompt transformation","Visual designs","Sandbox build","Tests and repair","Independent QA","Approved release","Outcome monitoring"];
  const v={goal:goal.trim(),stages:stages.map((s,i)=>({step:i+1,name:s,status:"NOT_RUN"})),dispatch:"NOT_PERFORMED",release:"NOT_AUTHORIZED"};
  return j({jsonrpc:"2.0",id,result:{structuredContent:v,content:[{type:"text",text:JSON.stringify(v)}]}});
 }
 if(params.name==="x1_my_jobs"){
  const tenant=input.tenant_id;
  if(!validUUID(tenant))return j(err(id,-32602,"Invalid tenant UUID"));
  try{
   const membership=await scopedFetch("x1_tenant_memberships?select=tenant_id,role&user_id=eq."+subject+"&tenant_id=eq."+tenant+"&status=eq.ACTIVE&limit=2",match[1]);
   if(!Array.isArray(membership)||membership.length!==1||!["OWNER","ADMIN","BUILDER","VALIDATOR"].includes(String(membership[0].role)))return j({error:"TENANT_ACCESS_DENIED"},403);
   const rows=await scopedFetch("x1_work_queue?select=work_id,mission_id,status,action_class,created_at&tenant_id=eq."+tenant+"&order=created_at.desc&limit=20",match[1]);
   const v={tenant_id:tenant,items:rows,source:"user JWT plus RLS",readOnly:true,dispatch:"NOT_PERFORMED"};
   return j({jsonrpc:"2.0",id,result:{structuredContent:v,content:[{type:"text",text:JSON.stringify(v)}]}});
  }catch{return j({error:"AUTH_BACKEND_UNAVAILABLE"},503);}
 }
 return j(err(id,-32601,"Unknown tool"));
});
