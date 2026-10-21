import test from "node:test";
import assert from "node:assert/strict";
import {runStatusPublic} from "../api/x1/status-public.js";
import {STAGING_ORIGIN} from "../server/x1-staging.mjs";

const VALID={VERCEL_ENV:"production",X1_PRODUCTION_BINDING_ENABLED:"true",
 SUPABASE_URL:STAGING_ORIGIN+"/",SUPABASE_ANON_KEY:"public-fixture",SUPABASE_SERVICE_ROLE_KEY:"server-fixture"};
const req=(method="GET")=>({method,headers:{}});
function sink(){return {statusCode:200,headers:{},body:null,setHeader(k,v){this.headers[k]=v;},end(s){this.body=JSON.parse(s)}};}
test("public status probes real Supabase with X1 server credentials but does not expose their values or tenant identity",async()=>{
 let calls=0;const res=sink();
 await runStatusPublic(req(),res,{env:VALID,fetchImpl:async(url,opts)=>{
  calls++;assert.equal(new URL(url).origin,STAGING_ORIGIN);
  assert.equal(opts.headers.authorization,"Bearer server-fixture");
  return new Response(JSON.stringify([{tenant_id:"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"}]),{status:200});
 }});
 assert.equal(calls,1);assert.equal(res.statusCode,200);assert.equal(res.body.status,"LIVE_DATA_VERIFIED");
 assert.equal(res.body.readOnly,true);assert.ok(res.body.checkedAt);assert.equal(JSON.stringify(res.body).includes("bbbbbbbb"),false);
 assert.equal(JSON.stringify(res.body).includes("server-fixture"),false);
 assert.equal(res.headers["Cache-Control"].includes("no-store"),true);
});
test("public status blocks on unbound production, rejected upstream and network errors",async()=>{
 for(const options of [{env:{...VALID,X1_PRODUCTION_BINDING_ENABLED:"false"},status:503,code:"NON_PREVIEW_RUNTIME"},
  {env:VALID,status:503,code:"X1_UPSTREAM_REJECTED",fetchImpl:async()=>new Response("denied",{status:401})},
  {env:VALID,status:503,code:"X1_UPSTREAM_UNAVAILABLE",fetchImpl:async()=>{throw Error("offline")}}]){
  const res=sink();await runStatusPublic(req(),res,options);
  assert.equal(res.statusCode,options.status);assert.equal(res.body.reason,options.code);
 }
});
test("public status accepts only GET",async()=>{const res=sink();await runStatusPublic(req("POST"),res,{env:VALID});assert.equal(res.statusCode,405)});
