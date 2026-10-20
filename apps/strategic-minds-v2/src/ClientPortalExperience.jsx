import React,{useCallback,useEffect,useState} from "react";
import {Link} from "react-router-dom";
import {Activity,ArrowRight,BarChart3,CheckCircle2,FolderOpen,KeyRound,LockKeyhole,RefreshCw,ShieldCheck,Workflow,LogOut} from "lucide-react";
import "./CommercePortal.css";

// Real authenticated X1 account workspace: no generated customer projects,
// fabricated leads, simulated billing, or client-side approvals.
const METRICS=["PENDING","LEASED","COMPLETED","FAILED","BLOCKED","DEAD_LETTER"];
async function unpack(response){
 const data=await response.json().catch(()=>({status:"BLOCKED",reason:"INVALID_RESPONSE"}));
 if(!response.ok)throw new Error(data.reason||data.error||("HTTP_"+response.status));
 return data;
}
export default function ClientPortalExperience(){
 const [config,setConfig]=useState(null),[email,setEmail]=useState(""),[otp,setOtp]=useState(""),[step,setStep]=useState("email");
 const [token,setToken]=useState(""),[tenant,setTenant]=useState(""),[operator,setOperator]=useState(null);
 const [work,setWork]=useState([]),[busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[loaded,setLoaded]=useState(false);
 const [tab,setTab]=useState("overview");
 useEffect(()=>{let active=true;fetch("/api/x1/agent-config",{cache:"no-store"}).then(unpack).then(d=>{if(active)setConfig(d)}).catch(e=>{if(active){setConfig({status:"UNBOUND"});setNotice("X1 connection unavailable: "+e.message)}});return()=>{active=false}},[]);
 const configured=config?.status==="STAGING_CONFIGURED_NOT_AUTHENTICATED";
 const sync=useCallback(async(access,scope="")=>{
   const headers={Authorization:"Bearer "+access,...(scope?{"X-X1-Tenant-ID":scope}:{})};
   const [op,items]=await Promise.all([
     unpack(await fetch("/api/x1/operator-status",{headers,cache:"no-store"})),
     unpack(await fetch("/api/x1/work-items",{headers,cache:"no-store"}))
   ]);
   if(op.status!=="STAGING_READ_VERIFIED"||items.tenant_id!==op.tenant_id)
     throw new Error("TENANT_SCOPE_UNVERIFIED");
   setOperator(op);setWork(Array.isArray(items.items)?items.items:[]);setLoaded(true);setNotice("");
 },[]);
 async function requestCode(e){
  e.preventDefault();if(!configured)return;
  setBusy(true);setNotice("");
  try{await unpack(await fetch(config.authOrigin+"/auth/v1/otp",{method:"POST",headers:{apikey:config.publicAnonKey,"content-type":"application/json"},body:JSON.stringify({email:email.trim(),create_user:false})}));setStep("code");setNotice("Sign-in code requested. Check your email.");}
  catch(e){setNotice("Sign-in unavailable: "+e.message)}finally{setBusy(false)}
 }
 async function verifyCode(e){
  e.preventDefault();setBusy(true);setNotice("");
  try{
   const credentials=await unpack(await fetch(config.authOrigin+"/auth/v1/verify",{method:"POST",headers:{apikey:config.publicAnonKey,"content-type":"application/json"},body:JSON.stringify({email:email.trim(),token:otp.trim(),type:"email"})}));
   if(!credentials.access_token)throw new Error("ACCESS_TOKEN_MISSING");
   await sync(credentials.access_token,tenant);setToken(credentials.access_token);setStep("authenticated");setOtp("");
  }catch(e){setNotice("Account access unavailable: "+e.message)}finally{setBusy(false)}
 }
 function signOut(){setToken("");setOperator(null);setWork([]);setLoaded(false);setStep("email");setNotice("Signed out.");}
 const counts=operator?.sample?.counts||{};
 return <div className="cp-site cp-gateway" style={{minHeight:"100vh",background:"#02050d",color:"#f6fbff"}}>
  <a className="cp-skip" href="#x1-workspace">Skip to content</a>
  <header className="cp-public-nav">
   <Link className="cp-brand" to="/v2/b"><span className="cp-brand-mark"><img src="/v2-assets/silver-emblem.png" alt="Strategic Minds AI emblem"/></span><span>STRATEGIC MINDS <b>AI</b><small>X1 SECURE WORKSPACE</small></span></Link>
   <nav aria-label="Workspace navigation"><Link to="/v2/b">HOME</Link><Link to="/pricing">PRICING</Link><Link to="/admin/agent">X1 AGENT</Link></nav>
  </header>
  <main id="x1-workspace" style={{maxWidth:1200,margin:"auto",padding:"clamp(36px,5vw,74px) 22px"}}>
   <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:15}}><ShieldCheck color="#66ff9c" size={28}/><span style={{letterSpacing:".16em",color:"#9bbdd0",fontSize:12}}>STRATEGIC MINDS AI · AUTHENTICATED ACCESS</span></div>
   <h1 style={{fontSize:"clamp(38px,5vw,66px)",margin:"8px 0 15px",letterSpacing:"-.045em"}}>Your X1 workspace.</h1>
   <p style={{color:"#9bbdd0",maxWidth:690,lineHeight:1.7}}>Connect to your authorized account to view real work items and operating status. All information comes from your tenant in X1, not placeholder records.</p>
   {!token?<section className="cp-gateway-card" style={{margin:"32px 0",maxWidth:550,padding:28,border:"1px solid #23445b",background:"#061726",borderRadius:20}}>
     <div style={{display:"flex",gap:12,alignItems:"center"}}><LockKeyhole color="#66ff9c"/><h2 style={{margin:0}}>Secure account sign-in</h2></div>
     {!configured?<div role="status" style={{marginTop:18,color:"#9bbdd0"}}> {config===null?"Connecting to X1…":"X1 authentication is not available on this deployment."} <button type="button" style={{display:"block",marginTop:12}} onClick={()=>window.location.reload()}>Retry connection</button></div>
     :<form onSubmit={step==="code"?verifyCode:requestCode} style={{display:"grid",gap:13,marginTop:23}}>
       <label htmlFor="x1-portal-email">Account email</label><input id="x1-portal-email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} disabled={step==="code"} style={{padding:13,borderRadius:9,color:"#061726"}}/>
       {step==="code"&&<><label htmlFor="x1-portal-code">One-time email code</label><input id="x1-portal-code" autoComplete="one-time-code" required inputMode="numeric" value={otp} onChange={e=>setOtp(e.target.value)} style={{padding:13,borderRadius:9,color:"#061726"}}/></>}
       <button type="submit" disabled={busy} className="cp-green-button">{busy?"Verifying…":step==="code"?"VERIFY AND OPEN WORKSPACE":"EMAIL SIGN-IN CODE"} <ArrowRight size={16}/></button>
       {step==="code"&&<button type="button" onClick={()=>{setStep("email");setOtp("");}} style={{color:"#9bbdd0"}}>Use a different email</button>}
     </form>}
     <p style={{fontSize:12,color:"#9bbdd0",marginTop:20}}>Access requires an active X1 tenant membership. We never ask you to paste service credentials. Request account provisioning from <a href="mailto:jeremy@strategicmindsai.com?subject=X1%20Workspace%20Access" style={{color:"#66ff9c"}}>Strategic Minds AI</a>.</p>
   </section>
   :<section style={{marginTop:26}}>
     <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:15}}>
      <div><strong>Authorized tenant</strong><p style={{marginTop:5,color:"#9bbdd0"}}>{operator?.tenant_id} · {operator?.role}</p></div>
      <button type="button" className="cp-portal-light-button" onClick={async()=>{setBusy(true);try{await sync(token,tenant)}catch(e){setNotice("Refresh failed: "+e.message)}finally{setBusy(false)}}} disabled={busy}><RefreshCw size={16}/> Refresh real data</button>
      <button type="button" className="cp-portal-light-button" onClick={signOut}><LogOut size={16}/> Sign out</button>
     </div>
     <div style={{marginTop:25,display:"flex",flexWrap:"wrap",gap:10}} role="tablist" aria-label="Workspace views">
      {[["overview","Overview"],["projects","Work items"],["support","Support"]].map(([id,label])=><button type="button" role="tab" aria-selected={tab===id} onClick={()=>setTab(id)} className={tab===id?"cp-green-button":"cp-portal-light-button"} key={id}>{label}</button>)}
     </div>
     {tab==="overview"&&<><div className="cp-metrics" style={{marginTop:20}}>
      {[["Pending",counts.PENDING,Workflow],["Completed",counts.COMPLETED,CheckCircle2],["Needs attention",(counts.BLOCKED||0)+(counts.FAILED||0)+(counts.DEAD_LETTER||0),Activity]].map(([label,value,Icon])=><div key={label} className="cp-metric" style={{minWidth:180}}><div className="cp-metric-top"><span>{label}</span><Icon size={19}/></div><strong>{typeof value==="number"?value:"–"}</strong><small>Verified tenant queue sample</small></div>)}
     </div><p style={{color:"#9bbdd0",marginTop:15}}>These are the most recent {operator?.sample?.limit||200} work-item samples, not estimated totals. {operator?.sample?.truncated?"Additional rows exist.":""}</p></>}
     {tab==="projects"&&<div style={{display:"grid",gap:12,marginTop:20}}>
      {work.length===0?<div className="cp-portal-panel" style={{padding:25}}>No work items are associated with this tenant. There are no sample projects or fabricated milestones.</div>
       :work.map((item,i)=><article className="cp-portal-panel" key={item.id||i} style={{padding:20}}><div style={{display:"flex",justifyContent:"space-between",gap:12}}><h3 style={{margin:0}}>{item.title||"Untitled work"}</h3><span>{item.status}</span></div><p style={{color:"#9bbdd0"}}>{item.description||"No description recorded"}</p><small>Last updated {item.updatedAt||"not recorded"} · {item.category||"General"}</small></article>)}
     </div>}
     {tab==="support"&&<div className="cp-portal-panel" style={{padding:25,marginTop:20}}><h2>Support</h2><p>For project access, account changes and billing questions, contact our team directly.</p><a href="mailto:jeremy@strategicmindsai.com?subject=X1%20Account%20Support" className="cp-green-button">EMAIL SUPPORT <ArrowRight size={16}/></a></div>}
   </section>}
   {notice&&<p role="status" style={{marginTop:20,color:"#9bbdd0"}}>{notice}</p>}
   <footer style={{marginTop:65,borderTop:"1px solid #23445b",paddingTop:18,color:"#9bbdd0",fontSize:12}}>STRATEGIC MINDS AI · PROTECTED TENANT ACCESS · {loaded?"LIVE TENANT READBACK":"SIGN-IN REQUIRED"}</footer>
  </main>
 </div>;
}
