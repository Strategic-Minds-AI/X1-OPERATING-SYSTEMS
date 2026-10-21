import React,{useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {Activity,ArrowLeft,ArrowRight,Check,ChevronRight,Clock,Cloud,Command,KeyRound,LockKeyhole,MessageCircle,RefreshCw,Send,ShieldCheck,Sparkles,SquareTerminal,Workflow,X} from 'lucide-react';
import './BrandTheme.css';
import './VisualStudio.css';
import './X1AgentConsole.css';

const DEFAULT_MESSAGE={
  role:'assistant',
  content:'X1 Command Agent is ready to authenticate against the existing Staging control plane. Messages sync to your tenant only. GPT is enabled only after a verified server-side Gateway binding; no command can bypass approval gates.',
  status:'SYSTEM_GUIDANCE'
};
const QUICK=[
 'Give me the latest X1 queue and worker health.',
 'Summarize recent verified agent outputs and required approvals.',
 'Build preview: Make a premium epoxy garage floor instant estimate website for Pompano Beach FL'
];
const asError=async(r)=>{
  let body={};try{body=await r.json();}catch{}
  const reason=String(body.reason||body.error_description||body.msg||body.error||r.status);
  throw new Error(reason.replace(/_/g,' ').slice(0,200));
};
function Tag({children,good=false}){return <span className={'x1-agent-tag'+(good?' good':'')}>{children}</span>;}
function QueueMeter({sample}){
 const data=sample?.counts||{};
 return <div className="x1-agent-meter">{['PENDING','LEASED','COMPLETED','BLOCKED','DEAD_LETTER'].map(key=><div key={key}><span>{key.replace('_',' ')}</span><b>{typeof data[key]==='number'?data[key]:'–'}</b></div>)}<small>Bounded tenant snapshot, up to {sample?.limit||200} entries</small></div>;
}
export default function X1AgentConsole(){
 const [config,setConfig]=useState(null);
 const [loadingConfig,setLoadingConfig]=useState(true);
 const [email,setEmail]=useState('');
 const [otp,setOtp]=useState('');
 const [phase,setPhase]=useState('email');
 const [token,setToken]=useState('');
 const [tenantId,setTenantId]=useState('');
 const [sessionId,setSessionId]=useState(()=>crypto.randomUUID());
 const [messages,setMessages]=useState([DEFAULT_MESSAGE]);
 const [draft,setDraft]=useState('');
 const [events,setEvents]=useState([]);
 const [sessions,setSessions]=useState([]);
 const [queue,setQueue]=useState(null);
 const [syncState,setSyncState]=useState('UNBOUND');
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState('');
 const bottom=useRef(null);
 const configured=config?.status==='STAGING_CONFIGURED_NOT_AUTHENTICATED';
 const gpt=config?.gpt==='CONFIGURED_NOT_VALIDATED';
 const ollamaReady=config?.ollama==='CONFIGURED_NOT_VALIDATED';
 const dispatchReady=config?.dispatch==='PREVIEW_BUILD_READY';
 const hdr=(key)=>({authorization:'Bearer '+token,...(tenantId?{'X-X1-Tenant-ID':tenantId}:{}) ,[key]:'application/json'});
 async function reloadConfig(){
   setLoadingConfig(true);
   try{
     const r=await fetch('/api/x1/agent-config',{cache:'no-store'});
     const data=await r.json();setConfig(data);setSyncState(r.ok?'READY_FOR_AUTH':'UNBOUND');
   }catch{setConfig({status:'UNBOUND',reason:'CONFIG_UNAVAILABLE'});setSyncState('UNBOUND');}
   finally{setLoadingConfig(false);}
 }
 useEffect(()=>{reloadConfig();},[]);
 useEffect(()=>{bottom.current?.scrollIntoView({behavior:'smooth',block:'end'});},[messages.length]);
 async function sendCode(e){
   e.preventDefault();setNotice('');
   if(!configured)return;
   setBusy(true);
   try{
     const r=await fetch(config.authOrigin+'/auth/v1/otp',{method:'POST',
       headers:{apikey:config.publicAnonKey,'content-type':'application/json'},
       body:JSON.stringify({email:email.trim(),create_user:false})});
     if(!r.ok)await asError(r);
     setPhase('code');setNotice('Sign-in email requested. Enter its one-time code; existing accounts only.');
   }catch(err){setNotice('Sign-in blocked: '+err.message);}
   finally{setBusy(false);}
 }
 async function verifyCode(e){
   e.preventDefault();setNotice('');
   if(!configured)return;
   setBusy(true);
   try{
     const r=await fetch(config.authOrigin+'/auth/v1/verify',{method:'POST',
       headers:{apikey:config.publicAnonKey,'content-type':'application/json'},
       body:JSON.stringify({email:email.trim(),token:otp.trim(),type:'email'})});
     if(!r.ok)await asError(r);
     const data=await r.json();
     if(!data.access_token)throw new Error('No access token returned');
     setToken(data.access_token);setPhase('authenticated');setNotice('Identity verified. Syncing X1 tenant access...');
     await refresh(data.access_token);
   }catch(err){setNotice('Verification blocked: '+err.message);}
   finally{setBusy(false);}
 }
 async function loadSessions(authToken=token,selectedTenant=tenantId){
   if(!authToken)return;
   const headers={authorization:'Bearer '+authToken,...(selectedTenant?{'X-X1-Tenant-ID':selectedTenant}:{})};
   const r=await fetch('/api/x1/agent-sessions',{headers,cache:'no-store'});
   if(!r.ok)await asError(r);
   const data=await r.json();
   setSessions(Array.isArray(data.sessions)?data.sessions:[]);
 }
 async function refresh(authToken=token,selectedTenant=tenantId,chosenSession=sessionId){
   if(!authToken||!configured)return;
   setSyncState('SYNCING');
   try{
     const headers={authorization:'Bearer '+authToken,...(selectedTenant?{'X-X1-Tenant-ID':selectedTenant}:{})};
     const r=await fetch('/api/x1/agent-chat?session_id='+encodeURIComponent(chosenSession),{
       headers,cache:'no-store'});
     if(!r.ok)await asError(r);
     const data=await r.json();
     setEvents(data.events||[]);setQueue(data.queue);
     if(data.turns?.length)setMessages([DEFAULT_MESSAGE,...data.turns.map(t=>({
       role:t.role,content:t.content,status:t.status,model:t.model,created_at:t.created_at
     }))]);else setMessages([DEFAULT_MESSAGE]);
     await loadSessions(authToken,selectedTenant);
     setSyncState('SYNC_READ_VERIFIED');setNotice('Synced from X1 Staging with your verified tenant identity.');
   }catch(err){setSyncState('BLOCKED');setNotice('Sync blocked: '+err.message);}
 }
 async function send(e){
   e?.preventDefault?.();
   const text=draft.trim();if(!text||busy||!token)return;
   setBusy(true);setNotice('Submitting through X1 tenant-authenticated bridge...');
   const id=crypto.randomUUID();
   setMessages(prev=>[...prev,{role:'user',content:text,status:'SENDING'}]);setDraft('');
   try{
     const r=await fetch('/api/x1/agent-chat',{method:'POST',
       headers:hdr('content-type'),
       body:JSON.stringify({session_id:sessionId,request_id:id,message:text})});
     if(!r.ok)await asError(r);
     const data=await r.json();
     setMessages(prev=>[...prev.slice(0,-1),{role:'user',content:text,status:'ACCEPTED'},
       {role:'assistant',content:data.response,status:data.mode,model:data.model,receipt:data.receipt}]);
     setEvents(data.events||[]);setQueue(data.queue);setSyncState('SYNC_WRITTEN');
     await loadSessions();
     setNotice(data.dispatch==='QUEUED_NOT_DEPLOYED'
       ? 'Your X1 preview work was queued and verified. It is NOT deployed yet. Watch the proof dashboard for an independently validated URL.'
       : ['GPT_PREVIEW_DRAFT','OLLAMA_PREVIEW_DRAFT'].includes(data.mode)
       ? 'GPT response and tenant transcript persisted. No execution was started.'
       : 'X1 status response and conversation persisted. GPT provider is not enabled.');
   }catch(err){
     setMessages(prev=>[...prev,{role:'assistant',
       content:'Request not confirmed. '+err.message+'. Use Sync now before retrying to avoid duplicate model charges.',
       status:'BLOCKED'}]);
     setNotice('No unverified deployment was claimed. Sync the conversation before retrying.');
   }finally{setBusy(false);}
 }
 function logout(){
   setToken('');setMessages([DEFAULT_MESSAGE]);setEvents([]);setQueue(null);
   setSessions([]);setPhase('email');setOtp('');setSyncState('READY_FOR_AUTH');setNotice('Session ended.');
 }
 function newChat(){const next=crypto.randomUUID();setSessionId(next);setMessages([DEFAULT_MESSAGE]);setDraft('');setNotice('New tenant-scoped conversation created locally. Existing transcripts remain in X1 Staging.');}
 function openConversation(id){
   if(busy || !token)return;
   setSessionId(id);setMessages([DEFAULT_MESSAGE]);setDraft('');
   void refresh(token,tenantId,id);
 }
 return <div className="x1-studio x1-agent-app">
  <a className="x1-skip" href="#x1-agent-main">Skip to X1 assistant</a>
  <aside className="x1-rail" aria-label="X1 navigation">
   <Link to="/v2/b" className="x1-smark" aria-label="Strategic Minds AI home"><img src="/v2-assets/silver-emblem.png" alt=""/></Link>
   <div className="x1-rail-divider"/>
   <Link to="/admin/studio" title="Visual Studio"><SquareTerminal size={21}/></Link>
   <Link className="active" to="/admin/agent" title="X1 Command Agent"><MessageCircle size={21}/></Link>
   <Link to="/portal" title="Client portal"><Workflow size={20}/></Link>
   <div className="x1-rail-spacer"/>
   <Link to="/v2/b" title="Return home"><ArrowLeft size={21}/></Link>
  </aside>
  <main className="x1-studio-main" id="x1-agent-main">
   <header className="x1-topbar">
    <div className="x1-top-left"><div className="x1-studio-label">STRATEGIC MINDS <b>AI</b> <span>/</span> X1 COMMAND AGENT</div><Tag good={syncState==='SYNC_READ_VERIFIED'||syncState==='SYNC_WRITTEN'}>{syncState.replaceAll('_',' ')}</Tag></div>
    <div className="x1-top-actions"><Link to="/admin/studio" className="x1-agent-link"><ArrowLeft size={15}/> VISUAL STUDIO</Link><button className="x1-night" type="button" onClick={newChat}>NEW CONVERSATION</button>{token&&<button className="x1-night" onClick={logout}>LOG OUT</button>}</div>
   </header>
   <div className="x1-agent-intro"><div><span><Sparkles size={15}/> ADMIN INTELLIGENCE · TENANT BOUND</span><h1>Command X1. <em>See the evidence.</em></h1><p>Talk to the GPT-powered admin assistant and inspect verified X1 activity. Execution is approval-gated. Your ChatGPT.com private conversations are not imported.</p></div><div className="x1-agent-intro-mark"><img src="/v2-assets/silver-emblem.png" alt="Strategic Minds AI emblem"/></div></div>
   <div className="x1-agent-layout">
    <section className="x1-agent-chat" aria-label="Admin chat">
     <div className="x1-agent-section-head"><div><MessageCircle size={19}/><strong>X1 CONVERSATION</strong></div><Tag good={gpt||ollamaReady}>{ollamaReady?'OLLAMA TUNNEL CONFIGURED':gpt?'GPT GATEWAY CONFIGURED':'X1 SYNC-ONLY MODE'}</Tag></div>
     {!configured?<div className="x1-agent-auth"><LockKeyhole size={28}/><h2>Staging bridge not configured</h2><p>Admin commands are locked until the Vercel Preview service has verified X1 Staging bindings. This is not a production failure.</p><code>{loadingConfig?'CHECKING...':config?.reason||'MISSING_STAGING_BINDING'}</code><button type="button" onClick={reloadConfig} disabled={loadingConfig}><RefreshCw size={16}/> RETRY CONNECTION CHECK</button></div>
     :!token?<div className="x1-agent-auth"><KeyRound size={28}/><h2>Operator sign-in</h2><p>Use an existing X1 Staging Supabase Auth account with an active OWNER or ADMIN membership. No accounts or permissions are provisioned here.</p><form onSubmit={phase==='code'?verifyCode:sendCode}>
       <label htmlFor="x1-agent-email">Admin email</label><input id="x1-agent-email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required/>
       {phase==='code'&&<><label htmlFor="x1-agent-code">One-time email code</label><input id="x1-agent-code" inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={e=>setOtp(e.target.value)} required/></>}
       <button type="submit" disabled={busy}>{busy?'PLEASE WAIT':phase==='code'?'VERIFY AND CONNECT':'SEND SIGN-IN CODE'} <ArrowRight size={16}/></button>
      </form><p className="x1-agent-footnote">Only the public Supabase anon key is sent to the browser. Service credentials and AI Gateway tokens remain server-side.</p></div>
     :<><div className="x1-agent-transcript" role="log" aria-live="polite" aria-label="X1 synchronized conversation">
       {messages.map((m,i)=><article key={i} className={'x1-agent-turn '+(m.role==='user'?'user':'assistant')}>
        <div className="x1-agent-avatar">{m.role==='assistant'?<Sparkles size={15}/>:<Command size={15}/>}</div><div className="x1-agent-turn-body"><small>{m.role==='assistant'?'X1 AGENT':'YOU'} <span>{m.model||m.status}</span></small><p>{m.content}</p></div>
       </article>)}
       <div ref={bottom}/>
      </div><div className="x1-agent-suggestions">{QUICK.map(s=><button type="button" key={s} onClick={()=>setDraft(s)}>{s}<ChevronRight size={14}/></button>)}</div>
      <form onSubmit={send} className="x1-agent-composer"><label htmlFor="x1-agent-prompt">Message your X1 agent</label><textarea id="x1-agent-prompt" rows={3} maxLength={2400} value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send(e);}}} placeholder="Ask for status or type: Build preview: a premium epoxy flooring website..."/><div><span><ShieldCheck size={14}/> {dispatchReady?'PREVIEW BUILDS ENABLED · NO PRODUCTION RELEASE':'DRAFT / READ-ONLY · NO AUTO-EXECUTION'}</span><button type="submit" disabled={busy||!draft.trim()}><Send size={16}/> {busy?'SYNCING':'SEND'}</button></div></form>
     </>}
     {notice&&<p className="x1-agent-notice" role="status">{notice}</p>}
    </section>
    <aside className="x1-agent-evidence">
     <div className="x1-agent-section-head"><div><Activity size={18}/><strong>LIVE X1 EVIDENCE</strong></div><button type="button" aria-label="Sync X1 now" onClick={()=>refresh()} disabled={!token||busy}><RefreshCw size={17}/></button></div>
     {token&&<div className="x1-agent-tenant"><label htmlFor="x1-agent-tenant">SELECT AN AUTHORIZED TENANT</label><input id="x1-agent-tenant" placeholder="Tenant UUID (optional for single tenant)" value={tenantId} onChange={e=>setTenantId(e.target.value)}/><button onClick={()=>refresh(token,tenantId)} type="button">VERIFY SCOPE</button></div>}
     {token&&<div className="x1-agent-evidence-block x1-agent-sessions"><h3><MessageCircle size={16}/> RECENT CONVERSATIONS</h3>{sessions.length?sessions.map(s=><button type="button" key={s.session_id} className={'x1-agent-session'+(s.session_id===sessionId?' selected':'')} disabled={busy} onClick={()=>openConversation(s.session_id)} title="Open this tenant-scoped conversation"><strong>{s.preview||'X1 conversation'}</strong><small>{s.updated_at?new Date(s.updated_at).toLocaleString():''}</small></button>):<p>No conversations saved for this operator yet. Your messages will appear here after synchronization.</p>}</div>}
     <div className="x1-agent-evidence-block"><h3><Cloud size={16}/> WORKER QUEUE</h3>{queue?<QueueMeter sample={queue}/>:<p>Authenticate to inspect verified tenant-scoped queue data. There are no synthetic live metrics.</p>}</div>
     <div className="x1-agent-evidence-block"><h3><Clock size={16}/> DURABLE OUTPUT EVENTS</h3>{events.length?events.map((e,i)=><div className="x1-agent-event" key={e.event_id||i}><strong>{e.event_type}</strong><p>{e.summary||'Output event recorded'}</p><small>{e.trust_state} · {e.status}</small></div>):<p>Recent events appear here after authenticated synchronization. No event history is fabricated.</p>}</div>
     <div className="x1-agent-evidence-block x1-agent-protection"><LockKeyhole size={19}/><div><b>OPERATOR APPROVAL GATE</b><p>Production releases, destructive changes, credentials, customer communications and paid provisioning remain protected. GPT can prepare proposals but cannot bypass your approvals.</p></div></div>
    </aside>
   </div>
  </main>
 </div>;
}
