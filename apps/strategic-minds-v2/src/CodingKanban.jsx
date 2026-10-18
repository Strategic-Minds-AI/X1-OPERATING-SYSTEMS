import React,{useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {Activity,ArrowRight,CheckCircle2,Clock,Columns3,FileText,LockKeyhole,Plus,RefreshCw,ShieldAlert,Sparkles,Terminal,Workflow} from 'lucide-react';
import './CodingKanban.css';

const LANES=[
 {id:'DRAFT',title:'Draft · awaiting worker',tone:'blue',icon:FileText,description:'Saved task drafts. No write-capable worker is enabled yet.'},
 {id:'PENDING',title:'Queued',tone:'blue',icon:Clock,description:'Awaiting an authorized worker lease'},
 {id:'LEASED',title:'In progress',tone:'violet',icon:Activity,description:'Claimed by a worker'},
 {id:'COMPLETED',title:'Completed',tone:'green',icon:CheckCircle2,description:'Worker reported completion; verify its receipt'},
 {id:'ATTENTION',title:'Needs attention',tone:'red',icon:ShieldAlert,description:'Failed, blocked or dead-lettered'}
];
const FAILURE=new Set(['FAILED','BLOCKED','DEAD_LETTER']);
async function readBody(response){
 let data={};try{data=await response.json();}catch{}
 if(!response.ok)throw new Error(String(data.reason||data.message||data.status||response.status).replaceAll('_',' ').slice(0,180));
 return data;
}
export default function CodingKanban(){
 const [config,setConfig]=useState(null),[configLoading,setConfigLoading]=useState(true);
 const [email,setEmail]=useState(''),[otp,setOtp]=useState(''),[authStep,setAuthStep]=useState('email');
 const [token,setToken]=useState(''),[tenantId,setTenantId]=useState('');
 const [items,setItems]=useState([]),[loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[workerStatus,setWorkerStatus]=useState(null),[workerStatusLoading,setWorkerStatusLoading]=useState(false);
 const [title,setTitle]=useState(''),[description,setDescription]=useState(''),[category,setCategory]=useState('engineering');
 const [notice,setNotice]=useState(''),[noticeTone,setNoticeTone]=useState('info');
 async function loadConfig(){
  setConfigLoading(true);
  try{setConfig(await (await fetch('/api/x1/agent-config',{cache:'no-store'})).json());}
  catch{setConfig({status:'UNBOUND',reason:'CONFIG_UNAVAILABLE'});}
  finally{setConfigLoading(false);}
 }
 useEffect(()=>{loadConfig();},[]);
 async function loadItems(authToken=token,scope=tenantId){
  if(!authToken)return;
  setLoading(true);setWorkerStatusLoading(true);setNotice('');
  const headers={authorization:'Bearer '+authToken,...(scope?{'X-X1-Tenant-ID':scope}:{})};
  try{
   const [queueResult,workerResult]=await Promise.allSettled([
    fetch('/api/x1/work-items',{headers,cache:'no-store'}).then(readBody),
    fetch('/api/x1/worker-status',{headers,cache:'no-store'}).then(readBody)
   ]);
   if(queueResult.status!=='fulfilled')throw queueResult.reason;
   const data=queueResult.value;setItems(Array.isArray(data.items)?data.items:[]);if(data.tenant_id)setTenantId(data.tenant_id);
   if(workerResult.status==='fulfilled')setWorkerStatus(workerResult.value);else setWorkerStatus({status:'BLOCKED',reason:workerResult.reason?.message||'WORKER_STATUS_UNAVAILABLE'});
   setNotice('Queue state and worker readiness refreshed from X1 staging.');setNoticeTone('success');
  }catch(error){setNotice('Queue sync blocked: '+error.message);setNoticeTone('error');}
  finally{setLoading(false);setWorkerStatusLoading(false);}
 }
 async function requestCode(event){
  event.preventDefault();setBusy(true);setNotice('');
  try{
   if(config?.status!=='STAGING_CONFIGURED_NOT_AUTHENTICATED')throw new Error(config?.reason||'Staging authentication is not configured');
   const response=await fetch(config.authOrigin+'/auth/v1/otp',{method:'POST',headers:{apikey:config.publicAnonKey,'content-type':'application/json'},body:JSON.stringify({email:email.trim(),create_user:false})});
   await readBody(response);setAuthStep('otp');setNotice('One-time code requested for an existing account.');setNoticeTone('success');
  }catch(error){setNotice('Sign-in blocked: '+error.message);setNoticeTone('error');}
  finally{setBusy(false);}
 }
 async function verifyCode(event){
  event.preventDefault();setBusy(true);setNotice('');
  try{
   const response=await fetch(config.authOrigin+'/auth/v1/verify',{method:'POST',headers:{apikey:config.publicAnonKey,'content-type':'application/json'},body:JSON.stringify({email:email.trim(),token:otp.trim(),type:'email'})});
   const data=await readBody(response);if(!data.access_token)throw new Error('No access token returned');
   setToken(data.access_token);setAuthStep('authenticated');await loadItems(data.access_token,tenantId);
  }catch(error){setNotice('Verification blocked: '+error.message);setNoticeTone('error');}
  finally{setBusy(false);}
 }
 async function createItem(event){
  event.preventDefault();if(!title.trim()||description.trim().length<10)return;
  setBusy(true);setNotice('');
  try{
   const response=await fetch('/api/x1/work-items',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json',...(tenantId?{'X-X1-Tenant-ID':tenantId}:{})},body:JSON.stringify({title,description,category,acceptanceCriteria:['Implement on an isolated branch or staging environment','Run relevant tests and record evidence','Do not deploy to production without explicit release approval']})});
   const data=await readBody(response);
   if(data.item)setItems(prev=>[data.item,...prev.filter(item=>item.id!==data.item.id)]);
   setTitle('');setDescription('');setNotice(data.message||'Task queued.');setNoticeTone('success');
  }catch(error){setNotice('Task was not queued: '+error.message);setNoticeTone('error');}
  finally{setBusy(false);}
 }
 const counts=useMemo(()=>Object.fromEntries(LANES.map(l=>[l.id,items.filter(i=>l.id==='ATTENTION'?FAILURE.has(i.status):i.status===l.id).length])),[items]);
 const laneItems=(lane)=>items.filter(i=>lane.id==='ATTENTION'?FAILURE.has(i.status):i.status===lane.id);
 const signedIn=authStep==='authenticated'&&Boolean(token);
 return <main className="x1-kanban">
  <header className="x1-kanban-header">
   <div className="x1-kanban-brand"><div className="x1-kanban-kicker">STRATEGIC MINDS AI / X1 ENGINEERING</div><h1><Columns3 size={25}/> Autonomous Coding Board</h1><p>One queue for build tasks, specialist agents, verification and release gates.</p></div>
   <div className="x1-kanban-nav"><Link to="/admin/visual-editor">Visual Editor</Link><Link to="/admin/prompt-lab">Prompt Lab</Link><Link to="/admin/launch-studio">Launch Studio</Link><Link to="/admin/agent">Command Console <ArrowRight size={13}/></Link></div>
  </header>
  <section className="x1-kanban-status">
   <div className="x1-kanban-status-icon"><LockKeyhole size={18}/></div><div><strong>Staging queue · guarded execution</strong><p>{workerStatus?.status==='WORKER_STATUS_VERIFIED'?workerStatus.readiness.branchWriteWorkers+' branch-write workers ready · '+workerStatus.readiness.readOnlyWorkers+' fresh read-only workers · '+workerStatus.readiness.heldWorkers+' held · '+workerStatus.readiness.staleWorkers+' stale. Tasks remain DRAFT until a write-capable worker is explicitly authorized.':workerStatusLoading?'Refreshing the live worker registry…':'Worker readiness has not been verified. Tasks are saved as DRAFT only.'} This API never bypasses worker leases or publishes sites; production release stays approval-gated.</p></div>
   <div className="x1-kanban-status-actions">{signedIn&&<button onClick={()=>loadItems()} disabled={loading}><RefreshCw size={14} className={loading?'x1-spin':''}/> Refresh</button>}<span className={'x1-kanban-state '+(signedIn?'connected':'disconnected')}>{signedIn?'AUTHENTICATED':'SIGN-IN REQUIRED'}</span></div>
  </section>
  {!signedIn?<section className="x1-kanban-auth"><div className="x1-kanban-auth-mark"><Sparkles size={21}/></div><h2>Connect to the X1 staging queue</h2><p>Sign in with an existing X1 account. No account is created by this screen.</p>
   {configLoading?<p>Checking staging configuration…</p>:config?.status!=='STAGING_CONFIGURED_NOT_AUTHENTICATED'?<div className="x1-kanban-error">Queue connection is not configured: {config?.reason||config?.status||'unknown status'}. The board will not invent task data or use a Base44 backend.</div>:
   authStep==='email'?<form onSubmit={requestCode}><label htmlFor="kanban-email">Account email</label><input id="kanban-email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com"/><button type="submit" disabled={busy}>{busy?'Requesting…':'Send sign-in code'} <ArrowRight size={15}/></button></form>:
   <form onSubmit={verifyCode}><label htmlFor="kanban-otp">One-time code</label><input id="kanban-otp" inputMode="numeric" autoComplete="one-time-code" required value={otp} onChange={e=>setOtp(e.target.value)} placeholder="Enter the email code"/><button type="submit" disabled={busy}>{busy?'Verifying…':'Verify and load queue'} <ArrowRight size={15}/></button><button type="button" className="x1-kanban-plain" onClick={()=>setAuthStep('email')}>Use a different email</button></form>}
  </section>:<>
   <section className="x1-kanban-composer"><div><div className="x1-kanban-kicker">NEW WORK PACKET</div><h2>Queue a coding task</h2><p>Saves a tenant-scoped DRAFT. Current workers are read-only, so the task will not execute yet.</p></div>
    <form onSubmit={createItem} className="x1-kanban-form"><div className="x1-kanban-form-row"><div><label htmlFor="kanban-title">Task title</label><input id="kanban-title" required minLength={3} maxLength={120} value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Port Prompt Lab library to X1-native services"/></div><div><label htmlFor="kanban-category">Workstream</label><select id="kanban-category" value={category} onChange={e=>setCategory(e.target.value)}><option value="engineering">Engineering</option><option value="frontend">Frontend</option><option value="backend">Backend</option><option value="security">Security</option><option value="integrations">Integrations</option><option value="seo-analytics">SEO & analytics</option><option value="data-intelligence">Data intelligence</option></select></div></div><label htmlFor="kanban-description">Scope and acceptance criteria</label><textarea id="kanban-description" required minLength={10} maxLength={4000} rows={3} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Describe the required outcome, files or services involved, and how success should be verified."/><button className="x1-kanban-queue" type="submit" disabled={busy||!title.trim()||description.trim().length<10}><Plus size={16}/>{busy?'Saving draft…':'Save draft task'}</button></form>
   </section>
   <section className="x1-kanban-worker-panel"><div className="x1-kanban-worker-head"><div><div className="x1-kanban-kicker">LIVE WORKER REGISTRY</div><h2>Execution readiness</h2><p>Read-only snapshot from the tenant-scoped X1 control plane. Credentials and private worker metadata are never returned.</p></div><span className={'x1-kanban-worker-badge '+(workerStatus?.readiness?.branchWriteWorkers>0?'ready':'held')}>{workerStatusLoading?'CHECKING':workerStatus?.readiness?.branchWriteWorkers>0?'BRANCH WRITER READY':'NO BRANCH WRITER'}</span></div>{workerStatus?.status==='WORKER_STATUS_VERIFIED'?<div className="x1-kanban-worker-grid">{workerStatus.workers.map(w=><article key={w.workerId} className="x1-kanban-worker-card"><div className="x1-kanban-worker-card-top"><strong>{w.workerId}</strong><span className={'x1-kanban-worker-state '+(w.branchWriteReady?'ready':w.workerStatus==='READ_ONLY'?'readonly':'held')}>{w.workerStatus.replaceAll('_',' ')}</span></div><p>{w.executionPlane} · {w.environment}</p><div className="x1-kanban-worker-facts"><span>Enabled <b>{w.enabled?'YES':'NO'}</b></span><span>Lease <b>{w.leaseAllowed&&!w.leaseHold?'ALLOWED':'HELD'}</b></span><span>Heartbeat <b>{w.heartbeatAgeSeconds===null?'NONE':w.heartbeatAgeSeconds<60?w.heartbeatAgeSeconds+'s':Math.floor(w.heartbeatAgeSeconds/60)+'m'}</b></span></div><div className="x1-kanban-worker-actions">{w.allowedActionClasses.map(a=><span key={a}>{a}</span>)}</div></article>)}</div>:<div className="x1-kanban-worker-error">{workerStatus?.reason?'Worker status unavailable: '+workerStatus.reason.replaceAll('_',' ').toLowerCase():'Sign in and refresh to load worker readiness.'}</div>}</section>
<section className="x1-kanban-metrics">{LANES.map(l=><div key={l.id}><span>{l.title}</span><strong>{counts[l.id]||0}</strong></div>)}<div><span>Visible tasks</span><strong>{items.length}</strong></div></section>
   <section className="x1-kanban-board">{LANES.map(lane=>{const Icon=lane.icon;return <div className={'x1-kanban-lane lane-'+lane.tone} key={lane.id}><div className="x1-kanban-lane-head"><span><Icon size={16}/>{lane.title}</span><b>{counts[lane.id]||0}</b></div><p>{lane.description}</p><div className="x1-kanban-cards">{laneItems(lane).length?laneItems(lane).map(item=><article className="x1-kanban-card" key={item.id}><div className="x1-kanban-card-top"><span>{item.category||'engineering'}</span><span>#{String(item.id||'task').slice(-6)}</span></div><h3>{item.title}</h3><p>{item.description||'No description supplied.'}</p>{item.acceptanceCriteria?.length>0&&<ul>{item.acceptanceCriteria.slice(0,3).map((c,i)=><li key={i}>{c}</li>)}</ul>}<div className="x1-kanban-card-foot"><span>{item.actionClass||'DRAFT'}</span><span>{item.attempts||0} attempts</span></div>{item.lastErrorCode&&<div className="x1-kanban-last-error">Last error: {item.lastErrorCode}</div>}</article>):<div className="x1-kanban-empty">No tasks in this lane.</div>}</div></div>})}</section>
   <p className="x1-kanban-footer"><Terminal size={14}/> Queue state comes from the X1 staging database. “Completed” means the queue status is completed; independent validation receipts must still be checked before any release.</p>
  </>}
  {notice&&<div className={'x1-kanban-notice '+noticeTone} role="status">{notice}</div>}
 </main>;
}
