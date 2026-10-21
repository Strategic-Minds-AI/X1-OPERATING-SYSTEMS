import React, {useMemo,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {Activity,ArrowLeft,ArrowRight,ArrowUpRight,BookOpen,Box,Check,Columns3,CheckCircle2,ChevronDown,ChevronRight,Clipboard,Code2,Command,FileCode2,FileDiff,Globe2,History,Layers3,LayoutDashboard,LockKeyhole,Maximize2,MessageCircle,Mic,MicOff,Monitor,MoreHorizontal,MousePointer2,PanelLeftClose,Pause,Play,Plus,RefreshCw,RotateCcw,Send,Settings2,ShieldCheck,Smartphone,Sparkles,Square,Terminal,TestTube2,Undo2,Workflow,X,Zap} from 'lucide-react';
import './VisualStudio.css';
import X1NativeAgentChat from './X1NativeAgentChat.jsx';
const DEVICES=[{id:'desktop',label:'Desktop',Icon:Monitor},{id:'tablet',label:'Tablet',Icon:Layers3},{id:'mobile',label:'Mobile',Icon:Smartphone}];
const TABS=['Live Site','Design','Code','Changes','Checks'];
const SANDBOXES=[
 {id:'sb-01',name:'Corporate V2',branch:'feature/x1-v2-cinematic',kind:'Homepage',status:'Preview shell'},
 {id:'sb-02',name:'Digital Dominance',branch:'feature/site-factory',kind:'Lead generation',status:'Architecture ready'},
 {id:'sb-03',name:'Client Portal',branch:'feature/client-experience',kind:'Portal',status:'Visual concept'}
];
const startingDesign={title:'INTELLIGENCE\nIN MOTION',eyebrow:'THE FUTURE BELONGS TO BUILDERS',description:'Enterprise intelligence, engineered around your vision.',button:'EXPLORE OUR SOLUTIONS',accent:'#46d7ff',surface:'cosmic'};
function SMark({large=false}){return <Link to="/v2/a" className={'x1-smark'+(large?' x1-smark-large':'')} title="Strategic Minds AI home" aria-label="Strategic Minds AI home"><img src="/v2-assets/silver-emblem.png" alt="Metallic S icon"/></Link>}
function StatusDot({tone='cyan'}){return <span className={'x1-dot x1-dot-'+tone}/>}
function Bell({children,tone='cyan'}){return <span className={'x1-tag x1-tag-'+tone}>{children}</span>}
function FakeSurface({design,select,selected}){
 return <div className={'x1-surface x1-surface-'+design.surface} style={{'--x1-preview-accent':design.accent}}>
  <div className="x1-surface-stars" aria-hidden="true"/>
  <div className="x1-surface-header"><div className="x1-mini-brand"><img src="/v2-assets/silver-emblem.png" alt="" aria-hidden="true"/><span>STRATEGIC MINDS <b>AI</b></span></div><nav aria-label="Sample site"><span>HOME</span><span>SOLUTIONS</span><span>THE PLATFORM</span><span>CONTACT</span></nav><button className="x1-mini-outline" onClick={()=>select('button')}>CALL EDEN <ArrowUpRight size={12}/></button></div>
  <main className="x1-surface-body"><div className="x1-surface-copy">
    <button onClick={()=>select('eyebrow')} className={'x1-selectable x1-surface-eyebrow'+(selected==='eyebrow'?' x1-picked':'')}><span className="x1-tiny-light"/> {design.eyebrow}</button>
    <button onClick={()=>select('title')} className={'x1-selectable x1-surface-h1'+(selected==='title'?' x1-picked':'')} style={{whiteSpace:'pre-line'}}>{design.title}</button>
    <button onClick={()=>select('description')} className={'x1-selectable x1-surface-desc'+(selected==='description'?' x1-picked':'')}>{design.description}</button>
    <button onClick={()=>select('button')} className={'x1-selectable x1-surface-cta'+(selected==='button'?' x1-picked':'')}>{design.button}<ArrowRight size={16}/></button>
  </div><div className="x1-surface-brand" aria-hidden="true"><div className="x1-circular-glow"/><img src="/v2-assets/silver-emblem.png" alt=""/></div></main>
  <img className="x1-surface-earth" src="/v2-assets/connected-earth.jpg" alt="" aria-hidden="true"/>
  <div className="x1-surface-bottom"><span>PRECISION · INTELLIGENCE · EXECUTION</span><span>YOUR VISION, ENGINEERED.</span></div>
 </div>;
}
function Inspector({selected,design,apply,onClose}){
 const choices={eyebrow:{label:'Eyebrow',key:'eyebrow'},title:{label:'Hero heading',key:'title'},description:{label:'Description',key:'description'},button:{label:'Primary action',key:'button'}};
 const c=choices[selected];
 return <aside className="x1-inspector"><div className="x1-inspect-title"><span><MousePointer2 size={15}/> VISUAL INSPECTOR</span><button aria-label="Close inspector" onClick={onClose}><X size={16}/></button></div>
 <div className="x1-inspect-body">
  <Bell tone="green">LOCAL EDIT · NO CODE PUSH</Bell>
  <h3>{c?.label||'Page properties'}</h3>
  <p>Select any outlined element in the preview to edit it. The change appears instantly, but remains browser-local.</p>
  {c&&<label>Content{c.key==='title'?<textarea value={design[c.key]} onChange={e=>apply(c.key,e.target.value)} rows={3}/>:<input value={design[c.key]} onChange={e=>apply(c.key,e.target.value)}/>}</label>}
  <label>Accent color<select value={design.accent} onChange={e=>apply('accent',e.target.value)}><option value="#46d7ff">Electric blue</option><option value="#8affb8">Neon green</option><option value="#9e8cff">Cosmic violet</option></select></label>
  <label>Atmosphere<select value={design.surface} onChange={e=>apply('surface',e.target.value)}><option value="cosmic">Cinematic cosmic</option><option value="minimal">Nocturnal minimal</option></select></label>
  <div className="x1-inspect-footer"><ShieldCheck size={16}/> Export a versioned patch for approval before it reaches a repository.</div>
 </div></aside>;
}
export default function VisualStudio(){
 const [sandbox,setSandbox]=useState('sb-01'),[device,setDevice]=useState('desktop'),[tab,setTab]=useState('Live Site'),[selected,setSelected]=useState('title');
 const [designStore,setDesignStore]=useState(()=>Object.fromEntries(SANDBOXES.map(s=>[s.id,{...startingDesign}])));
 const [historyStore,setHistoryStore]=useState(()=>Object.fromEntries(SANDBOXES.map(s=>[s.id,[]])));
 const [inspector,setInspector]=useState(false),[notice,setNotice]=useState(''),[agentSuggestion,setAgentSuggestion]=useState(null);
 const lastEditRef=useRef({sandbox:null,key:null,at:0});
 const current=SANDBOXES.find(s=>s.id===sandbox)||SANDBOXES[0];
 const design=designStore[sandbox]||startingDesign,history=historyStore[sandbox]||[];
 const setDesign=updater=>setDesignStore(store=>({...store,[sandbox]:typeof updater==='function'?updater(store[sandbox]||startingDesign):updater}));
 const setHistory=updater=>setHistoryStore(store=>({...store,[sandbox]:typeof updater==='function'?updater(store[sandbox]||[]):updater}));
 const changes=Object.entries(design).filter(([key,value])=>startingDesign[key]!==value);
 const update=(key,value)=>{
  const at=Date.now();
  const grouped=lastEditRef.current.sandbox===sandbox&&lastEditRef.current.key===key&&at-lastEditRef.current.at<1350;
  if(!grouped)setHistory(h=>[design,...h].slice(0,40));
  lastEditRef.current={sandbox,key,at};
  setDesign(previous=>({...previous,[key]:value}));
 };
 const restore=()=>{if(history.length){setDesign(history[0]);setHistory(h=>h.slice(1));lastEditRef.current={sandbox,key:null,at:0};}};
 const patch=useMemo(()=>JSON.stringify({schema:'x1.visual.patch.v1',mode:'review_only',sandbox_id:sandbox,source_repo:'Strategic-Minds-AI/X1-OPERATING-SYSTEMS',changes:Object.fromEntries(changes),requires:['authenticated operator','isolated sandbox','agent diff','QA receipts','branch review']},null,2),[changes,sandbox]);
 const offerPatch=()=>{if(!changes.length){setNotice('Edit the Design canvas before preparing a patch.');return;}setAgentSuggestion({id:Date.now(),text:'Prepare a reviewable implementation for Strategic-Minds-AI/X1-OPERATING-SYSTEMS using this visual change specification. Produce a source diff and independent QA plan. No production release without approval.\n'+patch});setNotice('Patch loaded into the native X1 command composer. Review and send after authentication.');};
 const exportPatch=()=>{
  const blob=new Blob([patch],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='x1-visual-'+sandbox+'-patch.json';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);setNotice('Review-only JSON patch downloaded. This did not change GitHub.');
 };
 return <div className="x1-studio">
  <a href="#x1-workspace" className="x1-skip">Skip to visual editor</a>
  <aside className="x1-rail" aria-label="Admin sections">
    <SMark/>
    <div className="x1-rail-divider"/>
    <Link to="/portal" title="Client portal access"><LayoutDashboard size={19}/></Link>
    <button className="active" title="Visual Studio" aria-label="Visual Studio"><Layers3 size={21}/></button>
    <Link to="/admin/visual-editor" title="Visual Editor" aria-label="Visual Editor"><MousePointer2 size={20}/></Link>
     <Link to="/admin/prompt-lab" title="Prompt Lab" aria-label="Prompt Lab"><Terminal size={20}/></Link>
     <Link to="/admin/coding-kanban" title="Autonomous Coding Kanban" aria-label="Autonomous Coding Kanban"><Columns3 size={20}/></Link>
     <Link to="/admin/launch-studio" title="Launch Studio" aria-label="Launch Studio"><Sparkles size={20}/></Link>
    <Link to="/admin/agent" title="Authenticated X1 command"><MessageCircle size={20}/></Link>
    <div className="x1-rail-spacer"/>
    <Link to="/pricing" title="Pricing"><BookOpen size={19}/></Link>
    <Link to="/v2/b" title="Public homepage"><Globe2 size={19}/></Link>
  </aside>
  <div className="x1-studio-main">
   <header className="x1-topbar"><div className="x1-top-left"><div className="x1-studio-label">STRATEGIC MINDS <b>AI</b> <span>/</span> VISUAL X · NATIVE WORKSPACE</div><Bell tone="cyan"><StatusDot tone="cyan"/> X1 API-GATED WORKSPACE</Bell></div><div className="x1-top-actions"><Link to="/admin/prompt-lab" className="x1-save"><Terminal size={15}/> PROMPT LAB</Link><Link to="/admin/launch-studio" className="x1-save"><Sparkles size={15}/> LAUNCH STUDIO</Link><button className="x1-save" onClick={offerPatch} disabled={!changes.length}><FileDiff size={15}/> PREPARE X1 PATCH</button></div></header>
   <div className="x1-workspace" id="x1-workspace">
    <section className="x1-chat x1-live-command" aria-label="Authenticated X1 command workspace"><X1NativeAgentChat suggestion={agentSuggestion}/></section>
    <section className="x1-editor" aria-label="Visual editor">
     <div className="x1-editor-top"><div className="x1-editor-project"><button onClick={()=>{setSandbox(prev=>SANDBOXES[(SANDBOXES.findIndex(s=>s.id===prev)+1)%SANDBOXES.length].id);setTab('Design');}}><span className="x1-project-icon"><Box size={17}/></span><span><strong>{current.name}</strong><small>{current.branch}</small></span><ChevronDown size={15}/></button></div>
      <div className="x1-editor-right"><button className="x1-tools-trigger" type="button" aria-expanded={inspector} aria-controls="x1-visual-x-tools" onClick={()=>{setTab('Design');setInspector(v=>!v)}}><Settings2 size={15}/> {inspector?'HIDE TOOLS':'SHOW TOOLS'}</button><Bell tone="muted">LOCAL DESIGN · NO REMOTE WRITE</Bell><button onClick={()=>{setDesign(startingDesign);setSelected('title');setHistory([]);}} title="Reset local design"><RefreshCw size={17}/></button></div>
     </div>
     <div className="x1-editor-tabs"><div className="x1-tabs-group">{TABS.map(t=><button className={tab===t?'active':''} onClick={()=>setTab(t)} key={t}>{t==='Live Site'?<Globe2 size={15}/>:t==='Design'?<MousePointer2 size={15}/>:t==='Code'?<Code2 size={15}/>:t==='Changes'?<FileDiff size={15}/>:<TestTube2 size={15}/>} {t}{t==='Changes'&&changes.length>0&&<b>{changes.length}</b>}</button>)}</div><div className="x1-view-controls">{DEVICES.map(({id,label,Icon})=><button className={device===id?'active':''} key={id} onClick={()=>{setDevice(id);setTab('Design')}} title={label} aria-label={label+' preview'}><Icon size={16}/></button>)}<div className="x1-v-divider"/><button onClick={restore} disabled={!history.length} title="Undo local edit" aria-label="Undo local edit"><Undo2 size={17}/></button><button className={inspector?'active':''} onClick={()=>setInspector(x=>!x)} title={inspector?'Close tools':'Open tools'} aria-label={inspector?'Close tools panel':'Open tools panel'} aria-expanded={inspector} aria-controls="x1-visual-x-tools"><Settings2 size={17}/></button></div></div>
     <div className="x1-stage">
      {tab==='Live Site'?<div className="x1-live-site"><p className="x1-live-site-note"><Globe2 size={15}/> CURRENT X1 FRONTEND · SAME-ORIGIN RENDER · OPEN DESIGN TO EDIT</p><div className={'x1-live-site-frame '+(device==='desktop'?'':device)}><iframe title="X1 actual marketing frontend" src="/v2/b" loading="lazy"/></div></div>
        :tab==='Design'?<div className="x1-canvas-well"><div className="x1-canvas-measure"><span><StatusDot tone="cyan"/> LOCAL DESIGN CANVAS · EDITS ARE NOT LIVE</span><span>{device==='desktop'?'1440 × 900':device==='tablet'?'768 × 1024':'390 × 844'} · 100%</span></div><div className={'x1-browser-frame x1-frame-'+device}><div className="x1-browser-toolbar"><div><i/><i/><i/></div><span><LockKeyhole size={11}/> x1.local/visual-preview · not a live sandbox</span><MoreHorizontal size={16}/></div><FakeSurface design={design} selected={selected} select={x=>{setSelected(x);setInspector(true)}}/></div><div className="x1-canvas-footer"><span><MousePointer2 size={13}/> Click headline, description or button to edit</span><span>LIVE VISUAL DRAFT</span></div></div>
       :tab==='Code'?<div className="x1-code-panel"><div className="x1-code-head"><Code2 size={16}/> Generated design spec <Bell tone="muted">LOCAL PATCH</Bell></div><pre><code>{patch}</code></pre><div className="x1-code-note">This is a structured edit instruction, not agent-generated source code. X1 backend must map it to actual source files and commit diffs.</div><button className="x1-export-dark" onClick={exportPatch}><FileCode2 size={16}/> DOWNLOAD PATCH</button></div>
       :tab==='Changes'?<div className="x1-change-panel"><div className="x1-code-head"><FileDiff size={17}/> Local changes · uncommitted</div>{changes.length===0?<div className="x1-empty">No visual changes yet. Select an element in the Preview tab.</div>:changes.map(([key,val])=><div className="x1-diff" key={key}><strong>{key}</strong><div><span>- {String(startingDesign[key])}</span><span>+ {String(val)}</span></div></div>)}<button className="x1-export-dark" onClick={exportPatch}>EXPORT REVIEW PATCH <ArrowRight size={16}/></button></div>
       :<div className="x1-checks"><div className="x1-code-head"><TestTube2 size={17}/> Execution gates</div>{[['Visual preview renders','LOCAL PASS'],['Preview elements editable','LOCAL PASS'],['Accessibility and responsive QA','NOT RUN'],['Tenant-authenticated X1 agent bridge','UNBOUND'],['Real Vercel sandbox and dev server','UNBOUND'],['GitHub branch diff and commit receipts','UNBOUND'],['Full browser regression','NOT RUN'],['Production approval','PROTECTED']].map(([k,v])=><div key={k}><span>{v==='LOCAL PASS'?<CheckCircle2 size={17} color="#75ffb8"/>:<ShieldCheck size={17} color="#799bb3"/>}{k}</span><Bell tone={v==='LOCAL PASS'?'green':'muted'}>{v}</Bell></div>)}<p>Simulation screens are not evidence of agent operation. Once connected, results must come from real X1 receipts.</p></div>}
      {tab==='Design'&&<div id="x1-visual-x-tools" className={'x1-tools-drawer'+(inspector?' is-open':'')} aria-hidden={!inspector} inert={!inspector}><Inspector selected={selected} design={design} apply={update} onClose={()=>setInspector(false)}/></div>}
     </div>
     <div className="x1-editor-bottom"><span><StatusDot tone="cyan"/> {tab==='Live Site'?'LIVE ROUTE VIEW · NO EDITS':'DESIGN CHANGES LOCAL UNTIL X1 PROPOSAL IS APPROVED'}</span><div><span>{changes.length} uncommitted visual change{changes.length===1?'':'s'}</span><button onClick={offerPatch} disabled={!changes.length}><FileDiff size={14}/> PREPARE X1 PATCH</button></div></div>
    </section>
   </div>
   {notice&&<div className="x1-toast" role="status">{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss notification"><X size={14}/></button></div>}
  </div>
 </div>;
}