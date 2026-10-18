import './BrandTheme.css';
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import V2Experience from './V2Experience.jsx';
import PricingExperience from './PricingExperience.jsx';
import ClientPortalExperience from './ClientPortalExperience.jsx';
import './global.css';
import VisualStudio from './VisualStudio.jsx';
import X1AgentConsole from './X1AgentConsole.jsx';
import LaunchStudio from './LaunchStudio.jsx';
import PromptLab from './PromptLab.jsx';
import CodingKanban from './CodingKanban.jsx';

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
 return <BrowserRouter><NavigateToHash/><Routes>
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
   <Route path="/admin/agent" element={<X1AgentConsole/>}/>
   <Route path="/admin/launch-studio" element={<LaunchStudio/>}/>
   <Route path="*" element={<Navigate to="/v2/b" replace/>}/>
 </Routes></BrowserRouter>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
