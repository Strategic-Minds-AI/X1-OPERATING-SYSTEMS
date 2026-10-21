import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import puppeteer from 'puppeteer-core';

const port=8183,base=process.env.X1_TEST_URL||'http://127.0.0.1:'+port;
const executablePath=process.env.CHROME_BIN||[
 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
 '/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(existsSync);
if(!executablePath)throw new Error('Chromium unavailable: set CHROME_BIN');
const isRemote=!!process.env.X1_TEST_URL;
const server=isRemote?null:spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:process.cwd(),stdio:['ignore','pipe','pipe']});
let browser;let checks=0;
const check=(x,message)=>{assert.ok(x,message);checks++};
async function ready(){for(let i=0;i<70;i++){try{const res=await fetch(base+'/pricing');if(res.ok)return;}catch{}await new Promise(r=>setTimeout(r,200))}throw Error('Preview not ready');}
async function goto(page,path){const r=await page.goto(base+path,{waitUntil:'networkidle0',timeout:30000});check([200,304].includes(r.status()),path+' HTTP '+r.status());return r}
async function clickText(page,selector,text){
 const els=await page.$$(selector);
 for(const el of els){const t=await el.evaluate(n=>n.textContent);if(t?.includes(text)){await el.click();return}}
 throw Error('Missing clickable text '+text+' selector '+selector)
}
async function evaluateLayout(page,name){
 const result=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-window.innerWidth,robots:document.querySelector('meta[name="robots"]')?.content||'',h1:document.querySelector('h1')?.textContent||'',authLinks:Array.from(document.querySelectorAll('a')).filter(x=>x.href.includes('mailto:')).length}));
 check(result.overflow<=1,name+' no sideways scroll, measured '+result.overflow);
 check(result.robots.includes('noindex'),name+' noindex');
 check(result.h1.length>5,name+' hero heading');
 return result;
}
mkdirSync(resolve('qa_e2e/screens'),{recursive:true});
try{
 await ready();
 browser=await puppeteer.launch({headless:true,executablePath,args:['--no-sandbox','--disable-setuid-sandbox','--disable-gpu']});
 const page=await browser.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',req=>{if(/\/api\//.test(req.url()))errors.push('UNEXPECTED_API_CALL '+req.url())});
 for(const size of [{key:'desktop',width:1440,height:900},{key:'mobile',width:390,height:844}]){
   await page.setViewport({width:size.width,height:size.height,deviceScaleFactor:1});
   for(const [route,label] of [['/pricing','pricing'],['/portal','portal-gateway'],['/portal/demo','portal-demo']]){
     await goto(page,route);await evaluateLayout(page,size.key+' '+label);
     await page.screenshot({path:resolve('qa_e2e/screens','X1_'+size.key+'_'+label+'.png')});
     console.log('VISUAL_PASS '+size.key+' '+route);
   }
 }
 await page.setViewport({width:1440,height:900});
 await goto(page,'/pricing');
 check((await page.$$('.cp-plan')).length===3,'three scoped package options');
 await clickText(page,'.cp-billing-switch button','MANAGED PARTNERSHIP');
 check(await page.$eval('.cp-billing-switch button:nth-child(2)',n=>n.classList.contains('active')),'managed toggle interactive');
 await clickText(page,'.cp-plan:nth-child(3) button','EXPLORE');
 check((await page.$eval('.cp-preview-ticket strong',n=>n.textContent)).includes('Enterprise'),'plan builder reflects selected package');
 await page.click('.cp-options label:nth-of-type(2) input');
 await page.select('#cp-markets','International');
 const href=await page.$eval('.cp-quote-fields a[href^="mailto:"]',n=>n.getAttribute('href'));
 check(href.includes('International')&&href.includes('Enterprise')&&href.includes('AI%20reception'),'voluntary quote email contains chosen scope');
 await goto(page,'/portal');
 check((await page.$eval('.cp-gateway-auth',n=>n.textContent)).includes('Client access is currently managed by our team'),'gateway does not fake login');
 check((await page.$eval('.cp-gateway-card a.cp-green-button',n=>n.getAttribute('href'))).startsWith('mailto:jeremy@strategicmindsai.com'),'live gateway asks for verified client access');
  await goto(page,'/portal/demo');
 await page.waitForSelector('.cp-portal-shell');
 check(page.url().includes('/portal/demo'),'demo gateway link navigates');
 await page.click('.cp-sidebar nav button:nth-child(3)');
 await page.waitForSelector('.cp-approval-card');
 check((await page.$$('.cp-approval-card')).length===3,'approval preview cards');
 await page.click('.cp-approval-card .cp-approve');
 check((await page.$eval('.cp-approval-card .cp-status-label',e=>e.textContent)).toLowerCase().includes('approved'),'demo approval toggles local visual state');
 await clickText(page,'.cp-filter-pills button','Approved');
 check((await page.$$('.cp-approval-card')).length===1,'demo approval filter');
 await page.click('.cp-sidebar nav button:nth-child(4)');
 await page.waitForSelector('.cp-leads');
 await page.type('.cp-leads input','Sample Inquiry 001');
 check((await page.$$('.cp-table-wrap tbody tr')).length===1,'lead search works');
 await page.click('.cp-sidebar nav button:nth-child(5)');
 await page.waitForSelector('.cp-asset-list');
 check((await page.$$('.cp-asset-list>div')).length===4,'synthetic asset library accessible');
 await page.click('.cp-sidebar nav button:nth-child(6)');
 check((await page.$eval('.cp-billing-empty',n=>n.textContent)).includes('No live billing connected'),'billing transparent');
 await page.click('.cp-sidebar nav button:nth-child(7)');
 check((await page.$$('.cp-support-option')).length===3,'support paths available');
 await page.setViewport({width:390,height:844});
 await goto(page,'/portal/demo?section=overview');
 await page.click('.cp-mobile-toggle');
 check(await page.$eval('.cp-sidebar',n=>n.classList.contains('cp-sidebar-open')),'mobile drawer opens');
 await page.waitForFunction(()=>document.querySelector('.cp-sidebar')?.getBoundingClientRect().left>=-1,{timeout:3000});
 await clickText(page,'.cp-sidebar nav button','Projects');
 check(page.url().includes('section=projects'),'mobile drawer navigation');
 await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
 await goto(page,'/pricing');
 const animation=await page.$eval('.cp-hero-visual img',n=>getComputedStyle(n).animationName);
 check(animation==='none','reduced motion disabled');
 check(errors.length===0,'No JS errors or unintended API calls: '+errors.join(' | '));
 console.log('PORTAL_PRICING_BROWSER_ASSERTIONS='+checks);
}finally{if(browser)await browser.close();if(server)server.kill();}