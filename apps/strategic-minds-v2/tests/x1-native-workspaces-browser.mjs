import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import puppeteer from 'puppeteer-core';

const port=8181,base='http://127.0.0.1:'+port;
const chrome=process.env.CHROME_BIN||process.env.PUPPETEER_EXECUTABLE_PATH||[
 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
 '/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'
].find(existsSync);
if(!chrome)throw new Error('CHROME_NOT_FOUND: supply CHROME_BIN for workspace browser tests');
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:process.cwd(),stdio:['ignore','pipe','pipe']});
const logs=[];server.stdout.on('data',x=>logs.push(String(x)));server.stderr.on('data',x=>logs.push(String(x)));
let browser;
const screens=resolve('qa_e2e/workspaces');mkdirSync(screens,{recursive:true});
function check(value,message){assert.ok(value,message);}
async function ready(){for(let i=0;i<80;i++){try{const r=await fetch(base+'/admin/prompt-lab');if(r.ok)return;}catch{}await new Promise(r=>setTimeout(r,150));}throw new Error('VITE_PREVIEW_NOT_READY '+logs.join('').slice(-1200));}
try{
 await ready();
 browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-setuid-sandbox','--disable-gpu']});
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const viewport of [{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}]){
  await page.setViewport({width:viewport.width,height:viewport.height,deviceScaleFactor:1});
  for(const route of [
   {path:'/admin/prompt-lab',selector:'.x1-promptlab-header',heading:'Prompt Lab'},
   {path:'/admin/coding-kanban',selector:'.x1-kanban-header',heading:'Autonomous Coding Board'}
  ]){
   const response=await page.goto(base+route.path,{waitUntil:'networkidle0',timeout:20000});
   check([200,304].includes(response.status()),route.path+' HTTP '+response.status());
   await page.waitForSelector(route.selector,{timeout:10000});
   check((await page.$eval('h1',el=>el.textContent)).includes(route.heading),route.path+' heading');
   check(await page.evaluate(()=>document.querySelectorAll('iframe').length===0),route.path+' no embedded external app');
   check(await page.evaluate(()=>document.querySelector('meta[name="robots"]')?.content.includes('noindex')),route.path+' preview noindex');
   const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-window.innerWidth,offenders:[...document.querySelectorAll('body *')].map(el=>{const r=el.getBoundingClientRect();return {tag:el.tagName,cls:typeof el.className==='string'?el.className:'',text:(el.innerText||'').slice(0,30),left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width)}}).filter(x=>x.right>innerWidth+1||x.left< -1).slice(0,15)}));
   check(layout.overflow<=1,route.path+' '+viewport.name+' no horizontal overflow: '+JSON.stringify(layout));
   check(await page.evaluate(()=>document.body.textContent.includes('Sign in')||document.body.textContent.includes('Sign-in')),route.path+' requires X1 auth before showing tenant data');
   await page.screenshot({path:resolve(screens,route.path.includes('prompt')?'prompt-'+viewport.name+'.png':'kanban-'+viewport.name+'.png')});
   process.stdout.write('PASS_'+route.path.replaceAll('/','_').toUpperCase()+'_'+viewport.name.toUpperCase()+'\n');
  }
 }
 await page.setViewport({width:1440,height:900});
 const studio=await page.goto(base+'/admin/visual-editor',{waitUntil:'networkidle0',timeout:20000});
 check([200,304].includes(studio.status()),'visual editor HTTP '+studio.status());
 await page.waitForSelector('.x1-studio .x1-chat',{timeout:10000});
 await page.waitForSelector('.x1-studio .x1-editor',{timeout:10000});
 const layout=await page.evaluate(()=>({chat:document.querySelector('.x1-studio .x1-chat').getBoundingClientRect(),editor:document.querySelector('.x1-studio .x1-editor').getBoundingClientRect()}));
 check(layout.chat.right<=layout.editor.left+4,'Visual Editor chat is left of editor canvas');
 check(errors.length===0,'no uncaught browser errors: '+errors.join('; '));
 process.stdout.write('PASS_VISUAL_EDITOR_CHAT_LEFT_EDITOR_RIGHT\nPASS_NO_UNCAUGHT_BROWSER_ERRORS\n');
}finally{if(browser)await browser.close();server.kill();}
