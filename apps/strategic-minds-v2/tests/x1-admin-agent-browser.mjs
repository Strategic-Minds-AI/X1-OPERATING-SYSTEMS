import {spawn} from 'node:child_process';
import {mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';

const PORT=8293,HOST='http://127.0.0.1:'+PORT;
const chrome=process.env.CHROME_BIN||['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
 '/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(existsSync);
if(!chrome)throw Error('MISSING_CHROMIUM');
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview',
 '--host','127.0.0.1','--port',String(PORT),'--strictPort'],{cwd:process.cwd(),stdio:'ignore'});
const QA=resolve('qa_e2e/screens');mkdirSync(QA,{recursive:true});
let browser,assertions=0,errors=[],networkConfig='unbound';
function check(ok,label){assert.ok(ok,label);assertions++;}
async function ready(){for(let i=0;i<80;i++){try{const r=await fetch(HOST+'/v2/a');if(r.ok)return;}catch{}await new Promise(resolve=>setTimeout(resolve,130));}throw Error('VITE_NOT_READY');}
const json=(obj,status=200)=>({status,contentType:'application/json',
 headers:{'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,OPTIONS',
  'access-control-allow-headers':'authorization,apikey,content-type,x-x1-tenant-id'},
 body:JSON.stringify(obj)});
try{
 await ready();
 browser=await puppeteer.launch({headless:true,executablePath:chrome,args:['--no-sandbox','--disable-setuid-sandbox','--disable-gpu']});
 const page=await browser.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 await page.setRequestInterception(true);
 page.on('request',request=>{
  const url=request.url();
  if(request.method()==='OPTIONS'&&(url.includes('supabase.co')||url.includes('/api/x1/'))){
    return request.respond({status:204,headers:{'access-control-allow-origin':'*',
      'access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'authorization,apikey,content-type'}});
  }
  if(url.includes('/api/x1/agent-config')){
   return request.respond(networkConfig==='unbound'
      ?json({status:'UNBOUND',reason:'MISSING_STAGING_BINDING',gpt:'DISABLED',dispatch:'DISABLED'},503)
      :json({status:'STAGING_CONFIGURED_NOT_AUTHENTICATED',authOrigin:'https://uvdkzsbjackpjvpoxtyk.supabase.co',
        publicAnonKey:'public-synthetic',gpt:'UNBOUND',dispatch:'DISABLED'}));
  }
  if(url.includes('/auth/v1/otp'))return request.respond(json({}));
  if(url.includes('/auth/v1/verify'))return request.respond(json({access_token:'synthetic-test-jwt'}));
  if(url.includes('/api/x1/agent-sessions'))return request.respond(json({
    status:'SESSION_SYNC_VERIFIED',
    tenant_id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    sessions:[{session_id:'11111111-1111-4111-8111-111111111111',
      preview:'Review staging receipts',updated_at:'2026-10-11T12:00:00Z'}]
  }));
  if(url.includes('/api/x1/agent-chat')){
   if(request.method()==='GET')return request.respond(json({status:'SYNC_READ_VERIFIED',
    tenant_id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    turns:[],queue:{limit:200,counts:{PENDING:0,LEASED:0,COMPLETED:1,BLOCKED:0,DEAD_LETTER:0}},
    events:[{event_id:'verified-1',event_type:'apex.validation.completed',summary:'Synthetic QA receipt',trust_state:'validated',status:'ACCEPTED'}],
    gpt:'UNBOUND',dispatch:'DISABLED'}));
   if(request.method()==='POST')return request.respond(json({status:'SYNC_WRITTEN',
    mode:'X1_SYNC_ONLY',response:'X1 verified: 1 completed job. No worker dispatch was started.',
    receipt:{user_turn:'synthetic-one',assistant_turn:'synthetic-two'},
    queue:{limit:200,counts:{PENDING:0,LEASED:0,COMPLETED:1,BLOCKED:0,DEAD_LETTER:0}},
    events:[{event_id:'verified-1',event_type:'apex.validation.completed',summary:'Synthetic QA receipt',trust_state:'validated',status:'ACCEPTED'}]}));
  }
  return request.continue();
 });
 for(const size of [{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}]){
  await page.setViewport({width:size.width,height:size.height,deviceScaleFactor:1});
  await page.goto(HOST+'/admin/studio',{waitUntil:'networkidle0',timeout:30000});
  check((await page.$$('a[href="/admin/agent"]')).length>=1,'existing admin links to X1 agent');
  await page.click('a[href="/admin/agent"]');
  await page.waitForSelector('.x1-agent-app');
  await page.waitForFunction(()=>document.body.textContent.includes('Staging bridge not configured'));
  const metrics=await page.evaluate(()=>({
    overflow:document.documentElement.scrollWidth-innerWidth,
    emblem:[...document.querySelectorAll('img')].some(x=>(x.src||'').includes('silver-emblem.png')&&x.complete&&x.naturalWidth>0),
    chatTitle:document.querySelector('.x1-agent-intro h1')?.textContent,
    gptDisabled:document.body.textContent.includes('X1 SYNC-ONLY MODE'),
    noUnverifiedComposer:document.querySelector('.x1-agent-composer')===null
  }));
  check(metrics.overflow<=1,size.name+' overflow '+metrics.overflow);
  check(metrics.emblem,size.name+' approved emblem loaded');
  check(metrics.chatTitle.includes('Command X1'),size.name+' title');
  check(metrics.noUnverifiedComposer,size.name+' chat gated without auth');
  check(metrics.gptDisabled,size.name+' no model claims when unbound');
  await page.screenshot({path:resolve(QA,'X1_agent_'+size.name+'_auth-gated.png')});
 }
 networkConfig='staging';
 await page.setViewport({width:1440,height:900});
 await page.goto(HOST+'/admin/agent',{waitUntil:'networkidle0'});
 await page.waitForSelector('#x1-agent-email');
 await page.type('#x1-agent-email','synthetic-operator@example.invalid');
 await page.click('.x1-agent-auth form button[type="submit"]');
 await page.waitForSelector('#x1-agent-code');
 await page.type('#x1-agent-code','123456');
 await page.click('.x1-agent-auth form button[type="submit"]');
 await page.waitForSelector('.x1-agent-composer');
 await page.waitForFunction(()=>document.body.textContent.includes('Synthetic QA receipt'));
 check((await page.$eval('.x1-agent-meter b',x=>x.textContent))==='0','verified queue counts displayed');
 await page.waitForSelector('.x1-agent-session',{timeout:6500});
 check((await page.$eval('.x1-agent-session',()=>document.querySelectorAll('.x1-agent-session').length))===1,'one recovered chat conversation link');
 check((await page.$eval('.x1-agent-session strong',x=>x.textContent)).includes('Review staging receipts'),'persisted chat snippet shown');
 await page.click('.x1-agent-suggestions button:first-child');
 check((await page.$eval('#x1-agent-prompt',x=>x.value)).includes('X1 queue'),'suggestion fills live prompt');
 await page.click('.x1-agent-composer button[type="submit"]');
 await page.waitForFunction(()=>document.body.textContent.includes('X1 verified: 1 completed job'),{timeout:5000});
 check(true,'authenticated chat requests synchronize and render response');
 await page.screenshot({path:resolve(QA,'X1_agent_desktop_authenticated_mock.png')});
 check(errors.length===0,'No browser page errors: '+errors.join(' | '));
 console.log('X1_ADMIN_AGENT_BROWSER_PASS '+assertions+' assertions, desktop/mobile, mock backend');
}finally{
 if(browser)await browser.close();
 server.kill();
}
