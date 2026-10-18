import test from 'node:test';
import assert from 'node:assert/strict';
import { STAGING_ORIGIN } from '../server/x1-staging.mjs';
import { chatConfig,validateChatInput,postAgentTurn,readAgentConversation,listAgentConversations } from '../server/x1-agent-chat.mjs';
import { runAgentConfig } from '../api/x1/agent-config.js';
import { runAgentChat } from '../api/x1/agent-chat.js';
import { runAgentSessions } from '../api/x1/agent-sessions.js';

const USER='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const TENANT='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const OTHER='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const SESSION='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const REQ='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const ENV={VERCEL_ENV:'preview',SUPABASE_URL:STAGING_ORIGIN+'/',
  SUPABASE_ANON_KEY:'synthetic-public',SUPABASE_SERVICE_ROLE_KEY:'synthetic-server'};
function request(method='GET',body=null,tenant){
 return {method,url:'/api/x1/agent-chat?session_id='+SESSION,
   headers:{authorization:'Bearer synthetic-auth',...(tenant?{'x-x1-tenant-id':tenant}:{})},
   ...(body?{body}:{})};
}
function response(){
 return {statusCode:200,headers:{},json:null,
  setHeader(k,v){this.headers[k]=v;},
  end(data){this.json=JSON.parse(data);}
 };
}
function stub({members=[{tenant_id:TENANT,role:'OWNER',status:'ACTIVE'}],
 invalidJwt=false,failStorage=false}={}){
 const calls=[],turns=[],outputs=[
  {event_id:'evt1',event_type:'apex.validation.completed',summary:'Verified synthetic preview QA',status:'ACCEPTED',trust_state:'validated',created_at:'2026-10-11T10:00:00Z'}];
 let gatewayCalls=0;
 const impl=async(url,settings)=>{
  const u=new URL(url);calls.push({url,method:settings.method,headers:settings.headers,body:settings.body});
  const reply=(json,status=200)=>new Response(JSON.stringify(json),{status,headers:{'content-type':'application/json'}});
  if(u.origin==='https://ai-gateway.vercel.sh'){
   gatewayCalls++;
   assert.equal(settings.headers.authorization,'Bearer synthetic-gpt-token');
   const input=JSON.parse(settings.body);
   assert.match(input.model,/^openai\/gpt-/);
   assert.equal('tools' in input,false);
   assert.ok(input.max_tokens<=520);
   assert.equal(input.messages.filter(x=>x.role==='user').length,1);
   assert.match(input.messages[0].content,/UNTRUSTED DATA/);
   return reply({choices:[{message:{content:'GPT has drafted a preview-only plan. No job was dispatched.'}}]});
  }
  assert.equal(u.origin,STAGING_ORIGIN,'Unexpected outbound origin');
  if(u.pathname==='/auth/v1/user'){
   assert.equal(settings.headers.apikey,ENV.SUPABASE_ANON_KEY);
   return invalidJwt?reply({error:'expired'},401):reply({id:USER});
  }
  assert.equal(settings.headers.apikey,ENV.SUPABASE_SERVICE_ROLE_KEY);
  assert.equal(settings.headers.authorization,'Bearer '+ENV.SUPABASE_SERVICE_ROLE_KEY);
  if(u.pathname==='/rest/v1/x1_tenant_memberships')return reply(members);
  if(u.pathname==='/rest/v1/x1_tenants')return reply([{tenant_id:TENANT,status:'ACTIVE'}]);
  if(u.pathname==='/rest/v1/x1_work_queue')return reply([{status:'COMPLETED'},{status:'PENDING'}]);
  if(u.pathname==='/rest/v1/apex_output_events')return reply(outputs);
  if(u.pathname==='/rest/v1/x1_admin_chat_turns'){
   if(failStorage)return reply({message:'unavailable'},503);
   if(settings.method==='POST'){
    const turn=JSON.parse(settings.body);
    assert.equal(turn.tenant_id,TENANT);
    assert.equal(turn.actor_user_id,USER);
    const duplicate=turns.some(t=>t.request_id===turn.request_id && t.role===turn.role);
    if(duplicate)return reply([]);
    const saved={...turn,turn_id:'ffffffff-ffff-4fff-8fff-ffffffffffff',created_at:'2026-10-11T12:00:00Z'};
    turns.push(saved);return reply([saved],201);
   }
   assert.equal(u.searchParams.get('tenant_id'),'eq.'+TENANT);
   assert.equal(u.searchParams.get('actor_user_id'),'eq.'+USER);
   return reply(turns.filter(t=>t.session_id===SESSION));
  }
  throw new Error('Unexpected URL: '+u.pathname);
 };
 return {impl,calls,turns,outputs,get gatewayCalls(){return gatewayCalls;}};
}
test('configuration is preview/staging-only and exposes no service credential',()=>{
 const good=chatConfig(ENV);
 assert.equal(good.status,'STAGING_CONFIGURED_NOT_AUTHENTICATED');
 assert.equal(good.publicAnonKey,ENV.SUPABASE_ANON_KEY);
 assert.equal(JSON.stringify(good).includes(ENV.SUPABASE_SERVICE_ROLE_KEY),false);
 assert.equal(good.gpt,'UNBOUND');
 for(const bad of [{...ENV,VERCEL_ENV:'production'},{...ENV,SUPABASE_URL:'https://other.supabase.co/'},{...ENV,SUPABASE_SERVICE_ROLE_KEY:''}]){
  assert.equal(chatConfig(bad).status,'UNBOUND');
 }
});
test('config route returns 503 for unbound, 200 for known staging',()=>{
 const denied=response();
 runAgentConfig({method:'GET'},denied,{...ENV,VERCEL_ENV:'production'});
 assert.equal(denied.statusCode,503);
 const allowed=response();runAgentConfig({method:'GET'},allowed,ENV);
 assert.equal(allowed.statusCode,200);
 assert.equal(allowed.json.dispatch,'DISABLED');
});
test('invalid request, role or tenant scope fail closed',async()=>{
 const badRequest=[null,{}, {session_id:'bad',request_id:REQ,message:'hi'},
  {session_id:SESSION,request_id:'bad',message:'hi'},
  {session_id:SESSION,request_id:REQ,message:' '}];
 for(const body of badRequest)assert.throws(()=>validateChatInput(body));
 for(const members of [[],[{tenant_id:TENANT,role:'VIEWER',status:'ACTIVE'}],
  [{tenant_id:TENANT,role:'BUILDER',status:'ACTIVE'}]]){
  const f=stub({members});
  await assert.rejects(()=>postAgentTurn(request('POST',{session_id:SESSION,request_id:REQ,message:'status'}),{env:ENV,fetchImpl:f.impl}),/MEMBERSHIP|ROLE/);
  assert.equal(f.turns.length,0);
 }
 const f=stub();
 await assert.rejects(()=>postAgentTurn(request('POST',{session_id:SESSION,request_id:REQ,message:'status'},OTHER),{env:ENV,fetchImpl:f.impl}),/TENANT_SCOPE_DENIED/);
 assert.equal(f.turns.length,0);
});
test('unsigned browser request and forged JWT do not reach durable sync tables',async()=>{
 const f=stub(),out=response();
 await runAgentChat({method:'POST',headers:{},body:{session_id:SESSION,request_id:REQ,message:'check'}},out,{env:ENV,fetchImpl:f.impl});
 assert.equal(out.statusCode,401);
 assert.equal(f.calls.length,0);
 const forged=stub({invalidJwt:true});
 const res=response();
 await runAgentChat(request('POST',{session_id:SESSION,request_id:REQ,message:'status'}),res,{env:ENV,fetchImpl:forged.impl});
 assert.equal(res.statusCode,401);
 assert.equal(forged.turns.length,0);
});
test('bidirectional tenant transcript and authoritative X1 output sync, no paid GPT',async()=>{
 const f=stub();
 const input={session_id:SESSION,request_id:REQ,message:'Status of X1 staging?'};
 const wrote=await postAgentTurn(request('POST',input),{env:ENV,fetchImpl:f.impl});
 assert.equal(wrote.status,'SYNC_WRITTEN');
 assert.equal(wrote.mode,'X1_SYNC_ONLY');
 assert.equal(wrote.dispatch,'DISABLED');
 assert.match(wrote.response,/PENDING: 1/);
 assert.equal(wrote.queue.counts.COMPLETED,1);
 assert.equal(wrote.events[0].event_type,'apex.validation.completed');
 assert.equal(f.turns.length,2);
 assert.equal(f.gatewayCalls,0);
 const get=await readAgentConversation(request(),{env:ENV,fetchImpl:f.impl});
 assert.equal(get.status,'SYNC_READ_VERIFIED');
 assert.equal(get.tenant_id,TENANT);
 assert.equal(get.turns.length,2);
 assert.equal(get.turns[0].content,input.message);
 assert.equal(get.turns[1].content,wrote.response);
 assert.equal(get.events.length,1);
 assert.equal(get.dispatch,'DISABLED');
 assert.equal(f.calls.filter(c=>c.url.includes('x1_work_queue')&&c.method!=='GET').length,0);
});
test('retry of same request cannot bill GPT twice or duplicate transcript',async()=>{
 const f=stub();
 const env={...ENV,X1_GPT_CHAT_ENABLED:'true',AI_GATEWAY_API_KEY:'synthetic-gpt-token'};
 const req=request('POST',{session_id:SESSION,request_id:REQ,message:'Plan a safe staging website build'});
 const a=await postAgentTurn(req,{env,fetchImpl:f.impl});
 assert.equal(a.mode,'GPT_PREVIEW_DRAFT');
 assert.match(a.response,/No job was dispatched/);
 assert.equal(f.gatewayCalls,1);
 assert.equal(f.turns.length,2);
 await assert.rejects(()=>postAgentTurn(req,{env,fetchImpl:f.impl}),/CHAT_TURN_ALREADY_ACCEPTED_SYNC_FIRST/);
 assert.equal(f.gatewayCalls,1);
 assert.equal(f.turns.length,2);
});
test('provider not enabled never invokes Gateway despite API key',async()=>{
 const f=stub();
 const r=await postAgentTurn(request('POST',{session_id:SESSION,request_id:REQ,message:'Proceed with release'}),{
  env:{...ENV,AI_GATEWAY_API_KEY:'synthetic-gpt-token'},fetchImpl:f.impl
 });
 assert.equal(r.mode,'X1_SYNC_ONLY');
 assert.equal(f.gatewayCalls,0);
 assert.equal(r.dispatch,'DISABLED');
});
test('upstream model error does not fabricate a successful reply',async()=>{
 const f=stub();
 const fail=async(url,settings)=>url.startsWith('https://ai-gateway.vercel.sh')?new Response('{}',{status:503}):f.impl(url,settings);
 const env={...ENV,X1_GPT_CHAT_ENABLED:'true',AI_GATEWAY_API_KEY:'synthetic-gpt-token'};
 await assert.rejects(()=>postAgentTurn(request('POST',{session_id:SESSION,request_id:REQ,message:'status'}),{env,fetchImpl:fail}),/GPT_UPSTREAM_REJECTED/);
 assert.equal(f.turns.length,1);
 assert.equal(f.turns[0].role,'user');
});
test('storage outage returns 503 without leaking tokens or calling GPT',async()=>{
 const f=stub({failStorage:true}),res=response();
 await runAgentChat(request('POST',{session_id:SESSION,request_id:REQ,message:'status'}),res,{
  env:{...ENV,X1_GPT_CHAT_ENABLED:'true',AI_GATEWAY_API_KEY:'synthetic-gpt-token'},
  fetchImpl:f.impl
 });
 assert.equal(res.statusCode,503);
 assert.equal(res.json.reason,'X1_SYNC_STORAGE_UNAVAILABLE');
 assert.equal(f.gatewayCalls,0);
 assert.equal(JSON.stringify(res.json).includes('synthetic'),false);
});

test('session recovery only reads caller tenant and authenticated user, and never dispatches',async()=>{
 const f=stub();
 const req=request('POST',{session_id:SESSION,request_id:REQ,message:'Review the X1 staging rollout plan'});
 await postAgentTurn(req,{env:ENV,fetchImpl:f.impl});
 const data=await listAgentConversations(request(),{env:ENV,fetchImpl:f.impl});
 assert.equal(data.status,'SESSION_SYNC_VERIFIED');
 assert.equal(data.tenant_id,TENANT);
 assert.equal(data.sessions.length,1);
 assert.equal(data.sessions[0].session_id,SESSION);
 assert.match(data.sessions[0].preview,/Review the X1 staging/);
 assert.equal(f.gatewayCalls,0);
 const query=f.calls.filter(x=>x.url.includes('/rest/v1/x1_admin_chat_turns')&&x.method==='GET').at(-1).url;
 const url=new URL(query);
 assert.equal(url.searchParams.get('tenant_id'),'eq.'+TENANT);
 assert.equal(url.searchParams.get('actor_user_id'),'eq.'+USER);
 assert.equal(url.searchParams.has('session_id'),false);
 assert.equal(f.calls.filter(x=>x.url.includes('x1_work_queue')&&x.method!=='GET').length,0);
});
test('conversation-index endpoint is GET-only and denies missing credentials',async()=>{
 const noToken=response();
 await runAgentSessions({method:'GET',headers:{}},noToken,{env:ENV,fetchImpl:stub().impl});
 assert.equal(noToken.statusCode,401);
 const post=response();
 await runAgentSessions(request('POST'),post,{env:ENV,fetchImpl:stub().impl});
 assert.equal(post.statusCode,405);
 const bound=response(),f=stub();
 await runAgentSessions(request(),bound,{env:ENV,fetchImpl:f.impl});
 assert.equal(bound.statusCode,200);
 assert.equal(bound.json.status,'SESSION_SYNC_VERIFIED');
});
test('cross-tenant cannot enumerate any prior operator session',async()=>{
 const f=stub();
 await assert.rejects(()=>listAgentConversations(request('GET',null,OTHER),{env:ENV,fetchImpl:f.impl}),/TENANT_SCOPE_DENIED/);
 assert.equal(f.calls.some(x=>x.url.includes('/rest/v1/x1_admin_chat_turns')),false);
});
