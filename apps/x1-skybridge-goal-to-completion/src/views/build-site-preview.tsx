import { useCallTool, useToolInfo } from "../helpers.js";
import "../index.css";
import "../candidate.css";

export default function BuildSitePreview(){
 const {output,isPending}=useToolInfo<"build_site_preview">();
 const {callTool,data:validation,isPending:validating}=useCallTool("validate_site_preview");
 if(isPending||!output) return <main className="shell">Creating isolated candidate...</main>;
 const isApp=output.kind==="app";
 return <main className="shell" data-llm={`Local ${output.kind} concept generated: ${output.title}. Candidate ${output.candidateId}. Not deployed; QA not run.`}>
  <header className="top"><div><div className="eyebrow">X1 / LOCAL PREVIEW CANDIDATE</div><h1>{output.title}</h1><p className="sub">ID: {output.candidateId} · {output.bytes} bytes</p></div><span className="qa">NOT PUBLISHED</span></header>
  <div className="candidate-visual">
   <div className="candidate-nav"><strong>{output.title.slice(0,38)}<span>.</span></strong><span>Explore ↗</span></div>
   <div className="candidate-body">
    <p className="kicker">BUILT IN X1 LOCAL SANDBOX</p>
    <h2>{isApp?"Calculate. Compare. Decide.":"Built to stand out. Designed to convert."}</h2>
    <p>{output.goal}</p><span className="candidate-cta">{isApp?"Open calculator":"Explore our approach"} →</span>
    <div className="candidate-labels"><span>Preview only</span><span>Not published</span><span>QA pending</span></div>
   </div>
  </div>
  <div className="reviewbox"><strong>Source location</strong><p><code>{output.localPath}</code></p>
   <p>SHA-256: <code>{output.sha256}</code></p>
   <p>Visual concept representation; the generated HTML requires a separate browser QA before release.</p>
  </div>
  <div className="actions"><button className="primary" onClick={()=>callTool({candidateId:output.candidateId})} disabled={validating}>{validating?"Checking…":"Run static validation"}</button></div>
  {validation?.structuredContent && <div className="reviewbox" role="status"><strong>Static checks</strong><p>{validation.structuredContent.passed} passed, {validation.structuredContent.failed} failed. Independent QA: NOT RUN. Deployment: NOT AUTHORIZED.</p></div>}
 </main>;
}