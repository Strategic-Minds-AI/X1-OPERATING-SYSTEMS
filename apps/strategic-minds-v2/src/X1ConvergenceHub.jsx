import React from 'react';
import {Link} from 'react-router-dom';
import {ArrowLeft,ArrowUpRight,ShieldCheck,AlertTriangle,Workflow,Network} from 'lucide-react';
import {CONVERGENCE_MODULES,routeReady} from './convergenceCatalog.mjs';
import './X1ConvergenceHub.css';

const STATUS={ROUTE_PRESENT:'X1 route exists · not E2E verified',
 FEATURE_BRANCH_ONLY:'Feature branch only',ADAPTER_REQUIRED:'Authenticated adapter required',
 E2E_VERIFIED:'Independently verified'};
export default function X1ConvergenceHub(){
 return <main className="xc-page">
   <header className="xc-header">
     <div className="xc-brand"><img src="/v2-assets/silver-emblem.png" alt="Strategic Minds AI"/><span>STRATEGIC MINDS <b>AI</b></span></div>
     <Link to="/admin/launch-studio" className="xc-back"><ArrowLeft size={15}/> Launch Studio</Link>
   </header>
   <div className="xc-main">
     <p className="xc-eyebrow"><Network size={16}/> X1 INTEGRATION CONTROL / READ-ONLY CAPABILITY INVENTORY</p>
     <h1>Converge every engine.<br/><span>One X1 control plane.</span></h1>
     <p className="xc-deck">A truthful map of application modules and work still required. GPT-linked MCP access is not automatically an authenticated connection inside this web app.</p>
     <div className="xc-notice"><AlertTriangle size={20}/>
       <div><strong>No automatic production operations are enabled from this page.</strong>
       <p>Existing X1 jobs have authorization and adapter failures. This read-only register does not dispatch work, expose secrets, or claim that missing integrations are live.</p></div>
     </div>
     <div className="xc-grid">{CONVERGENCE_MODULES.map(item=><article className="xc-card" key={item.id}>
       <div className="xc-top"><span>{item.group}</span><span className="xc-state">{STATUS[item.state] || 'Unknown'}</span></div>
       <h2>{item.name}</h2><p>{item.note}</p><div className="xc-bottom">
       <span>{item.owner}</span>
       {routeReady(item)?<Link to={item.route} aria-label={'Open '+item.name}>Open X1 route <ArrowUpRight size={14}/></Link>:<span title={item.route}>Target: {item.route}</span>}
       </div></article>)}</div>
     <section className="xc-check"><ShieldCheck size={20}/><div><h2>Evidence required before release</h2>
       <p>Per adapter: server-side owner/tenant authorization, read/write allowlist, idempotent X1 queue record, genuine worker execution, Vercel noindex preview, independent Guardian receipt, and rollback. Nothing is marked E2E_VERIFIED without all relevant evidence.</p>
     </div></section>
     <p className="xc-footer"><Workflow size={15}/> Implementation source: docs/convergence/X1_CONVERGENCE_MASTER_DIRECTIVE_20261020.md · X1-only page, not a Base44 iframe.</p>
   </div>
 </main>;
}
