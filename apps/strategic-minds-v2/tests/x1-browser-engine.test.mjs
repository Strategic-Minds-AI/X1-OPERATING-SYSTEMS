import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveBrowserEngine,readBrowserEngineHealth} from '../server/x1-browser-engine.mjs';
import {runBrowserHealth} from '../api/x1/browser-health.js';
const env={BROWSER_ENGINE_URL:'https://smai-browser.up.railway.app',ENGINE_API_KEY:'synthetic-test-key-2026'};
function mockRes(){
 return {headers:{},statusCode:0,setHeader(k,v){this.headers[k]=v;},
 end(data){this.body=JSON.parse(data);}};
}
test('Cloud Browser rejects localhost, arbitrary targets and missing credentials',()=>{
 for(const url of ['http://localhost:3000','https://127.0.0.1','https://evil.net',
   'https://user:pass@smai-browser.up.railway.app','https://smai-browser.up.railway.app/foo']){
   assert.equal(resolveBrowserEngine({...env,BROWSER_ENGINE_URL:url}).ok,false,url);
 }
 assert.equal(resolveBrowserEngine({...env,ENGINE_API_KEY:''}).ok,false);
});
test('Cloud Browser health uses existing server-only credential and proves sandbox readiness',async()=>{
 const requested=[];
 const fetchImpl=async(url,opts)=>{
   requested.push(url);
   assert.equal(opts.headers['x-api-key'],'synthetic-test-key-2026');
   assert.equal(opts.method,'GET');assert.equal(opts.redirect,'error');
   if(url==='https://smai-browser.up.railway.app/health'){
     return {ok:true,json:async()=>({ok:true,engine_version:'3.1.0',secret:'NO_RETURN'})};
   }
   assert.equal(url,'https://smai-browser.up.railway.app/readiness');
   return {ok:true,json:async()=>({ok:true,browser_launch:'verified',security:{sandbox:'required',non_root:true,uid:1000},secret:'NO_RETURN'})};
 };
 const r=await readBrowserEngineHealth({env,fetchImpl});
 assert.deepEqual(requested,[
  'https://smai-browser.up.railway.app/health',
  'https://smai-browser.up.railway.app/readiness'
 ]);
 assert.equal(r.status,'BROWSER_ENGINE_HEALTH_VERIFIED');
 assert.equal(r.sandbox_verified,true);
 assert.equal(r.read_only,true);
 assert.equal(r.engine_version,'3.1.0');
 assert.equal(JSON.stringify(r).includes('NO_RETURN'),false);
});
test('Cloud Browser does not claim health on upstream failures',async()=>{
 await assert.rejects(()=>readBrowserEngineHealth({env,fetchImpl:async()=>({ok:false,status:403})}),e=>e.code==='BROWSER_ENGINE_REJECTED');
 await assert.rejects(()=>readBrowserEngineHealth({env,fetchImpl:async()=>({ok:true,json:async()=>({status:'blocked'})})}),e=>e.code==='BROWSER_ENGINE_UNVERIFIED');
});
test('Cloud Browser rejects historical engines and forged sandbox attestations',async()=>{
 const cases=[
  {ok:true,browser_launch:'verified'},
  {ok:true,browser_launch:'verified',security:{sandbox:'disabled',non_root:true,uid:1000}},
  {ok:true,browser_launch:'verified',security:{sandbox:'required',non_root:false,uid:1000}},
  {ok:true,browser_launch:'verified',security:{sandbox:'required',non_root:true,uid:0}},
  {ok:true,browser_launch:'verified',security:{sandbox:'required',non_root:true,uid:'1000'}},
  {ok:false,browser_launch:'verified',security:{sandbox:'required',non_root:true,uid:1000}}
 ];
 for(const bad of cases){
   const mock=async url=>({ok:true,json:async()=>url.endsWith('/health')?{ok:true}:bad});
   await assert.rejects(()=>readBrowserEngineHealth({env,fetchImpl:mock}),e=>e.code==='BROWSER_SANDBOX_UNVERIFIED');
 }
 await assert.rejects(()=>readBrowserEngineHealth({env,fetchImpl:async url=>url.endsWith('/health')
   ?{ok:true,json:async()=>({ok:true})}:{ok:false,status:503}}),e=>e.code==='BROWSER_SANDBOX_UNAVAILABLE');
 await assert.rejects(()=>readBrowserEngineHealth({env,fetchImpl:async url=>url.endsWith('/health')
   ?{ok:true,json:async()=>({ok:true})}: {ok:true,json:async()=>{throw Error('invalid json');}}}),e=>e.code==='BROWSER_SANDBOX_UNVERIFIED');
});

test('Admin browser route requires auth and blocks mutation',async()=>{
 let res=mockRes();
 await runBrowserHealth({method:'POST',headers:{}},res,{env,fetchImpl:async()=>{throw Error('must not call');}});
 assert.equal(res.statusCode,405);
 res=mockRes();
 await runBrowserHealth({method:'GET',headers:{}},res,{env,fetchImpl:async()=>{throw Error('must not call');}});
 assert.equal(res.statusCode,401);
});
