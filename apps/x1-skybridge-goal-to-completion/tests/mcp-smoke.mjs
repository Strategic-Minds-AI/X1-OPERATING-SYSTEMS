import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
const client=new Client({name:"x1-mcp-smoke",version:"0.2.0"});
const transport=new StreamableHTTPClientTransport(new URL("http://127.0.0.1:3217/mcp"));
try {
 await client.connect(transport);
 const t=await client.listTools();
 const names=t.tools.map(x=>x.name).sort();
 for(const name of ["create_goal_plan","review_goal_evidence","inspect_x1_systems","inspect_x1_jobs","build_site_preview","validate_site_preview","plan_cloud_action"]) assert(names.includes(name),name);
 const p=await client.callTool({name:"create_goal_plan",arguments:{goal:"Ship one verified preview"}});
 assert.equal(p.structuredContent?.steps?.length,7);
 const review=await client.callTool({name:"review_goal_evidence",arguments:{goal:"Ship one verified preview",steps:[{title:"Run tests",acceptance:"Tests passed",status:"review",evidence:"receipt-ref"}]}});
 assert.equal(review.structuredContent?.independentVerification,"NOT_RUN");
 const systems=await client.callTool({name:"inspect_x1_systems",arguments:{}});
 assert(systems.structuredContent.services.length>=8);
 const jobs=await client.callTool({name:"inspect_x1_jobs",arguments:{}});
 assert.equal(jobs.structuredContent.readOnly,true);
 const build=await client.callTool({name:"build_site_preview",arguments:{goal:"Generate safe epoxy preview",title:"Epoxy test local",kind:"app"}});
 assert.match(build.structuredContent.candidateId,/^[a-f0-9]{16}$/);
 const tests=await client.callTool({name:"validate_site_preview",arguments:{candidateId:build.structuredContent.candidateId}});
 assert.equal(tests.structuredContent.failed,0);
 assert.equal(tests.structuredContent.releaseAuthorized,false);
 const cloud=await client.callTool({name:"plan_cloud_action",arguments:{provider:"vercel",intent:"Create a test preview only",environment:"preview"}});
 assert.equal(cloud.structuredContent.dispatch,"NOT_PERFORMED");
 console.log(JSON.stringify({ok:true,tools:names,localServices:systems.structuredContent.services.length,workerMirrorRecords:jobs.structuredContent.count,candidate:build.structuredContent.candidateId,checks:tests.structuredContent.passed,cloudDispatch:cloud.structuredContent.dispatch}));
} finally {await client.close();}