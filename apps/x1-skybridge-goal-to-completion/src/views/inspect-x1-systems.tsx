import { useToolInfo } from "../helpers.js";
import { useDisplayMode } from "skybridge/web";
import "../index.css";

const labels: Record<string,string> = {
 ONLINE: "Service responding", UNAVAILABLE:"Unreachable", STALE_OR_UNKNOWN:"Heartbeat stale",
 REQUIRES_SERVER_AUTH:"Dedicated server credential required"
};
export default function InspectX1Systems(){
 const {output,isPending}=useToolInfo<"inspect_x1_systems">();
 const [mode,setMode]=useDisplayMode();
 if(isPending||!output) return <main className="shell"><p>Checking systems…</p></main>;
 const isFull=mode==="fullscreen";
 const locals=output.services.filter(s=>s.scope==="local");
 const clouds=output.services.filter(s=>s.scope==="cloud");
 return <main className="shell" data-llm={`X1 infrastructure status at ${output.observedAt}; local systems: ${locals.map(s=>s.name+': '+s.status).join(', ')}; clouds require separate server authorization`}>
  <header className="top"><div><div className="eyebrow">X1 / EXECUTION FABRIC</div><h1>Infrastructure readiness</h1><p className="sub">Observed {new Date(output.observedAt).toLocaleString()} · {output.host}</p></div><span className="qa">RELEASE GATED</span></header>
  <p className="sub" style={{marginTop:20}}>Live local probes — cloud entries reflect authentication readiness, not provider uptime.</p>
  <section className="steps" style={{marginTop:16}}>
   {[...locals,...clouds].map((s)=> <article className="step" key={s.name}>
      <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center"}}>
       <strong style={{fontSize:14}}>{s.name}</strong>
       <span className="phase">{s.status.replace(/_/g," ")}</span>
      </div>
      <p className="muted" style={{fontSize:12,margin:"9px 0 0"}}>{s.proof} · {labels[s.status] || "Not independently verified"}</p>
     </article>)}
  </section>
  {isFull && <section className="step" style={{marginTop:12}}>
    <h2>Existing worker status</h2>
    {output.workers.map(w=><p key={w.id} className="muted">{w.id}: {w.status} · {w.fresh?"fresh":"stale"} · {w.updatedAt}</p>)}
    <h2>Installed local models</h2><p className="muted">{output.localModelNames.join(" · ")||"Not available"}</p>
    <h2>Execution gates</h2><p className="muted">Local inference: {output.policy.localInference}. Cloud writes: {output.policy.cloudWrites}. No duplicate schedulers.</p>
  </section>}
  <div className="actions"><button className="primary" onClick={()=>setMode(isFull?"inline":"fullscreen")}>{isFull?"Compact view":"Inspect full details"}</button></div>
  <footer>Health probes are not functional end-to-end tests. No changes or external actions were performed.</footer>
 </main>;
}