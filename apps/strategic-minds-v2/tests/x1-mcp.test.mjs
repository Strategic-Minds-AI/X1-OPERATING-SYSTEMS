import test from "node:test";
import assert from "node:assert/strict";
import {runMcp} from "../server/x1-mcp.mjs";
import {STAGING_ORIGIN} from "../server/x1-staging.mjs";

const USER_ID="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const TENANT_ID="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const WORK_ID="dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const ENV={VERCEL_ENV:"preview",SUPABASE_URL:STAGING_ORIGIN,SUPABASE_ANON_KEY:"public-test-key",SUPABASE_SERVICE_ROLE_KEY:"server-test-key"};
function sink(){return {statusCode:200,headers:{},body:null,setHeader(k,v){this.headers[k]=v;},end(s){try{this.body=JSON.parse(s);}catch{this.body=null;}}};}
function reply(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json"}});}
function fakeFetch(calls=[]){
 let inserted=null;
 return async(url,options={})=>{
  const u=new URL(url),method=options.method||"GET",body=options.body?JSON.parse(options.body):null;
  calls.push({url:u.toString(),method,body});
  assert.equal(u.origin,STAGING_ORIGIN);
  if(u.pathname==="/auth/v1/user")return reply({id:USER_ID});
  if(u.pathname==="/rest/v1/x1_tenant_memberships")return reply([{tenant_id:TENANT_ID,role:"OWNER",status:"ACTIVE"}]);
  if(u.pathname==="/rest/v1/x1_tenants")return reply([{tenant_id:TENANT_ID,status:"ACTIVE"}]);
  if(u.pathname==="/rest/v1/x1_work_queue"&&method==="GET"){
   if(u.searchParams.get("select")==="status")return reply([{status:"COMPLETED"},{status:"BLOCKED"}]);
   if(u.searchParams.has("work_id"))return reply(inserted?[inserted]:[]);
   return reply([]);
  }
  if(u.pathname==="/rest/v1/rpc/x1_enqueue_work"&&method==="POST"){
   const w=body.p_work;
   inserted={...w,work_id:WORK_ID,status:"PENDING",attempts:0,last_error_code:null,created_at:"2026-10-18T13:00:00Z",updated_at:"2026-10-18T13:00:00Z"};
   return reply(WORK_ID);
  }
  throw new Error("Unexpected endpoint "+u.pathname+" "+method);
 };
}
test("MCP rejects unauthenticated requests",async()=>{
 const res=sink();
 await runMcp({method:"POST",headers:{},body:{jsonrpc:"2.0",id:1,method:"initialize"}},res,{env:ENV,fetchImpl:fakeFetch()});
 assert.equal(res.statusCode,401);
 assert.equal(res.body.error.code,-32001);
});
test("MCP initialize returns a stateless Streamable HTTP server profile",async()=>{
 const calls=[],res=sink();
 await runMcp({method:"POST",headers:{authorization:"Bearer x1-user-token"},body:{jsonrpc:"2.0",id:1,method:"initialize",params:{protocolVersion:"2025-03-26",capabilities:{},clientInfo:{name:"test",version:"1"}}}},res,{env:ENV,fetchImpl:fakeFetch(calls)});
 assert.equal(res.statusCode,200);
 assert.equal(res.body.result.protocolVersion,"2025-03-26");
 assert.equal(res.body.result.serverInfo.name,"x1-operating-system");
 assert.equal(res.headers["MCP-Protocol-Version"],"2025-03-26");
 assert.ok(calls.every(c=>new URL(c.url).origin===STAGING_ORIGIN));
});
test("MCP advertises only scoped queue and prompt tools, with no production deploy tool",async()=>{
 const res=sink();
 await runMcp({method:"POST",headers:{authorization:"Bearer x1-user-token"},body:{jsonrpc:"2.0",id:2,method:"tools/list"}},res,{env:ENV,fetchImpl:fakeFetch()});
 const names=res.body.result.tools.map(t=>t.name);
 assert.ok(names.includes("x1_get_queue_status"));
 assert.ok(names.includes("x1_enqueue_coding_task"));
 assert.ok(names.includes("x1_save_prompt"));
 assert.equal(names.some(n=>/production|deploy|secret|spend/i.test(n)),false);
});
test("MCP queue status is tenant-scoped and never dispatches",async()=>{
 const calls=[],res=sink();
 await runMcp({method:"POST",headers:{authorization:"Bearer x1-user-token"},body:{jsonrpc:"2.0",id:3,method:"tools/call",params:{name:"x1_get_queue_status",arguments:{}}}},res,{env:ENV,fetchImpl:fakeFetch(calls)});
 const result=res.body.result;
 assert.equal(result.structuredContent.status,"X1_STAGING_READ_VERIFIED");
 assert.equal(result.structuredContent.tenant_id,TENANT_ID);
 assert.equal(result.structuredContent.dispatch,"NOT_DISPATCHED_BY_MCP");
 assert.equal(calls.some(c=>c.method==="POST"),false);
});
test("MCP coding tool uses canonical enqueue RPC and returns draft-saved-not-executed",async()=>{
 const calls=[],res=sink();
 await runMcp({method:"POST",headers:{authorization:"Bearer x1-user-token"},body:{jsonrpc:"2.0",id:4,method:"tools/call",params:{name:"x1_enqueue_coding_task",arguments:{title:"Build native prompt chains",description:"Add a persisted chain editor with explicit inputs, outputs and evaluation gates.",category:"engineering",acceptanceCriteria:["Automated tests pass"]}}}},res,{env:ENV,fetchImpl:fakeFetch(calls)});
 const result=res.body.result;
 assert.equal(result.isError,false);
 assert.equal(result.structuredContent.status,"DRAFT_SAVED_NOT_EXECUTED");
 assert.equal(result.structuredContent.item.status,"PENDING");
 assert.ok(calls.some(c=>c.url.includes("/rest/v1/rpc/x1_enqueue_work")&&c.method==="POST"));
 assert.equal(calls.some(c=>c.url.includes("/rest/v1/x1_work_queue")&&c.method==="POST"),false);
});
test("MCP unknown methods return JSON-RPC method-not-found",async()=>{
 const res=sink();
 await runMcp({method:"POST",headers:{authorization:"Bearer x1-user-token"},body:{jsonrpc:"2.0",id:5,method:"x1/run_everything"}},res,{env:ENV,fetchImpl:fakeFetch()});
 assert.equal(res.statusCode,200);
 assert.equal(res.body.error.code,-32601);
});
