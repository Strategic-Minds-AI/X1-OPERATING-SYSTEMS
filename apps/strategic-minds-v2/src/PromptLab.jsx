import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Bot, BookOpen, GitBranch, Layers3, ShieldCheck, Sparkles, Workflow } from 'lucide-react';

const modules = [
  { icon: Sparkles, title: 'Prompt Studio', detail: 'Author, refine, version and evaluate production prompts.' },
  { icon: BookOpen, title: 'Prompt Library', detail: 'Organize reusable prompts, templates and domain playbooks.' },
  { icon: Workflow, title: 'Prompt Chains', detail: 'Compose multi-step workflows with explicit inputs and outputs.' },
  { icon: ShieldCheck, title: 'Hallucination & QA Lab', detail: 'Run structured checks for unsupported claims and output quality.' },
  { icon: Layers3, title: 'Model Comparison', detail: 'Compare candidate outputs against a consistent evaluation rubric.' },
  { icon: Bot, title: 'Agent Workbench', detail: 'Design specialized prompt-engineering and validation agents.' },
];

export default function PromptLab() {
  const externalUrl = import.meta.env.VITE_PROMPT_LAB_URL;
  return <main style={{minHeight:'100dvh',background:'#050d18',color:'#edf7ff',fontFamily:"Inter,'Segoe UI',Arial,sans-serif"}}>
    <header style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,padding:'18px clamp(18px,3vw,42px)',borderBottom:'1px solid #17334a',background:'#071625'}}>
      <div><div style={{fontSize:11,letterSpacing:'.14em',color:'#7edfff',fontWeight:800}}>STRATEGIC MINDS AI / X1 ADMIN</div><h1 style={{margin:'8px 0 0',fontSize:24}}>Prompt Lab</h1></div>
      <nav style={{display:'flex',gap:10,flexWrap:'wrap'}}><Link to="/admin/visual-editor" style={linkStyle}>Visual Editor</Link><Link to="/admin/launch-studio" style={linkStyle}>Launch Studio</Link></nav>
    </header>
    {externalUrl ? <iframe title="Prompt Lab workspace" src={externalUrl} style={{display:'block',width:'100%',height:'calc(100dvh - 84px)',border:0,background:'#fff'}} allow="clipboard-read; clipboard-write" /> :
    <section style={{maxWidth:1160,margin:'0 auto',padding:'clamp(22px,4vw,48px)'}}>
      <div style={{border:'1px solid #174766',borderRadius:18,padding:24,background:'radial-gradient(ellipse at 90% 0%,rgba(18,117,174,.2),transparent 55%),#08192a',marginBottom:22}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:8,fontSize:10,letterSpacing:'.12em',fontWeight:800,color:'#8affbf',border:'1px solid #235b4c',padding:'7px 10px',borderRadius:30}}><ShieldCheck size={14}/> X1 ADMIN WORKSPACE</div>
        <h2 style={{fontSize:'clamp(24px,4vw,38px)',lineHeight:1.12,margin:'18px 0 12px'}}>Prompt engineering, simulation and quality control.</h2>
        <p style={{maxWidth:760,color:'#a8bfd2',lineHeight:1.7,marginBottom:18}}>The Prompt Lab entry is now registered in the X1 admin. The original public Base44 source still needs its runtime and data services migrated before its full interactive workspace can safely run inside X1.</p>
        <a href="https://github.com/Strategic-Minds-AI/x1-prompt-lab" target="_blank" rel="noreferrer" style={{...linkStyle,display:'inline-flex',alignItems:'center',gap:8}}>Open source repository <ArrowUpRight size={15}/></a>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:14}}>
        {modules.map(({icon:Icon,title,detail})=><article key={title} style={{border:'1px solid #18364d',borderRadius:14,padding:20,background:'linear-gradient(150deg,#0b2033,#071321)'}}><div style={{width:38,height:38,borderRadius:11,display:'grid',placeItems:'center',background:'#0d344b',color:'#72ddff',marginBottom:16}}><Icon size={19}/></div><h3 style={{fontSize:15,margin:'0 0 9px'}}>{title}</h3><p style={{fontSize:12,lineHeight:1.7,color:'#9bb2c7',margin:0}}>{detail}</p></article>)}
      </div>
      <div style={{marginTop:20,padding:'15px 17px',borderLeft:'3px solid #49d5ff',background:'#091b2b',color:'#9eb9ce',fontSize:12,lineHeight:1.7}}>Runtime connection is intentionally not faked. Set <code>VITE_PROMPT_LAB_URL</code> to the authenticated Prompt Lab deployment to embed it temporarily; full X1-native integration requires migrating Base44 functions, entities, auth and secrets.</div>
    </section>}
  </main>;
}
const linkStyle = {color:'#b9eaff',fontSize:12,fontWeight:750,textDecoration:'none',padding:'9px 12px',border:'1px solid #24506c',borderRadius:9,background:'#0a2236'};
