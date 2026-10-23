import React,{useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowLeft,ArrowRight,CheckCircle2,ChevronDown,ChevronUp,ExternalLink,LockKeyhole,RefreshCw,ShieldAlert,ShieldCheck,Sparkles} from 'lucide-react';
import {QUESTIONS,transformGoal,toQueuePacket,missionProgress} from './missionEngine.js';
import './MissionControl.css';
const TOOLS=[
 ['/admin/agent','X1 Agent Chat'],['/admin/studio','Visual Canvas'],
 ['/admin/launch-studio','Launch Studio'],['/admin/prompt-lab','Prompt Lab'],
 ['/admin/coding-kanban','Coding Board'],['/admin/intelligence','Intelligence']
];
async function json(response){let body={};try{body=await response.json();}catch{}
 if(!response.ok)throw new Error(String(body.reason||body.error||body.status||response.status).replaceAll('_',' ').slice(0,190));
 return body;}
export default function MissionControl(){
 const [goal,setGoal]=useState(''),[details,setDetails]=useState({}),[extra,setExtra]=useState(false);
 const [mission,setMission]=useState(null),[choice,setChoice]=useState('');
 const [cfg,setCfg]=useState(null),[email,setEmail]=useState(''),[otp,setOtp]=useState(''),[auth,setAuth]=useState('email'),[token,setToken]=useState(''),[tenant,setTenant]=useState('');
 const [items,setItems]=useState([]),[created,setCreated]=useState(''),[worker,setWorker]=useState(null);
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[error,setError]=useState('');
 const signed=auth==='ready'&&!!token,bound=cfg?.status==='STAGING_CONFIGURED_NOT_AUTHENTICATED';
 const current=useMemo(()=>items.find(x=>x.workPacketId===created||x.id===created)||null,[items,created]);
 const steps=useMemo(()=>missionProgress(current,!!mission),[current,mission]);
 const headers=(t=token,tid=tenant)=>({authorization:'Bearer '+t,...(tid?{'X-X1-Tenant-ID':tid}:{})});
 useEffect(()=>{let alive=true;fetch('/api/x1/agent-config',{cache:'no-store'}).then(r=>r.json()).then(x=>alive&&setCfg(x)).catch(()=>alive&&setCfg({status:'UNBOUND',reason:'CONFIG_UNAVAILABLE'}));return()=>{alive=false;};},[]);
 function plan(e){e.preventDefault();setError('');const v=transformGoal(goal,details);
  if(!v.ok){setError(v.error);return;}setMission(v);setCreated('');setChoice('');
  setNotice('Prompt transformed locally; no build, bill, post or deployment was started.');}
 async function otpSend(e){e.preventDefault();setBusy(true);setError('');try{
  if(!bound)throw Error(cfg?.reason||'Staging configuration missing');
  await json(await fetch(cfg.authOrigin+'/auth/v1/otp',{method:'POST',headers:{apikey:cfg.publicAnonKey,'content-type':'application/json'},body:JSON.stringify({email:email.trim(),create_user:false})}));
  setAuth('otp');setNotice('Existing-account sign-in code requested.');
 }catch(e){setError('Sign-in blocked: '+e.message);}finally{setBusy(false);}}
 async function reload(t=token,tid=tenant){
  const options={cache:'no-store',headers:headers(t,tid)};
  const [a,b]=await Promise.allSettled([
    fetch('/api/x1/work-items',options).then(json),fetch('/api/x1/worker-status',options).then(json)
  ]);
  if(a.status!=='fulfilled')throw a.reason;
  setItems(Array.isArray(a.value.items)?a.value.items:[]);
  if(a.value.tenant_id)setTenant(a.value.tenant_id);
  setWorker(b.status==='fulfilled'?b.value:{status:'UNKNOWN'});
  return a.value;
 }
 async function otpVerify(e){e.preventDefault();setBusy(true);setError('');try{
  const x=await json(await fetch(cfg.authOrigin+'/auth/v1/verify',{method:'POST',headers:{apikey:cfg.publicAnonKey,'content-type':'application/json'},body:JSON.stringify({email:email.trim(),token:otp.trim(),type:'email'})}));
  if(!x.access_token)throw Error('No access token provided');
  setToken(x.access_token);setAuth('ready');setOtp('');await reload(x.access_token,tenant);
  setNotice('Identity verified against the existing X1 staging tenant.');
 }catch(e){setError('Authentication blocked: '+e.message);}finally{setBusy(false);}}
 async function refresh(){setBusy(true);setError('');try{await reload();setNotice('Tenant queue read back. Guardian and release still require separate receipts.');}catch(e){setError(e.message);}finally{setBusy(false);}}
 async function submit(){
  if(!signed||!mission||busy||created)return;
  setBusy(true);setError('');
  try{
   const result=await json(await fetch('/api/x1/work-items',{method:'POST',headers:{...headers(),'content-type':'application/json'},body:JSON.stringify(toQueuePacket(mission,choice))}));
   const identity=result.item?.workPacketId||result.item?.id;
   await reload();
   if(!identity)throw Error('Created task lacks readback identity; check Coding Board before retrying');
   setCreated(identity);
   setNotice('Verified: work item saved through the existing X1 enqueue API as a DRAFT, not executed.');
  }catch(e){setError('Cannot confirm safe queue submission: '+e.message+'. Check Coding Board before retrying to avoid duplicates.');}
  finally{setBusy(false);}
 }
 function logout(){setToken('');setTenant('');setAuth('email');setItems([]);setWorker(null);setCreated('');setNotice('Access token discarded from in-memory page state.');}
 return <div className="x1mc">
  <header className="x1mc-top"><Link to="/admin/agent"><ArrowLeft size={16}/> Existing X1 Admin</Link><strong>STRATEGIC MINDS AI / X1 MISSION CONTROL</strong><span><ShieldCheck size={17}/> STAGING-FIRST</span></header>
  <div className="x1mc-wrap">
   <div className="x1mc-hero"><p className="x1mc-over"><Sparkles size={17}/> X1 GOVERNED EXECUTION · WORKING IN YOUR EXISTING APP</p>
    <h1>One sentence.<br/><em>One company operating system.</em></h1>
    <p>Plan, capture, route, validate and monitor without another scheduler. Your public homepage and production infrastructure are untouched.</p>
    <div className="x1mc-chips"><span>{signed?'Authenticated':'Authentication required'}</span><span>{bound?'Staging connector configured':'Connector not verified'}</span><span>{current?'Queue row read back':'Local plan only'}</span></div>
   </div>
   <div className="x1mc-columns"><div className="x1mc-primary">
    <section className="x1mc-card"><div className="x1mc-h"><b>01</b><div><h2>Tell X1 the goal</h2><p>One sentence is enough to begin.</p></div></div>
     <form onSubmit={plan}><label htmlFor="mission-goal">Your idea, product or client goal</label><textarea id="mission-goal" rows={4} maxLength={700} required value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Build an AI-powered epoxy flooring lead-generation website with visual estimates, CRM, Stripe and Auto Social."/>
      <button type="button" className="x1mc-quiet" onClick={()=>setExtra(v=>!v)}>{extra?'Hide':'Open'} optional seven-question onboarding {extra?<ChevronUp size={15}/>:<ChevronDown size={15}/>}</button>
      {extra&&<div className="x1mc-answers">{QUESTIONS.map(([key,label],i)=><label key={key}>{i+1}. {label}<input maxLength={180} value={details[key]||''} onChange={e=>setDetails(v=>({...v,[key]:e.target.value}))}/></label>)}</div>}
      <button type="submit" className="x1mc-cta"><Sparkles size={17}/> Transform into executable work plan <ArrowRight size={17}/></button>
     </form>
    </section>
    {mission&&<>
     <section className="x1mc-card"><div className="x1mc-h"><b>02</b><div><h2>Ten design directions</h2><p>Choose a concept. These are design specifications, not rendered mockups.</p></div></div>
      <div className="x1mc-designs">{mission.concepts.map(d=><button type="button" key={d.id} className={choice===d.name?'chosen':''} onClick={()=>setChoice(d.name)} aria-pressed={choice===d.name}><i/><strong>{d.name}</strong><small>{d.palette}</small></button>)}</div>
      <p className="x1mc-muted">Render and edit the selected concept in your existing <Link to="/admin/launch-studio">Launch Studio</Link> and <Link to="/admin/studio">Visual Canvas</Link>.</p>
     </section>
     <section className="x1mc-card"><div className="x1mc-h"><b>03</b><div><h2>Prompt Transformer</h2><p>Inspectable, constrained task contract — not a pretend AI response.</p></div></div>
      <pre className="x1mc-prompt">{toQueuePacket(mission,choice).description}</pre>
      <button className="x1mc-secondary" type="button" onClick={()=>navigator.clipboard?.writeText(toQueuePacket(mission,choice).description)}>Copy transformed prompt</button>
     </section>
    </>}
    <section className="x1mc-card"><div className="x1mc-h"><b>04</b><div><h2>Send to the real X1 queue</h2><p>Reuses the authenticated staging endpoint already used by Coding Kanban.</p></div></div>
      {!bound&&<p className="x1mc-error"><ShieldAlert size={16}/> X1 staging adapter is not verified: {cfg?.reason||'checking environment'}</p>}
      {bound&&!signed&&<form onSubmit={auth==='email'?otpSend:otpVerify} className="x1mc-auth">
       {auth==='email'?<label>Existing account email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label>:<label>Sign-in code<input required autoComplete="one-time-code" value={otp} onChange={e=>setOtp(e.target.value)}/></label>}
       <button className="x1mc-secondary" disabled={busy}>{auth==='email'?'Request sign-in code':'Verify sign-in code'}</button>
      </form>}
      {signed&&<div className="x1mc-row"><label>Tenant ID, if multiple tenants<input value={tenant} onChange={e=>setTenant(e.target.value)} placeholder="Auto-selected for one tenant"/></label><button type="button" className="x1mc-secondary" onClick={refresh} disabled={busy}><RefreshCw size={15}/> Sync</button><button type="button" className="x1mc-quiet" onClick={logout}>Sign out</button></div>}
      <button type="button" onClick={submit} disabled={!signed||!mission||busy||!!created} className="x1mc-cta"><LockKeyhole size={16}/> {created?'Draft saved in X1 queue':'Submit safe draft — no production execution'}</button>
      {error&&<p role="alert" className="x1mc-error">{error}</p>}
      {notice&&<p role="status" className="x1mc-notice">{notice}</p>}
      {worker&&<p className="x1mc-muted">Worker reported: {worker.status||'UNKNOWN'}. Actual execution requires a separate receipt.</p>}
    </section>
   </div><aside className="x1mc-side">
    <section className="x1mc-card"><div className="x1mc-h"><b>05</b><div><h2>Execution timeline</h2><p>Only evidence-supported states are marked active.</p></div></div>
     <ol className="x1mc-timeline">{steps.map(x=><li key={x.id} className={x.status!=='NOT_RUN'?'active':''}><span>{x.status!=='NOT_RUN'?<CheckCircle2 size={16}/>:x.id==='guardian'?<ShieldCheck size={16}/>:null}</span><div><strong>{x.label}</strong><small>{x.agent}</small><code>{x.status.replaceAll('_',' ')}</code></div></li>)}</ol>
     {current&&<p className="x1mc-muted">Queue: {current.status} · task: {current.id}. Completion alone is NOT independent Guardian approval.</p>}
     <p className="x1mc-caution"><ShieldAlert size={15}/> No automatic publish, live charge, bulk posting or dead-letter replay.</p>
    </section>
    <section className="x1mc-card"><div className="x1mc-h"><b>06</b><div><h2>Existing connected workspaces</h2><p>No parallel replacement app.</p></div></div>
     <nav className="x1mc-tools">{TOOLS.map(([to,label])=><Link key={to} to={to}>{label}<ExternalLink size={14}/></Link>)}</nav>
    </section>
   </aside></div>
  </div>
 </div>;
}