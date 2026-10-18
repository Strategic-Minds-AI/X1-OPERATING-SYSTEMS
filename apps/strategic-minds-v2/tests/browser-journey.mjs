import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import puppeteer from 'puppeteer-core';

const port=8178;
const base='http://127.0.0.1:'+port;
const chrome=process.env.CHROME_BIN || process.env.PUPPETEER_EXECUTABLE_PATH ||
 ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(existsSync);
if(!chrome)throw new Error('CHROME_NOT_FOUND: supply CHROME_BIN for browser acceptance run');
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:process.cwd(),stdio:['ignore','pipe','pipe']});
const logs=[];
server.stdout.on('data',x=>logs.push(String(x)));
server.stderr.on('data',x=>logs.push(String(x)));
let browser=null;
const screenshotDir=resolve('qa_e2e/screens');
mkdirSync(screenshotDir,{recursive:true});
let assertions=0;
function check(expression,message){assert.ok(expression,message);assertions++;}
async function ready(){for(let i=0;i<80;i++){try{const r=await fetch(base+'/v2/a');if(r.ok)return;}catch{};await new Promise(r=>setTimeout(r,175));}throw new Error('VITE_PREVIEW_NOT_READY: '+logs.join('').slice(-1500));}
try{
 await ready();
 browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-setuid-sandbox','--disable-gpu']});
 const page=await browser.newPage();
 const jsErrors=[]; page.on('pageerror',e=>jsErrors.push(e.message));
 for(const device of [{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}]){
   await page.setViewport({width:device.width,height:device.height,deviceScaleFactor:1});
   for(const variant of ['a','b','c']){
     const response=await page.goto(base+'/v2/'+variant,{waitUntil:'networkidle0',timeout:30000});
     await page.waitForSelector('.v2-page',{timeout:12000});
     check([200,304].includes(response.status()),device.name+' '+variant+' HTTP '+response.status());
     const metrics=await page.evaluate(()=>{
       const callEden=document.querySelector('.v2-header .v2-call-eden');
       const pill=document.querySelector('.v2-header .v2-nav-shell');
       const callNow=document.querySelector('.v2-header .v2-call-now');
       const rect=x=>{const r=x.getBoundingClientRect();return {x:r.left,right:r.right,y:r.top};};
       return {overflow:document.documentElement.scrollWidth-window.innerWidth,
         title:document.title,robots:document.querySelector('meta[name="robots"]')?.content,
         eden:rect(callEden),nav:rect(pill),now:rect(callNow),
         logoOk:!!document.querySelector('.v2-emblem')?.naturalWidth,
         text:document.body.textContent.includes('INTELLIGENCE IN MOTION'),
         variant:document.querySelector('.v2-page')?.className};
     });
     check(metrics.overflow<=1,device.name+' '+variant+' no horizontal overflow ('+metrics.overflow+')');
     check(metrics.logoOk && metrics.text,device.name+' '+variant+' original brand asset');
     check(metrics.robots.includes('noindex'),device.name+' '+variant+' noindex');
     check(metrics.eden.right<=metrics.nav.x+2 && metrics.nav.right<=metrics.now.x+2,device.name+' '+variant+' balanced nav geometry');
     check(metrics.variant.includes('v2-variant-'+variant),device.name+' '+variant+' variant route');
     await page.screenshot({path:resolve(screenshotDir,'X1_'+device.name+'_'+variant+'.png')});
     process.stdout.write('PASS_VISUAL_'+device.name.toUpperCase()+'_'+variant.toUpperCase()+'\n');
   }
 }
 // Confirm actual responsive menu opens and nav link is actionable.
 await page.goto(base+'/v2/a',{waitUntil:'networkidle0'});
 await page.click('.v2-menu');
 const menu=await page.$eval('.v2-menu',el=>el.getAttribute('aria-expanded'));
 check(menu==='true','mobile menu opens via real click');
 const service=await page.$eval('a[href="/v2/b#services"]',el=>el.getAttribute('href'));
 check(service==='/v2/b#services','service link targets standalone path');
 // Verify the integrated Launch Studio route, template catalog, brand palette library, and mobile layout.
 await page.setViewport({width:1440,height:900,deviceScaleFactor:1});
 const launchResponse=await page.goto(base+'/admin/launch-studio',{waitUntil:'networkidle0',timeout:30000});
 await page.waitForSelector('.x1-launch-studio',{timeout:12000});
 check([200,304].includes(launchResponse.status()),'Launch Studio route HTTP '+launchResponse.status());
 check((await page.$('.x1-ls-tabs button')).length===7,'Launch Studio exposes seven in-admin workspaces');
 check((await page.$('.x1-ls-site-hero')).length===1,'Launch Studio renders an in-app website preview without iframe');
 await page.click('.x1-ls-tabs button:nth-child(2)');
 await page.waitForSelector('.x1-ls-template-card',{timeout:12000});
 check((await page.$('.x1-ls-template-card')).length>0,'Digital Domination template library renders');
 check((await page.$eval('.x1-ls-tab-content',el=>el.textContent)).includes('418 saved website design templates'),'template catalog snapshot is visible');
 await page.click('.x1-ls-tabs button:nth-child(3)');
 await page.waitForSelector('.x1-ls-palette-card');
 check((await page.$('.x1-ls-palette-card')).length===20,'20 color systems are selectable');
 await page.click('.x1-ls-tabs button:nth-child(5)');
 check((await page.$('.x1-ls-section-grid label')).length>=20,'page and section composition library renders');
 await page.setViewport({width:390,height:844,deviceScaleFactor:1});
 await page.goto(base+'/admin/launch-studio',{waitUntil:'networkidle0',timeout:30000});
 await page.waitForSelector('.x1-launch-studio');
 const launchMobile=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-window.innerWidth,heading:document.querySelector('.x1-ls-brand h1')?.textContent}));
 check(launchMobile.overflow<=1,'Launch Studio mobile layout has no horizontal page overflow ('+launchMobile.overflow+')');
 check(launchMobile.heading==='Launch Studio','Launch Studio header visible on mobile');
 await page.screenshot({path:resolve(screenshotDir,'X1_launch_studio_mobile.png')});
 process.stdout.write('PASS_LAUNCH_STUDIO_TEMPLATE_PALETTE_MOBILE\n');
 // Complete all four preview discovery questions with consent-first delivery.
 await page.goto(base+'/v2/c#onboarding',{waitUntil:'networkidle0'});
 await page.waitForSelector('#v2-field-business');
 await page.type('#v2-field-business','Synthetic QA Test Company');
 await page.click('.v2-onboarding button[type="submit"]');
 await page.waitForSelector('#v2-field-goal');
 await page.select('#v2-field-goal','Automate repetitive tasks');
 await page.click('.v2-onboarding button[type="submit"]');
 await page.waitForSelector('#v2-field-market');
 await page.type('#v2-field-market','Test City');
 await page.click('.v2-onboarding button[type="submit"]');
 await page.waitForSelector('#v2-field-notes');
 await page.click('.v2-onboarding button[type="submit"]');
 await page.waitForSelector('.v2-finished');
 const brief=await page.$eval('.v2-finished',el=>el.textContent);
 check(brief.includes('Synthetic QA Test Company') && brief.includes('Test City'),'complete discovery brief rendered');
 const mail=await page.$eval('.v2-finished a[href^="mailto:"]',a=>a.getAttribute('href'));
 check(mail.includes('Synthetic%20QA%20Test%20Company'),'mail draft generated only upon explicit click');
 check(jsErrors.length===0,'no browser runtime exceptions: '+jsErrors.join(' | '));
 // Reduced motion preference should disable each aesthetic animation.
 await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
 await page.goto(base+'/v2/a',{waitUntil:'networkidle0'});
 const reduced=await page.evaluate(()=>({
   earth:getComputedStyle(document.querySelector('.v2-earth>img')).animationName,
   glint:getComputedStyle(document.querySelector('.v2-emblem-glint')).animationName,
   eden:getComputedStyle(document.querySelector('.v2-call-eden')).animationName
 }));
 check(reduced.earth==='none'&&reduced.glint==='none'&&reduced.eden==='none','operating-system reduced motion respected');
 process.stdout.write('PASS_ONBOARDING_FOUR_STEPS\nPASS_MOBILE_NAVIGATION\nPASS_REDUCED_MOTION\nPASS_BROWSER_ASSERTIONS='+assertions+'\n');
}finally{
 if(browser)await browser.close();
 server.kill();
}