import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolveAcademyPath,runTemplateAcademy,ACADEMY_RELEASE_SHA} from "../api/x1/template-academy.js";
function sink(){return {statusCode:200,headers:{},body:"",setHeader(k,v){this.headers[k]=v},end(x){this.body=x}};}
const req=(query,method="GET")=>({method,query,headers:{}});
test("X1 Academy adapter is pinned to exact owner-controlled source release",()=>{
 assert.equal(ACADEMY_RELEASE_SHA,"059f9e8042aa413d05fcc6955be8a275e187ce26");
 assert.equal(resolveAcademyPath({kind:"catalog"}),"/manifest.json");
 assert.equal(resolveAcademyPath({kind:"academies"}),"/academies/registry.json");
 assert.equal(resolveAcademyPath({kind:"template",id:"split-left"}),"/sites/split-left/index.html");
 assert.equal(resolveAcademyPath({kind:"template",id:"split-left",academy:"epoxy"}),"/academies/epoxy/sites/split-left/index.html");
 for(const candidate of [
  {kind:"template",id:"../admin"},{kind:"template",id:"ABC"},
  {kind:"template",id:"good",academy:"../../bad"},{kind:"catalog",id:"leak"},
  {kind:"not-a-real-option",id:"anything"},{kind:"template",id:"http://internal"}]){
  assert.equal(resolveAcademyPath(candidate),null,JSON.stringify(candidate));
 }
});
test("source fetch is read-only, no caller credentials forwarded, verified response headers",async()=>{
 const html='<!doctype html><html><head><meta name="robots" content="noindex,nofollow"/></head><body><h1 data-field="headline">Test</h1></body></html>';
 let calls=0;
 const res=sink();await runTemplateAcademy(req({kind:"template",id:"split-left",academy:"epoxy"}),res,{
  fetchImpl:async(url,opt)=>{
   calls++;assert.equal(url,"https://universal-factory-academy-frgdq8fol-strategic-minds-advisory.vercel.app/academies/epoxy/sites/split-left/index.html");
   assert.equal(opt.method,"GET");assert.equal(opt.redirect,"error");
   assert.deepEqual(Object.keys(opt.headers),["accept"]);return new Response(html,{status:200});
  }
 });
 assert.equal(calls,1);assert.equal(res.statusCode,200);assert.equal(res.body,html);
 assert.equal(res.headers["X-X1-Source-SHA"],ACADEMY_RELEASE_SHA);
 assert.equal(res.headers["X-Content-Type-Options"],"nosniff");
});
test("academy refuses method, unexpected resources, broken manifest and non-noindex HTML",async()=>{
 const candidates=[
  [req({kind:"catalog"},"POST"),()=>new Response("{}"),405,"METHOD_NOT_ALLOWED"],
  [req({kind:"template",id:"../internal"}),()=>new Response("{}"),400,"INVALID_ACADEMY_RESOURCE"],
  [req({kind:"catalog"}),()=>new Response(JSON.stringify({templates:[]})),502,"INVALID_ACADEMY_CATALOG"],
  [req({kind:"academies"}),()=>new Response(JSON.stringify({academies:[]})),502,"INVALID_ACADEMY_CATALOG"],
  [req({kind:"template",id:"centered"}),()=>new Response('<h1 data-field="headline">Unsafe</h1>'),502,"UNSAFE_ACADEMY_TEMPLATE"],
  [req({kind:"template",id:"centered"}),()=>new Response("denied",{status:401}),503,"ACADEMY_SOURCE_REJECTED"],
  [req({kind:"template",id:"centered"}),()=>{throw Error("offline")},503,"ACADEMY_SOURCE_UNAVAILABLE"]
 ];
 for(const [request,fetchImpl,status,reason]of candidates){
  const res=sink();await runTemplateAcademy(request,res,{fetchImpl});
  assert.equal(res.statusCode,status);
  assert.equal(JSON.parse(res.body).reason,reason);
 }
});
test("native admin route and designer retain 40 layout, six edition, viewports and exports",()=>{
 const main=readFileSync(new URL("../src/main.jsx",import.meta.url),"utf8");
 const designer=readFileSync(new URL("../src/TemplateDesigner.jsx",import.meta.url),"utf8");
 assert.ok(main.includes('path="/admin/template-designer"'));
 for(const word of ["data-field","studio-config-v1","industry_academy","source_commit_sha","noindex,nofollow,noarchive","template_id","40","6","desktop","tablet","mobile","Export website HTML","Export JSON"])
  assert.ok(designer.includes(word),word);
 assert.ok(designer.includes('sandbox="allow-same-origin"'));
 assert.doesNotMatch(designer,/fetch\(["']https?:\/\/|SUPABASE_SERVICE|DISPATCH_ENABLED|secret_key/i);
});
