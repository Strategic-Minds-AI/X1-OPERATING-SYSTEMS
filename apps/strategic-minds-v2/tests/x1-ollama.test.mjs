import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveOllama,askOllama} from '../server/x1-ollama.mjs';
const env={X1_LLM_PROVIDER:'ollama',OLLAMA_TUNNEL_URL:'https://smai-example.ngrok-free.app',
  OLLAMA_TUNNEL_TOKEN:'synthetic-test-bearer-only',X1_OLLAMA_MODEL:'llama3.1:8b'};
test('Ollama disabled unless explicitly selected',()=>{
 assert.equal(resolveOllama({...env,X1_LLM_PROVIDER:'ai_gateway'}).ok,false);
});
test('Ollama requires valid HTTPS ngrok origin and nonempty bearer token',()=>{
 for(const x of ['http://127.0.0.1:11434','https://10.0.0.8','https://example.com',
   'https://abc.ngrok-free.app@127.0.0.1','https://smai-example.ngrok-free.app/evil']){
  assert.equal(resolveOllama({...env,OLLAMA_TUNNEL_URL:x}).ok,false,x);
 }
 assert.equal(resolveOllama({...env,OLLAMA_TUNNEL_TOKEN:''}).ok,false);
 assert.equal(resolveOllama({...env,X1_OLLAMA_MODEL:'../hack'}).ok,false);
});
test('Ollama call is authenticated, nonstreaming, and kept server-side',async()=>{
 let called=false;
 const fetchImpl=async(url,opts)=>{
  called=true;
  assert.equal(url,'https://smai-example.ngrok-free.app/api/chat');
  assert.equal(opts.headers.authorization,'Bearer synthetic-test-bearer-only');
  assert.equal(opts.redirect,'error');
  assert.equal(JSON.parse(opts.body).stream,false);
  assert.equal(JSON.parse(opts.body).messages[0].role,'system');
  return {ok:true,json:async()=>({message:{content:'Verified local model answer'}})};
 };
 const result=await askOllama({system:'Safe system context',history:[{role:'user',content:'Hi'}],env,fetchImpl});
 assert.equal(called,true);assert.equal(result.mode,'OLLAMA_PREVIEW_DRAFT');
 assert.equal(result.answer,'Verified local model answer');
});
test('Ollama failure blocks without success fabrication',async()=>{
 await assert.rejects(()=>askOllama({system:'',history:[],env,
  fetchImpl:async()=>({ok:false,status:401})}),e=>e.code==='OLLAMA_UPSTREAM_REJECTED');
 await assert.rejects(()=>askOllama({system:'',history:[],env,
  fetchImpl:async()=>{throw Error('offline')}}),e=>e.code==='OLLAMA_TUNNEL_UNAVAILABLE');
});
