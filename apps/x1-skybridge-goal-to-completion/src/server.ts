import { Skybridge } from "skybridge/server";
import { z } from "zod";
import { makePlan, reviewEvidence } from "./model.js";
import { getSystemSnapshot, getLocalJobs } from "./operations.js";
import { createCandidate, validateCandidate } from "./site-factory.js";
import { inspectProbeJob } from "./worker-bridge.js";

const stepSchema = z.object({
 title:z.string().trim().min(3).max(120),
 acceptance:z.string().trim().min(3).max(600),
 phase:z.string().trim().max(60).optional(),
});
export const app = new Skybridge({
 name:"x1-goal-to-receipt",
 version:"0.2.0",
 handler:(server)=>server
 .registerTool({
  name:"create_goal_plan",
  description:"Turn any goal into a visible execution checklist with measurable criteria. You may supply 1-12 tailored steps. Doesn't run cloud jobs.",
  inputSchema:{goal:z.string().trim().min(3).max(500),steps:z.array(stepSchema).min(1).max(12).optional()},
  annotations:{readOnlyHint:true,openWorldHint:false,destructiveHint:false},
  view:{component:"create-goal-plan",description:"X1 Goal-to-Completion visual pipeline"}
 },async({goal,steps})=>({structuredContent:makePlan(goal,steps),
  content:[{type:"text",text:"Goal planned. Open the view for status, local preview generation, system health and handoff."}]}))
 .registerTool({
  name:"review_goal_evidence",
  description:"Checks evidence completeness only. Independent QA is always NOT_RUN in this tool.",
  inputSchema:{
    goal:z.string().trim().min(3).max(500),
    steps:z.array(z.object({title:z.string().trim().min(3).max(120),acceptance:z.string().trim().min(3).max(600),status:z.enum(["todo","doing","review"]),evidence:z.string().max(2000).optional()})).min(1).max(12)
  },
  annotations:{readOnlyHint:true,openWorldHint:false,destructiveHint:false}
 },async({goal,steps})=>({structuredContent:reviewEvidence(goal,steps),content:[{type:"text" as const,text:"Evidence completeness only; not independently verified."}]}))
 .registerTool({
  name:"inspect_x1_systems",
  description:"Inspect actual local X1 control plane, Ollama, Docker and JARVIS worker status. Cloud tools show unconfigured without server-side credentials. Read-only.",
  inputSchema:{},
  annotations:{readOnlyHint:true,openWorldHint:false,destructiveHint:false},
  view:{component:"inspect-x1-systems",description:"Live local infrastructure and cloud connection-readiness"}
 },async()=>({structuredContent:await getSystemSnapshot(),content:[{type:"text" as const,text:"Local health probes performed; cloud connectors need dedicated server authentication."}]}))
 .registerTool({
  name:"inspect_x1_jobs",
  description:"Read recent local worker jobs from existing mirrored receipts and state. No queue dispatch or new scheduling.",
  inputSchema:{},
  annotations:{readOnlyHint:true,openWorldHint:false,destructiveHint:false}
 },async()=>({structuredContent:await getLocalJobs(),content:[{type:"text" as const,text:"Existing local worker mirror read without dispatching jobs."}]}))
 .registerTool({
  name:"build_site_preview",
  description:"Create a deterministic isolated HTML website or mini-app preview locally, without deploying, external network calls or spending. Explicitly for a user-requested preview.",
  inputSchema:{goal:z.string().trim().min(3).max(500),title:z.string().trim().min(3).max(100),kind:z.enum(["website","app"])},
  annotations:{readOnlyHint:false,openWorldHint:false,destructiveHint:false},
  view:{component:"build-site-preview",description:"Isolated visual preview, file receipt and static checks"}
 },async({goal,title,kind})=>({structuredContent:await createCandidate(goal,title,kind),
  content:[{type:"text",text:"Local-only candidate created. This is not a deployed product, live lead funnel or full-stack app."}]}))
 .registerTool({
  name:"validate_site_preview",
  description:"Run deterministic static HTML checks against an isolated local candidate. Does not replace browser, security or Guardian review.",
  inputSchema:{candidateId:z.string().regex(/^[a-f0-9]{16}$/)},
  annotations:{readOnlyHint:true,openWorldHint:false,destructiveHint:false}
 },async({candidateId})=>({structuredContent:await validateCandidate(candidateId),content:[{type:"text" as const,text:"Static checks executed. No browser or independent QA certification."}]}))
 .registerTool({
  name:"inspect_readonly_worker_probe",
  description:"Read the state/receipt of a deterministic local JARVIS read-only probe previously submitted by the trusted backend. Never dispatches jobs.",
  inputSchema:{requestId:z.string().regex(/^[A-Za-z0-9._-]{6,64}$/)},
  annotations:{readOnlyHint:true,openWorldHint:false,destructiveHint:false}
 },async({requestId})=>({
   structuredContent:await inspectProbeJob(requestId),
   content:[{type:"text" as const,text:"Read-only local receipt inspection. A completed probe is not a production build receipt."}]
 }))
 .registerTool({
  name:"plan_cloud_action",
  description:"Create an auditable provider task packet for GitHub, Vercel, Supabase or Railway. This read-only step does not execute the provider operation; use explicit authenticated MCP connectors for the execution.",
  inputSchema:{provider:z.enum(["github","vercel","supabase","railway"]),intent:z.string().trim().min(3).max(240),environment:z.enum(["sandbox","preview","production"]).default("preview")},
  annotations:{readOnlyHint:true,openWorldHint:false,destructiveHint:false}
 },async({provider,intent,environment})=>({
  structuredContent:{
    provider,intent,environment,
    action:"PROPOSED_ONLY",
    dispatch:"NOT_PERFORMED",
    steps:["Resolve connected provider account/project ID","Verify exact source SHA, tenant, budget and current release","Use provider MCP with explicit authorization and scoped credentials","Capture provider response, receipt and read-back","Independently validate preview before release"],
    approvalRequired:environment==="production",
    note:"ChatGPT MCP connector credentials are not transferred to Skybridge server."
  },content:[{type:"text" as const,text:"Planning only; no external provider action dispatched."}]
 }))
});
export type AppType=typeof app;