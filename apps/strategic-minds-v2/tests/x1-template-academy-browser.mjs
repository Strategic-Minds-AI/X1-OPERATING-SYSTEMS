// Real browser acceptance for the X1 Academy Template Designer; NOT part of npm run check
// without an installed Chrome. Invocation:
// X1_ACADEMY_URL=https://preview-host PUPPETEER_EXECUTABLE_PATH=/path/to/chrome npm run test:academy:browser
import puppeteer from "puppeteer-core";
import assert from "node:assert/strict";
import {mkdir,writeFile} from "node:fs/promises";
import path from "node:path";
const origin=process.env.X1_ACADEMY_URL||"https://x1-operating-system-7ji2a88jl-strategic-minds-advisory.vercel.app";
const executablePath=process.env.PUPPETEER_EXECUTABLE_PATH||process.env.CHROME_PATH||"/usr/bin/chromium";
const output=process.env.X1_QA_OUTPUT_DIR||path.resolve("dist/qa");
const url=new URL("/admin/template-designer",origin).href;
const errors=[],steps=[],screenshots=[];
const test=(ok,message)=>{assert.ok(ok,message);steps.push(message);console.log("PASS "+message)};
await mkdir(output,{recursive:true});
const browser=await puppeteer.launch({executablePath,headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
try{
 const page=await browser.newPage();await page.setViewport({width:1440,height:900,deviceScaleFactor:1});
 page.on("pageerror",e=>errors.push(e.message));
 page.on("response",r=>{if(r.url().includes("/api/x1/template-academy")&&r.status()!==200)
   errors.push("ACADEMY_HTTP_"+r.status()+" "+r.url())});
 const result=await page.goto(url,{waitUntil:"networkidle2",timeout:30000});
 await page.waitForSelector(".td-browser iframe",{timeout:18000});
 test(result.status()===200,"X1 template designer HTTP 200");
 test((await page.$$eval(".td-template",a=>a.length))===40,"40 approved master templates render");
 const desktop=path.resolve(output,"template-designer-desktop.png");
 await page.screenshot({path:desktop,fullPage:true});screenshots.push(desktop);
 await page.select("#td-academy","epoxy");
 await page.waitForFunction(()=>document.querySelectorAll(".td-template").length===6 &&
  document.querySelector(".td-browser iframe")?.srcdoc?.includes("Garage floor transformations"),{timeout:20000});
 test(true,"Epoxy academy six tailored designs load");
 const brand=await page.$(".td-fields label:first-child input");
 await brand.click({clickCount:3});await page.keyboard.type("X1 Verified Coatings");
 await page.waitForFunction(()=>document.querySelector(".td-browser iframe")?.srcdoc?.includes("X1 Verified Coatings"),{timeout:14000});
 test(true,"Live brand input changes generated HTML");
 await page.click('button[title="mobile viewport 390px"]');
 const width=await page.$eval(".td-browser",x=>Math.round(x.getBoundingClientRect().width));
 test(width>=389&&width<=392,"390px responsive preview canvas");
 const mobile=path.resolve(output,"template-designer-mobile.png");
 await page.screenshot({path:mobile,fullPage:true});screenshots.push(mobile);
 await page.click(".td-primary");
 await page.waitForFunction(()=>document.querySelector(".td-footer")?.innerText?.includes("HTML exported"),{timeout:8000});
 test(true,"Standalone HTML export action");
 await page.select("#td-academy","legal");
 await page.waitForFunction(()=>document.querySelectorAll(".td-template").length===6 &&
  document.querySelector(".td-browser iframe")?.srcdoc?.includes("Counsel House"),{timeout:20000});
 test(true,"Legal industry preset loads with correct source content");
 test(errors.length===0,"No JavaScript or Academy API errors");
 await page.close();
 const receipt={status:"BROWSER_TEST_PASS",url,steps,errors,screenshots,sourceRelease:"059f9e8042aa413d05fcc6955be8a275e187ce26",checkedAt:new Date().toISOString()};
 await writeFile(path.join(output,"template-designer-browser-receipt.json"),JSON.stringify(receipt,null,2)+"\n");
 console.log(JSON.stringify({status:receipt.status,count:steps.length,artifacts:screenshots,receipt:path.join(output,"template-designer-browser-receipt.json")}));
}catch(e){console.error("BROWSER_TEST_FAILED",String(e));throw e}
finally{await browser.close()}
