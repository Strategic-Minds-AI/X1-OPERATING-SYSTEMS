import React,{useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight,CheckCircle2,KeyRound,LockKeyhole,MessageCircle,RefreshCw,Send,ShieldCheck,Sparkles} from 'lucide-react';
import './X1NativeAgentChat.css';

/* One same-origin, authenticated X1 command path. Never simulate agent replies or write without an authenticated identity. */
const GUIDANCE='This panel uses the native X1 Agent API. Sign in with an existing authorized operator account to send a verified request. No local drafts are represented as running jobs.';
async function unwrap(response) {
  let data={};try{data=await response.json();}catch{}
  if(!response.ok)throw new Error(String(data.reason||data.error_description||data.error||response.status).replaceAll('_',' ').slice(0,180));
  return data;
}
export default function X1NativeAgentChat({suggestion=null}) {
  const [config,setConfig]=useState(null),[checking,setChecking]=useState(true);
  const [email,setEmail]=useState(''),[otp,setOtp]=useState(''),[authStep,setAuthStep]=useState('email');
  const [token,setToken]=useState(''),[tenant,setTenant]=useState('');
  const [sessionId,setSessionId]=useState(()=>crypto.randomUUID());
  const [messages,setMessages]=useState([{role:'assistant',content:GUIDANCE,status:'GUIDANCE'}]);
  const [draft,setDraft]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
  const [sync,setSync]=useState('NOT_CONNECTED'),[receipt,setReceipt]=useState(null);
  const bottom=useRef(null);
  const connected=config?.status==='STAGING_CONFIGURED_NOT_AUTHENTICATED';
  const dispatch=config?.dispatch==='PREVIEW_BUILD_READY';
  useEffect(()=>{
    let cancelled=false;
    async function readConfig(){
      try{const data=await unwrap(await fetch('/api/x1/agent-config',{cache:'no-store'}));
        if(!cancelled){setConfig(data);setSync(data.status==='STAGING_CONFIGURED_NOT_AUTHENTICATED'?'SIGN_IN_REQUIRED':'RUNTIME_UNBOUND');}
      }catch{if(!cancelled){setConfig({status:'UNBOUND',reason:'AGENT_CONFIG_UNAVAILABLE'});setSync('RUNTIME_UNBOUND');}}
      finally{if(!cancelled)setChecking(false);}
    }
    void readConfig();
    return ()=>{cancelled=true;};
  },[]);
  useEffect(()=>{if(suggestion?.id&&suggestion.text)setDraft(suggestion.text.slice(0,2400));},[suggestion?.id]);
  useEffect(()=>{bottom.current?.scrollIntoView({block:'end',behavior:'smooth'});},[messages.length]);
  async function requestCode(event){
    event.preventDefault();if(!connected||busy)return;setBusy(true);setNotice('');
    try{
      await unwrap(await fetch(config.authOrigin+'/auth/v1/otp',{
        method:'POST',headers:{apikey:config.publicAnonKey,'content-type':'application/json'},
        body:JSON.stringify({email:email.trim(),create_user:false})}));
      setAuthStep('otp');setNotice('Sign-in code requested for your existing X1 operator account.');
    }catch(err){setNotice('Sign-in unavailable: '+err.message);}
    finally{setBusy(false);}
  }
  async function verifyCode(event){
    event.preventDefault();if(!connected||busy)return;setBusy(true);setNotice('');
    try{
      const data=await unwrap(await fetch(config.authOrigin+'/auth/v1/verify',{
        method:'POST',headers:{apikey:config.publicAnonKey,'content-type':'application/json'},
        body:JSON.stringify({email:email.trim(),token:otp.trim(),type:'email'})}));
      if(!data.access_token)throw new Error('Identity verification returned no token');
      setToken(data.access_token);setAuthStep('signed-in');
      await refresh(data.access_token);
    }catch(err){setNotice('Verification unavailable: '+err.message);}
    finally{setBusy(false);}
  }
  async function refresh(auth=token){
    if(!auth||!connected)return;
    setSync('SYNCING');
    try{
      const headers={authorization:'Bearer '+auth,...(tenant.trim()?{'X-X1-Tenant-ID':tenant.trim()}:{})};
      const data=await unwrap(await fetch('/api/x1/agent-chat?session_id='+encodeURIComponent(sessionId),{headers,cache:'no-store'}));
      if(data.turns?.length)setMessages([{role:'assistant',content:GUIDANCE,status:'GUIDANCE'},...data.turns.map(t=>({
        role:t.role,content:t.content,status:t.status,receipt:t.receipt,model:t.model}))]);
      setSync('VERIFIED_READ');setNotice('X1 conversation read from authenticated tenant-scoped storage.');
    }catch(err){setSync('BLOCKED');setNotice('X1 sync blocked: '+err.message);}
  }
  async function send(event){
    event.preventDefault();const message=draft.trim();
    if(!message||!token||!connected||busy)return;
    setBusy(true);setNotice('Submitting authenticated X1 request...');setSync('SUBMITTING');
    const requestId=crypto.randomUUID();
    try{
      const data=await unwrap(await fetch('/api/x1/agent-chat',{
        method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json',
          ...(tenant.trim()?{'X-X1-Tenant-ID':tenant.trim()}:{})},
        body:JSON.stringify({session_id:sessionId,request_id:requestId,message})}));
      setMessages(m=>[...m,{role:'user',content:message,status:'ACCEPTED'},
        {role:'assistant',content:String(data.response||'X1 accepted the request; inspect receipt for execution status.'),
          status:data.mode||'RECEIVED',model:data.model,receipt:data.receipt}]);
      setReceipt(data.receipt||null);setDraft('');setSync('WRITE_RECEIPT_RETURNED');
      setNotice(data.dispatch==='QUEUED_NOT_DEPLOYED'?'Build request queued, NOT deployed. Guardian approval still required.':'X1 response received. No deployment is implied.');
    }catch(err){setSync('BLOCKED');setNotice('Request unconfirmed: '+err.message+'. Sync before retrying to avoid duplicate work.');}
    finally{setBusy(false);}
  }
  function signOut(){setToken('');setOtp('');setAuthStep('email');setReceipt(null);setSync('SIGN_IN_REQUIRED');setMessages([{role:'assistant',content:GUIDANCE,status:'GUIDANCE'}]);setNotice('Session cleared from this browser tab.');}
  return <div className="x1-native-chat" aria-label="X1 authenticated agent chat">
    <div className="x1-native-head">
      <div><MessageCircle size={20}/><span><strong>X1 Native Command</strong><small>{connected?(token?'AUTHENTICATED X1 WORKSPACE':'STAGING AUTHENTICATION REQUIRED'):'LIVE BINDING NOT VERIFIED'}</small></span></div>
      <span className={'x1-native-status'+(sync==='VERIFIED_READ'||sync==='WRITE_RECEIPT_RETURNED'?' is-verified':'')}>{sync.replaceAll('_',' ')}</span>
    </div>
    {!connected?<section className="x1-native-gate"><LockKeyhole size={26}/><h3>{checking?'Checking X1 runtime':'X1 Agent API not yet bound to this deployment'}</h3><p>The design editor is available. Agent execution remains locked because the server has not verified its authenticated runtime; no sample chat will be mistaken for a working agent.</p><small>{config?.reason||config?.status||'WAITING_FOR_CONFIGURATION'}</small>{suggestion?.text&&<p>Your visual change specification is prepared locally. Backend authentication is required before X1 can receive it.</p>}<Link to="/admin/agent">OPEN AGENT CONNECTION STATUS <ArrowRight size={14}/></Link></section>
    :!token?<section className="x1-native-gate"><KeyRound size={25}/><h3>Secure operator sign-in</h3><p>Uses your existing X1 staging account and tenant permissions. This does not create a new account.</p>
      <form onSubmit={authStep==='otp'?verifyCode:requestCode}>
        <label htmlFor="x1-native-email">Account email</label><input id="x1-native-email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required/>
        {authStep==='otp'&&<><label htmlFor="x1-native-code">One-time code</label><input id="x1-native-code" autoComplete="one-time-code" inputMode="numeric" value={otp} onChange={e=>setOtp(e.target.value)} required/></>}
        <button type="submit" disabled={busy}>{busy?'CHECKING...':authStep==='otp'?'VERIFY ACCOUNT':'SEND SIGN-IN CODE'} <ArrowRight size={15}/></button>
      </form>
      {suggestion?.text&&<p>Your visual change specification is retained in the composer after sign-in.</p>}
    </section>
    :<><div className="x1-native-tools"><button onClick={()=>void refresh()} disabled={busy}><RefreshCw size={14}/> SYNC</button><button onClick={signOut}>SIGN OUT</button></div>
      <div className="x1-native-log" role="log" aria-label="Authenticated X1 messages">{messages.map((m,i)=><article key={i} className={m.role==='user'?'x1-native-user':'x1-native-assistant'}><small>{m.role==='user'?'YOU':'X1'} · {m.status||'RECEIVED'}</small><p>{m.content}</p>{m.receipt&&<small>Server receipt supplied</small>}</article>)}<div ref={bottom}/></div>
      <form className="x1-native-compose" onSubmit={send}><label htmlFor="x1-native-message">Message your X1 agent</label><textarea id="x1-native-message" rows={5} maxLength={2400} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Describe a change, or import a review patch from the visual canvas."/>
      <small><ShieldCheck size={13}/> {dispatch?'Staging preview dispatch available; production approval required':'Authenticated drafts/read operations only until server enables preview dispatch'}</small>
      <button disabled={!draft.trim()||busy} type="submit"><Send size={15}/> {busy?'SUBMITTING':'SEND TO X1'}</button></form>
      {receipt&&<p className="x1-native-receipt"><CheckCircle2 size={14}/> An X1 API receipt was returned. Check the evidence/queue before considering the work complete.</p>}
    </>}
    {notice&&<p role="status" className="x1-native-notice">{notice}</p>}
    <div className="x1-native-footer"><Link to="/admin/agent">FULL AGENT CONSOLE</Link><Link to="/admin/prompt-lab">PROMPT LAB</Link><Link to="/admin/launch-studio">LAUNCH STUDIO</Link></div>
  </div>;
}
