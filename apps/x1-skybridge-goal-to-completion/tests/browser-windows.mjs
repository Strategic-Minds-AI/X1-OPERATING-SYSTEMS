import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readdir, readFile, mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const candidates=path.join(root,"artifacts","candidates");
const names=await readdir(candidates);
let source;
for(const name of names){
  const p=path.join(candidates,name,"index.html");
  try {if((await readFile(p,"utf8")).includes("Skybridge QA Calculator")){source=p;break;}} catch {}
}
assert(source,"QA calculator artifact missing");
const bins=[
 "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
 "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
 "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];
const {access}=await import("node:fs/promises");
let browserBinary;
for(const b of bins){try{await access(b);browserBinary=b;break;}catch{}}
assert(browserBinary,"Windows Chromium browser not found");
await mkdir(path.join(root,"receipts"),{recursive:true});
const browser=await chromium.launch({executablePath:browserBinary,headless:true});
const results=[];
try {
 for(const device of [{name:"desktop",width:1440,height:900},{name:"mobile",width:390,height:844}]){
  const page=await browser.newPage({viewport:{width:device.width,height:device.height},deviceScaleFactor:1});
  const errors=[];const remotes=[];
  page.on("pageerror",e=>errors.push(e.message));
  page.on("request",req=>{if(req.url().startsWith("http"))remotes.push(req.url());});
  await page.goto(pathToFileURL(source).href,{waitUntil:"load"});
  const metrics=await page.evaluate(()=>({viewport:innerWidth,body:document.body.scrollWidth,html:document.documentElement.scrollWidth}));
  const area=page.getByLabel("Area (sq ft)"), rate=page.getByLabel("Rate ($/sq ft)");
  await area.fill("600"); await rate.fill("8");
  assert.equal(await page.locator("#result").innerText(),"$4,800");
  await area.fill("-1");
  assert.match(await page.locator("#error").innerText(),/within the displayed limits/i);
  const screenshot=path.join(root,"receipts","browser-"+device.name+".png");
  await area.fill("600");
  await page.screenshot({path:screenshot,fullPage:true});
  results.push({device:device.name,metrics,screenshot,consoleErrors:errors,externalRequests:remotes});
  await page.close();
 }
} finally {await browser.close();}
console.log(JSON.stringify(results));
assert(results.every(x=>x.metrics.html<=x.metrics.viewport+1),"Horizontal overflow detected");
assert(results.every(x=>x.consoleErrors.length===0),"Runtime errors");
assert(results.every(x=>x.externalRequests.length===0),"Unexpected remote requests");
