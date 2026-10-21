// X1-owned converged capability catalog — metadata only, never credentials or live status.
// Visible route availability does NOT imply server adapter, authorization, or E2E validation.
export const CONVERGENCE_MODULES=Object.freeze([
 {id:"visual-x",name:"Visual X Editor",group:"Build",route:"/admin/visual-editor",state:"ROUTE_PRESENT",owner:"X1 Operating Systems",note:"X1 visual workspace exists; original Base44 tool parity unverified."},
 {id:"prompt-lab",name:"Prompt Lab",group:"Build",route:"/admin/prompt-lab",state:"ROUTE_PRESENT",owner:"X1 Operating Systems",note:"Native route exists; end-to-end prompt pipeline is not certified."},
 {id:"launch-studio",name:"Launch Studio",group:"Build",route:"/admin/launch-studio",state:"ROUTE_PRESENT",owner:"X1 Operating Systems",note:"Existing X1 launch designer route; full queue dispatch unverified."},
 {id:"template-designer",name:"Template Designer",group:"Build",route:"/admin/template-designer",state:"FEATURE_BRANCH_ONLY",owner:"X1 Launch Engine / Academy",note:"Template Designer candidate observed on a separate X1 feature branch, not main."},
 {id:"digital-dominance",name:"Digital Dominance",group:"Growth",route:"/admin/digital-dominance",state:"ADAPTER_REQUIRED",owner:"XTREME-SYSTEMS/digital-dominance",note:"MCP records readable in ChatGPT; X1 tenant-scoped adapter not validated."},
 {id:"seo-generator",name:"SEO Generator",group:"Growth",route:"/admin/seo-generator",state:"ADAPTER_REQUIRED",owner:"XTREME-SYSTEMS/seo-generator",note:"SEO app and connector records exist; native X1 API and route missing."},
 {id:"unlimited-websites",name:"Unlimited Websites",group:"Build",route:"/admin/website-factory",state:"ADAPTER_REQUIRED",owner:"Strategic-Minds-AI/x1-launch-engine",note:"Existing website engine is separate; use one X1 job identity and queue."},
 {id:"vision-cortex",name:"Vision Cortex",group:"Intelligence",route:"/admin/vision-cortex",state:"ADAPTER_REQUIRED",owner:"Vision Cortex MCP",note:"Existing capability matrix read; no validated native X1 adapter."},
 {id:"fault-line",name:"Fault Line / Guardian",group:"Assurance",route:"/admin/guardian",state:"ADAPTER_REQUIRED",owner:"Fault Line and X1 Guardian",note:"Independent validation must inspect exact source SHA and test artifacts."},
 {id:"windsor",name:"Windsor Analytics",group:"Intelligence",route:"/admin/analytics",state:"ADAPTER_REQUIRED",owner:"Windsor.ai",note:"ChatGPT can read GSC/GA4; X1 hosting does not inherit those grants."},
 {id:"x1-jobs",name:"X1 Agent Console",group:"Operate",route:"/admin/agent",state:"ROUTE_PRESENT",owner:"X1 staging control plane",note:"Authenticated task execution and lease/receipt proof required before auto-run."}
]);
export const KNOWN_STATES=Object.freeze(["ROUTE_PRESENT","FEATURE_BRANCH_ONLY","ADAPTER_REQUIRED","E2E_VERIFIED"]);
export function routeReady(item){return item.state==="ROUTE_PRESENT"||item.state==="E2E_VERIFIED";}
