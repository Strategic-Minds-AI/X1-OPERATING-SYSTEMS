import {spawn} from 'node:child_process';
import {mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';

const port=8193;
const host=process.env.X1_TEST_URL || 'http://127.0.0.1:'+port;
const browserPath=process.env.CHROME_BIN || [
 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
 '/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'
].find(existsSync);
if(!browserPath)throw new Error('Missing Chromium; set CHROME_BIN');
const server=process.env.X1_TEST_URL?null:spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:process.cwd(),stdio:'ignore'});
const targets=['/v2/a','/v2/b','/v2/c','/pricing','/portal','/portal/demo','/admin/studio'];
let browser,assertions=0,errors=[];
function check(condition,label){assert.ok(condition,label);assertions++;}
function same(a,b){check(a===b,'Expected '+JSON.stringify(b)+' but got '+JSON.stringify(a));}
async function ready(){for(let i=0;i<65;i++){try{const res=await fetch(host+'/v2/a');if(res.ok)return;}catch{}await new Promise(r=>setTimeout(r,170));}throw Error('Vite preview did not start: '+host);}
async function open(page,path){
 const r=await page.goto(host+path,{waitUntil:'networkidle0',timeout:30000});
 check([200,304].includes(r.status()),'HTTP navigation '+path+' status '+r.status());
}
mkdirSync(resolve('qa_e2e/screens'),{recursive:true});
try{
 await ready();
 browser=await puppeteer.launch({executablePath:browserPath,headless:true,args:['--no-sandbox','--disable-setuid-sandbox','--disable-gpu']});
 const page=await browser.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',request=>{
  if(!/\/api\/x1\//.test(request.url()))return;
  // The real portal now loads public connection metadata on signed-out views.
  // GET agent-config is expected; any mutating or tenant-data request is not.
  const url=new URL(request.url());
  if(request.method()==='GET'&&url.pathname==='/api/x1/agent-config')return;
  errors.push('UNEXPECTED_REAL_AGENT_CALL '+request.method()+' '+request.url());
 });
 for(const size of [{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}]){
  await page.setViewport({width:size.width,height:size.height,deviceScaleFactor:1});
  for(const path of targets){
   await open(page,path);
   const metrics=await page.evaluate(()=>{
    const target=document.querySelector('.v2-page,.cp-site,.x1-studio');
    const computed=target&&getComputedStyle(target);
    const root=getComputedStyle(document.documentElement);
    const logos=[...document.querySelectorAll('img')].filter(img=>(img.getAttribute('src')||'').includes('silver-emblem.png'));
    return {
     background:computed?.backgroundColor,foreground:computed?.color,
     horizontalOverflow:document.documentElement.scrollWidth-window.innerWidth,
     logoLoaded:logos.some(img=>img.complete&&img.naturalWidth>0),
     tokens:Object.fromEntries(['canvas','cyan','blue','green','white'].map(k=>[k,root.getPropertyValue('--smai-'+k).trim()]))
    };
   });
   same(metrics.background,'rgb(2, 5, 13)');
   same(metrics.foreground,'rgb(246, 251, 255)');
   check(metrics.horizontalOverflow<=1,size.name+' '+path+' horizontal overflow '+metrics.horizontalOverflow);
   check(metrics.logoLoaded,size.name+' '+path+' metallic S missing');
   for(const [name,value] of Object.entries({canvas:'#02050d',cyan:'#02cfff',blue:'#128cff',green:'#66ff9c',white:'#f6fbff'})){
    same(metrics.tokens[name],value);
   }
   await page.screenshot({path:resolve('qa_e2e/screens','brandlock_'+size.name+'_'+path.replaceAll('/','_')+'.png')});
   console.log('BRAND_PASS '+size.name+' '+path);
  }
 }
 await page.setViewport({width:1440,height:900});
 await open(page,'/admin/studio');
 await page.waitForSelector('.x1-surface-h1');
 let headingPx=await page.$eval('.x1-surface-h1',node=>parseFloat(getComputedStyle(node).fontSize));
 check(headingPx>=30,'Visual Studio headline too small at desktop: '+headingPx+'px');
 await page.click('.x1-surface-h1');
 check((await page.$eval('.x1-inspect-body h3',node=>node.textContent)).includes('Hero heading'),'inspector selection');
 const editor=await page.$('.x1-inspect-body textarea');
 check(!!editor,'inspector heading input');
 await editor.click();
 await page.keyboard.down('Control');
 await page.keyboard.press('KeyA');
 await page.keyboard.up('Control');
 await page.keyboard.type('BUILD WITH INTELLIGENCE');
 await page.waitForFunction(()=>document.querySelector('.x1-surface-h1')?.textContent==='BUILD WITH INTELLIGENCE',{timeout:4500});
 check(true,'live hero content edit');
 await page.click('.x1-tabs-group button:nth-child(3)');
 await page.waitForSelector('.x1-diff');
 check((await page.$$('.x1-diff')).length>0,'visual change diff appears');
 await page.click('.x1-tabs-group button:nth-child(2)');
 check((await page.$eval('.x1-code-panel pre',node=>node.textContent)).includes('review_only'),'patch export is review only');
 await page.click('button[aria-label="Undo local edit"]');
 await page.click('.x1-tabs-group button:nth-child(1)');
 check((await page.$eval('.x1-surface-h1',node=>node.textContent)).includes('INTELLIGENCE'),'visual undo restores heading');
 await page.click('.x1-chat-compose textarea');
 await page.keyboard.type('Build a preview homepage using the brand colors');
 await page.click('.x1-send');
 await page.waitForFunction(()=>document.body.textContent.includes('No model was called'),{timeout:5000});
 check(true,'chat command saved as explicitly local draft');
 await page.click('button[title="Sandboxes"]');
 await page.waitForSelector('.x1-sandbox-card');
 check((await page.$$('.x1-sandbox-card')).length===3,'three mock sandbox cards');
 await page.click('.x1-sandbox-card:nth-of-type(2)');
 await page.waitForFunction(()=>document.querySelector('.x1-editor-project strong')?.textContent.includes('Digital Dominance'),{timeout:5000});
 check(true,'sandbox context picker changes selected project');
 await page.click('.x1-night');
 check((await page.$eval('.x1-night-banner',node=>node.textContent)).includes('prepared plan only'),'overnight toggle has honest boundary');
 await page.screenshot({path:resolve('qa_e2e/screens','studio_editor_interaction_desktop.png')});
 await page.setViewport({width:390,height:844});
 await open(page,'/admin/studio');
 const mobileFont=await page.$eval('.x1-surface-h1',node=>parseFloat(getComputedStyle(node).fontSize));
 check(mobileFont>=29,'studio mobile heading too small: '+mobileFont+'px');
 await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
 check((await page.$eval('.x1-browser-frame',node=>getComputedStyle(node).transitionDuration))==='0s','reduced-motion transitions inactive');
 check(errors.length===0,'browser JS / remote agent error: '+errors.join(' | '));
 console.log('BRAND_STUDIO_BROWSER_ASSERTIONS='+assertions);
 console.log('BRAND_STUDIO_BROWSER_PASS');
}finally{
 if(browser)await browser.close();
 if(server)server.kill();
}
