import './BrandTheme.css';
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './global.css';
const V2Experience=React.lazy(()=>import('./V2Experience.jsx'));
const PricingExperience=React.lazy(()=>import('./PricingExperience.jsx'));
const ClientPortalExperience=React.lazy(()=>import('./ClientPortalExperience.jsx'));
const VisualStudio=React.lazy(()=>import('./VisualStudio.jsx'));
const X1AgentConsole=React.lazy(()=>import('./X1AgentConsole.jsx'));
const LaunchStudio=React.lazy(()=>import('./LaunchStudio.jsx'));
const PromptLab=React.lazy(()=>import('./PromptLab.jsx'));
const CodingKanban=React.lazy(()=>import('./CodingKanban.jsx'));
const IntelligenceWorkbench=React.lazy(()=>import('./IntelligenceWorkbench.jsx'));
const MissionControl=React.lazy(()=>import('./MissionControl.jsx'));

function NavigateToHash() {
 const location=useLocation();
 useEffect(()=>{
  if(!location.hash)return;
  const target=decodeURIComponent(location.hash.substring(1));
  const raf=requestAnimationFrame(()=>document.getElementById(target)?.scrollIntoView({behavior:'auto',block:'start'}));
  return ()=>cancelAnimationFrame(raf);
 },[location.pathname,location.hash]);
 return null;
}
function App(){
 return <BrowserRouter><NavigateToHash/><React.Suspense fallback={<div role="status" style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#050d18',color:'#8edfff',fontFamily:'Inter, sans-serif'}}>Loading X1 workspace…</div>}><Routes>
   <Route path="/" element={<Navigate to="/v2/b" replace/>}/>
   <Route path="/v2" element={<Navigate to="/v2/b" replace/>}/>
   <Route path="/v2/:variant" element={<V2Experience/>}/>
   <Route path="/pricing" element={<PricingExperience/>}/>
   <Route path="/portal" element={<ClientPortalExperience/>}/>
   <Route path="/portal/demo" element={<ClientPortalExperience demo/>}/>
   <Route path="/admin/studio" element={<VisualStudio/>}/>
   <Route path="/admin/visual-editor" element={<VisualStudio/>}/>
   <Route path="/admin/coding-kanban" element={<CodingKanban/>}/>
   <Route path="/admin/prompt-lab" element={<PromptLab/>}/>
   <Route path="/admin/intelligence" element={<IntelligenceWorkbench/>}/>
   <Route path="/admin/agent" element={<X1AgentConsole/>}/>
   <Route path="/admin/launch-studio" element={<LaunchStudio/>}/>
   <Route path="/admin/mission-control" element={<MissionControl/>}/>
   <Route path="*" element={<Navigate to="/v2/b" replace/>}/>
 </Routes></React.Suspense></BrowserRouter>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
