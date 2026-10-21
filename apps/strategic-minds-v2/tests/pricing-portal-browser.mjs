import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import puppeteer from 'puppeteer-core';

// Pricing remains quote-only. Portal now requires real X1 email OTP + tenant
// verification; legacy synthetic approvals, leads, billing and demo logins are gone.
// Mock only GET /api/x1/agent-config to prove the signed-out UI deterministically;
// this E2E test NEVER sends a real OTP or supplies customer credentials.
const port=8183,base=process.env.X1_TEST_URL||'http://127.0.0.1:'+port;
const executablePath=process.env.CHROME_BIN||[
 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
 '/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(existsSync);
if(!executablePath)throw new Error('Chromium unavailable: set CHROME_BIN');
const server=process.env.X1_TEST_URL?null:spawn(process.execPath,
 ['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port),'--strictPort'],
 {cwd:process.cwd(),stdio:['ignore','pipe','pipe']});
let browser,checks=0,fixtureMode='configured';
const check=(condition,label)=>{assert.ok(condition,label);checks++};
async function ready(){
 for(let i=0;i<70;i++){
  try{const response=await fetch(base+'/pricing');if(response.ok)return}catch{}
  await new Promise(done=>setTimeout(done,200));
 }
 throw Error('Preview not ready');
}
async function goto(page,path){
 const response=await page.goto(base+path,{waitUntil:'networkidle0',timeout:30000});
 check([200,304].includes(response.status()),path+' HTTP '+response.status());
 return response;
}
async function clickText(page,selector,fragment){
 const elements=await page.$$(selector);
 for(const element of elements){
  if((await element.evaluate(node=>node.textContent))?.includes(fragment)){
   await element.click();return;
  }
 }
 throw Error('Missing clickable text '+fragment+' in '+selector);
}
async function evaluateLayout(page,label){
 const result=await page.evaluate(()=>({
  overflow:document.documentElement.scrollWidth-window.innerWidth,
  robots:document.querySelector('meta[name="robots"]')?.content||'',
  h1:document.querySelector('h1')?.textContent||''
 }));
 check(result.overflow<=1,label+' no sideways scroll: '+result.overflow);
 check(result.robots.includes('noindex'),label+' noindex');
 check(result.h1.length>5,label+' heading rendered');
}
async function assertRealSignIn(page,label){
 await page.waitForSelector('[data-testid="x1-portal-auth"]',{timeout:12000});
 const result=await page.evaluate(()=>({
  title:document.querySelector('[data-testid="x1-portal-auth"] h2')?.textContent||'',
  email:document.querySelector('[data-testid="x1-portal-otp-form"] input[type="email"]')?.getAttribute('autocomplete'),
  submit:document.querySelector('[data-testid="x1-portal-otp-form"] button[type="submit"]')?.textContent||'',
  body:document.body.innerText||''
 }));
 check(result.title.includes('Secure account sign-in'),label+' actual authentication gate');
 check(result.email==='email',label+' existing-account email OTP input');
 check(result.submit.includes('EMAIL SIGN-IN CODE'),label+' authentication begins with OTP');
 check(!/Sample Inquiry 001|SANDBOX DEMO|EXPLORE INTERACTIVE DEMO|NO LIVE TASKS/i.test(result.body),label+' no synthetic portal records or demo bypass');
 check((await page.$$('.cp-portal-shell')).length===0,label+' no bypass to old demo workspace');
}
mkdirSync(resolve('qa_e2e/screens'),{recursive:true});
try{
 await ready();
 browser=await puppeteer.launch({headless:true,executablePath,args:['--no-sandbox','--disable-setuid-sandbox','--disable-gpu']});
 const page=await browser.newPage(),errors=[],unexpectedCalls=[];
 await page.setRequestInterception(true);
 page.on('pageerror',error=>errors.push(error.message));
 page.on('request',request=>{
  const url=request.url();
  const pathname=new URL(url).pathname;
  if(pathname==='/api/x1/agent-config'){
   const configured=fixtureMode==='configured';
   request.respond({status:configured?200:503,contentType:'application/json',
    body:JSON.stringify(configured?{
     status:'STAGING_CONFIGURED_NOT_AUTHENTICATED',
     authOrigin:'https://auth-fixture.invalid',publicAnonKey:'fixture-public-key'
    }:{status:'UNBOUND',reason:'QA_AUTH_UNAVAILABLE'})}).catch(e=>errors.push(e.message));
   return;
  }
  if(pathname.startsWith('/api/x1/')||pathname.includes('/auth/v1/otp')||pathname.includes('/auth/v1/verify')){
   unexpectedCalls.push(request.method()+' '+url);
  }
  request.continue().catch(e=>errors.push(e.message));
 });
 for(const size of [{key:'desktop',width:1440,height:900},{key:'mobile',width:390,height:844}]){
  await page.setViewport({width:size.width,height:size.height,deviceScaleFactor:1});
  for(const [route,label] of [['/pricing','pricing'],['/portal','portal-gateway'],['/portal/demo','portal-legacy-redirect']]){
   await goto(page,route);
   if(route.startsWith('/portal')){
    await page.waitForFunction(()=>location.pathname==='/portal',{timeout:10000});
    await assertRealSignIn(page,size.key+' '+label);
   }
   await evaluateLayout(page,size.key+' '+label);
   await page.screenshot({path:resolve('qa_e2e/screens','X1_'+size.key+'_'+label+'.png')});
   console.log('VISUAL_PASS '+size.key+' '+route);
  }
 }
 await page.setViewport({width:1440,height:900});
 await goto(page,'/pricing');
 check((await page.$$('.cp-plan')).length===3,'three scoped package options');
 await clickText(page,'.cp-billing-switch button','MANAGED PARTNERSHIP');
 check(await page.$eval('.cp-billing-switch button:nth-child(2)',node=>node.classList.contains('active')),'managed toggle interactive');
 await clickText(page,'.cp-plan:nth-child(3) button','EXPLORE');
 check((await page.$eval('.cp-preview-ticket strong',node=>node.textContent)).includes('Enterprise'),'plan builder reflects selected package');
 await page.click('.cp-options label:nth-of-type(2) input');
 await page.select('#cp-markets','International');
 const href=await page.$eval('.cp-quote-fields a[href^="mailto:"]',node=>node.getAttribute('href'));
 check(href.includes('International')&&href.includes('Enterprise')&&href.includes('AI%20reception'),'quote email contains selected scope');
 await goto(page,'/portal');
 await assertRealSignIn(page,'signed-out');
 check((await page.$$('.cp-sidebar,.cp-approval-card,.cp-leads,.cp-billing-empty')).length===0,
  'no pretend approvals, leads, billing or demo navigation');
 // Back-end unavailability must be visible; it must not silently create demo data.
 fixtureMode='unavailable';
 await goto(page,'/portal');
 await page.waitForSelector('[data-testid="x1-portal-unavailable"]',{timeout:12000});
 check((await page.$eval('[data-testid="x1-portal-unavailable"]',node=>node.textContent))
  .includes('X1 authentication is not available'),'unbound login explicitly unavailable');
 check((await page.$$('[data-testid="x1-portal-otp-form"]')).length===0,
  'unbound X1 does not show a working OTP form');
 await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
 await goto(page,'/pricing');
 const animation=await page.$eval('.cp-hero-visual img',node=>getComputedStyle(node).animationName);
 check(animation==='none','reduced motion disabled');
 check(errors.length===0,'no browser JS errors: '+errors.join(' | '));
 check(unexpectedCalls.length===0,'no unapproved API or OTP requests: '+unexpectedCalls.join(' | '));
 console.log('PORTAL_PRICING_BROWSER_ASSERTIONS='+checks);
}finally{if(browser)await browser.close();if(server)server.kill();}
