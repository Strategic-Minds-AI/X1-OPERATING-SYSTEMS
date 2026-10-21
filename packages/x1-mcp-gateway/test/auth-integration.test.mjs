import test,{after, before} from "node:test";
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {generateKeyPair,exportJWK,SignJWT} from "jose";
import {verifyBearer,verifyCapability} from "../src/auth.ts";
import {adapterCall} from "../src/adapter.ts";
const T="666f23bf-61bd-4be0-b5cb-4872e04fad9b";
let key,jwksUrl,base,server;
const seen=[];
let allow=true, wrongTenant=false;
const issuer="http://x1-issuer.test/",audience="x1-mcp-test";
before(async()=>{
 const pair=await generateKeyPair("RS256");
 key=pair.privateKey;
 const publicJwk=await exportJWK(pair.publicKey);
 Object.assign(publicJwk,{kid:"staging-qa-key",alg:"RS256",use:"sig"});
 server=createServer(async(req,res)=>{
  let body="";
  for await(const chunk of req)body+=chunk;
  const parsed=body?JSON.parse(body):null;
  seen.push({url:req.url,authorization:req.headers.authorization,body:parsed,method:req.method});
  res.setHeader("content-type","application/json");
  if(req.url==="/jwks"){res.end(JSON.stringify({keys:[publicJwk]}));return;}
  if(req.url==="/authorize"){
   if(req.headers.authorization!=="Bearer internal-authz-only"){res.statusCode=401;res.end("{}");return;}
   res.end(JSON.stringify({
     allowed:allow,actor_id:parsed.actor_id,
     tenant_id:wrongTenant?"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb":parsed.tenant_id,
     capability:parsed.capability
   }));return;
  }
  if(req.url==="/v1/mcp/supergpt/job_status"){
    if(req.headers.authorization!=="Bearer internal-adapter-only"){res.statusCode=401;res.end("{}");return;}
    res.end(JSON.stringify({tenant_id:req.headers["x-x1-tenant-id"],job_status:"NO_DISPATCH",worker_receipt:null}));return;
  }
  res.statusCode=404;res.end("{}");
 });
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 const port=server.address().port;
 base="http://127.0.0.1:"+port;
 jwksUrl=base+"/jwks";
 Object.assign(process.env,{
  X1_JWKS_URL:jwksUrl,X1_JWT_ISSUER:issuer,X1_JWT_AUDIENCE:audience,
  X1_AUTHZ_URL:base+"/authorize",X1_AUTHZ_SERVICE_TOKEN:"internal-authz-only",
  X1_ADAPTER_BASE_URL:base,X1_ADAPTER_SERVICE_TOKEN:"internal-adapter-only"
 });
});
after(()=>server?.close());
async function token(scope="x1:mcp",opts={}){
 let jwt=new SignJWT({scope}).setProtectedHeader({alg:"RS256",kid:"staging-qa-key"})
  .setIssuer(opts.issuer??issuer).setAudience(opts.audience??audience)
  .setSubject("actor-1").setIssuedAt().setExpirationTime("5m");
 return jwt.sign(key);
}
test("signed JWT validates issuer, audience, subject and x1:mcp scope",async()=>{
 const principal=await verifyBearer(new Request(base+"/mcp",{headers:{authorization:"Bearer "+await token()}}));
 assert.equal(principal.actorId,"actor-1");
});
test("signed JWT with no scope or wrong audience is rejected",async()=>{
 for(const jwt of [await token("unrelated:read"),await token("x1:mcp",{audience:"other"})]){
  await assert.rejects(()=>verifyBearer(new Request(base+"/mcp",{headers:{authorization:"Bearer "+jwt}})));
 }
});
test("authorization policy denies mismatched tenant and refused capabilities",async()=>{
 const principal=await verifyBearer(new Request(base+"/mcp",{headers:{authorization:"Bearer "+await token()}}));
 wrongTenant=true;
 await assert.rejects(()=>verifyCapability(principal,T,"supergpt.job_status"),/AUTHORIZATION_DENIED/);
 wrongTenant=false;allow=false;
 await assert.rejects(()=>verifyCapability(principal,T,"supergpt.job_status"),/AUTHORIZATION_DENIED/);
 allow=true;
});
test("valid tool contract uses separate service tokens, enforces dry-run and does not claim worker execution",async()=>{
 const jwt=await token();
 const principal=await verifyBearer(new Request(base+"/mcp",{headers:{authorization:"Bearer "+jwt}}));
 const tenant=await verifyCapability(principal,T,"supergpt.job_status");
 assert.equal(tenant,T);
 const response=await adapterCall("supergpt","job_status",
  {tenantId:tenant,dryRun:true,subject:"task-synthetic-1"},principal);
 assert.equal(response.status,"ADAPTER_RESPONSE_UNVERIFIED");
 assert.equal(response.result.job_status,"NO_DISPATCH");
 const authz=seen.findLast(x=>x.url==="/authorize");
 const adapter=seen.findLast(x=>x.url==="/v1/mcp/supergpt/job_status");
 assert.equal(authz.authorization,"Bearer internal-authz-only");
 assert.equal(adapter.authorization,"Bearer internal-adapter-only");
 assert.equal(adapter.body.allowed_environment,"staging");
 assert.equal(adapter.body.publication_allowed,false);
 assert.equal(adapter.body.dry_run,true);
 assert.equal(adapter.body.actor_id,"actor-1");
 assert.equal(adapter.body.tenant_id,T);
 assert.equal(seen.some(x=>x.authorization==="Bearer "+jwt),false);
});
test("adapter enforces allowlisted operations and refuses dry-run false",async()=>{
 const principal={token:"not-forwarded",actorId:"actor-1"};
 await assert.rejects(()=>adapterCall("social","publish",{tenantId:T,dryRun:true},principal),/OPERATION_NOT_ALLOWED/);
 await assert.rejects(()=>adapterCall("social","campaign_draft",{tenantId:T,dryRun:false},principal),/DRY_RUN_REQUIRED/);
});
