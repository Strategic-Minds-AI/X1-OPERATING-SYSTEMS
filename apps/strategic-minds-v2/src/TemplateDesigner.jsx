import React,{useEffect,useMemo,useState} from "react";
import {Link} from "react-router-dom";
import {ArrowLeft,ArrowUpRight,BookOpen,Check,ChevronDown,Download,ExternalLink,FileCode,FileJson,Layers,Monitor,RefreshCw,Search,ShieldCheck,Smartphone,Tablet,Workflow} from "lucide-react";
import "./TemplateDesigner.css";

const SOURCE_SHA="059f9e8042aa413d05fcc6955be8a275e187ce26";
const SOURCE="https://universal-factory-academy.vercel.app";
const SIZE={desktop:1440,tablet:868,mobile:390};
const initFields=t=>({
 brand:t.brand||"",headline:t.headline||"",subtitle:t.subtitle||"",
 category:t.category||t.industry||"",cta:t.cta||"",
 services:Array.isArray(t.services)?t.services.slice(0,3):["","",""],
 accent:/^#[a-f0-9]{6}$/i.test(t.accent||"")?t.accent:"#02cfff"
});
async function readAcademy(path){
 const res=await fetch("/api/x1/template-academy?"+path,{cache:"no-store"});
 const text=await res.text();
 if(!res.ok){let reason="ACADEMY_UNAVAILABLE";try{reason=JSON.parse(text).reason||reason}catch{}throw Error(reason);}
 return text;
}
export function applyTemplateFields(original,fields){
 if(typeof DOMParser==="undefined")throw Error("BROWSER_RENDER_REQUIRED");
 if(!original.includes("data-field=")||!original.includes('name="robots"'))throw Error("UNSAFE_TEMPLATE");
 const doc=new DOMParser().parseFromString(original,"text/html");
 for(const k of ["brand","headline","subtitle","category","cta"]){
  doc.querySelectorAll('[data-field="'+k+'"]').forEach(node=>{node.textContent=String(fields[k]||"")});
 }
 for(let i=0;i<3;i++)doc.querySelectorAll('[data-service="'+i+'"]').forEach(node=>{node.textContent=String(fields.services?.[i]||"")});
 doc.body.style.setProperty("--accent",fields.accent);
 doc.title=(fields.brand||"Untitled")+" | "+(fields.category||"Website")+" template";
 const description=doc.querySelector('meta[name="description"]');
 if(description)description.setAttribute("content",String(fields.subtitle||"").slice(0,240));
 const robots=doc.querySelector('meta[name="robots"]');
 if(robots)robots.setAttribute("content","noindex,nofollow,noarchive");
 // HTML is confined to a sandboxed iframe; scripts are not permitted in the canvas.
 return "<!doctype html>\n"+doc.documentElement.outerHTML;
}
export function configForExport(template,academy,fields){
 return {generator:"X1 Universal Factory Template Designer",format:"studio-config-v1",
  template_id:template.id,industry_academy:academy?.id||null,
  source_repository:"Strategic-Minds-AI/universal-auto-builder-digital-dominance-template",
  source_commit_sha:SOURCE_SHA,source_template:template.source,
  brand:fields.brand.trim(),industry:fields.category.trim(),headline:fields.headline.trim(),
  subtitle:fields.subtitle.trim(),cta:fields.cta.trim(),services:fields.services.map(x=>x.trim()),
  accent:fields.accent,synthetic:true,publication_status:"preview_only_requires_verified_business_data_and_release_approval",
  x1_release_gate:"existing_queue_preview_independent_qa_owner_approval"};
}
function slug(s){return String(s||"website").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,55)||"website"}
function download(name,contents,type){
 const blob=new Blob([contents],{type});const url=URL.createObjectURL(blob);
 const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function CopyPrompt({data,onResult}){
 async function copy(){
  if(!data)return;
  const lines=["Create an original, accessible website using the owned Universal Factory Academy design.",
   "Preserve the structure of the chosen template; no unapproved layout redesign.",
   "Template ID: "+data.template_id,"Industry academy: "+(data.industry_academy||"master library"),
   "Brand: "+data.brand,"Industry: "+data.industry,"Headline: "+data.headline,
   "Description: "+data.subtitle,"CTA: "+data.cta,"Services: "+data.services.join("; "),"Accent: "+data.accent,
   "Source SHA: "+data.source_commit_sha,
   "Release only with verified business data, real operational forms, noindex preview, accessibility checks, independent QA, and operator approval.",
   "Use the existing X1 queue and receipt pipeline; never create a duplicate orchestrator."];
  try{await navigator.clipboard.writeText(lines.join("\n"));onResult("Generator brief copied.");}
  catch{onResult("Clipboard is unavailable; use Export JSON instead.")}
 }
 return <button type="button" disabled={!data} onClick={copy} className="td-button td-ghost"><Workflow size={15}/> Copy build brief</button>;
}
export default function TemplateDesigner(){
 const [catalog,setCatalog]=useState([]),[academies,setAcademies]=useState([]);
 const [academyId,setAcademyId]=useState("all"),[search,setSearch]=useState("");
 const [selectedId,setSelectedId]=useState(""),[fields,setFields]=useState(initFields({}));
 const [original,setOriginal]=useState(""),[loading,setLoading]=useState(true),[sourceLoading,setSourceLoading]=useState(false);
 const [error,setError]=useState(""),[message,setMessage]=useState("");
 const [viewport,setViewport]=useState("desktop"),[activePane,setActivePane]=useState("edit");
 const academy=academies.find(x=>x.id===academyId)||null;
 const matches=useMemo(()=>catalog.filter(t=>(!academy||academy.templateIds?.includes(t.id)) &&
   [t.id,t.name,t.brand,t.category,t.recipe].join(" ").toLowerCase().includes(search.toLowerCase())),[catalog,academy,search]);
 const selected=catalog.find(t=>t.id===selectedId);
 const preview=useMemo(()=>{
  if(!original||!selected)return "";
  try{return applyTemplateFields(original,fields)}catch{return ""}
 },[original,selected,fields]);
 const config=selected?configForExport(selected,academy,fields):null;
 useEffect(()=>{let live=true;(async()=>{
  try{
   const [one,two]=await Promise.all([readAcademy("kind=catalog"),readAcademy("kind=academies")]);
   const manifest=JSON.parse(one),registry=JSON.parse(two);
   if(!Array.isArray(manifest.templates)||manifest.templates.length!==40||
      !Array.isArray(registry.academies)||registry.academies.length!==6)throw Error("CATALOG_INCOMPLETE");
   if(!live)return;
   setCatalog(manifest.templates);setAcademies(registry.academies);
   const requested=new URLSearchParams(window.location.search);
   const category=requested.get("academy");const design=requested.get("template");
   const matching=registry.academies.find(a=>a.id===category);
   if(matching)setAcademyId(matching.id);
   const first=(matching?.templateIds||manifest.templates.map(t=>t.id))[0];
   setSelectedId(manifest.templates.some(t=>t.id===design && (!matching || matching.templateIds.includes(design)))?design:first);
  }catch(e){if(live)setError("Academy connection failed: "+e.message)}
  finally{if(live)setLoading(false)}
 })();return()=>{live=false}},[]);
 useEffect(()=>{if(!selected)return;let cancelled=false;
  const chosen=academy?.templateIds?.includes(selected.id)?academy:null;
  const fresh=initFields(chosen?{...selected,...chosen.preset}:selected);
  setFields(fresh);setOriginal("");setError("");setSourceLoading(true);setMessage("");
  const params=new URLSearchParams({kind:"template",id:selected.id});
  if(chosen)params.set("academy",chosen.id);
  readAcademy(params.toString()).then(html=>{
   if(cancelled)return;
   if(!html.includes("data-field=")||!html.includes('name="robots"'))throw Error("UNSAFE_ACADEMY_TEMPLATE");
   setOriginal(html);
  }).catch(e=>{if(!cancelled)setError("Template source failed: "+e.message)})
   .finally(()=>{if(!cancelled)setSourceLoading(false)});
  return()=>{cancelled=true}
 },[selectedId,academyId,catalog.length,academies.length]);
 function chooseAcademy(id){
  setAcademyId(id);setSearch("");const next=academies.find(a=>a.id===id);
  if(next){setSelectedId(next.templateIds[0]);}
  else{setSelectedId(catalog[0]?.id||"")}
 }
 function edit(key,value){setFields(old=>({...old,[key]:value}))}
 function editService(i,value){setFields(old=>({...old,services:old.services.map((s,j)=>i===j?value:s)}))}
 function reset(){if(!selected)return;setFields(initFields(academy?{...selected,...academy.preset}:selected));setMessage("Restored the source design.");}
 function exportHtml(){
  if(!preview||!selected)return;download(slug(fields.brand)+"-"+selected.id+".html",preview,"text/html;charset=utf-8");
  setMessage("HTML exported. It is a preview file, not a published site.");
 }
 function exportConfig(){
  if(!config)return;download(slug(fields.brand)+"-"+selected.id+".json",JSON.stringify(config,null,2)+"\n","application/json;charset=utf-8");
  setMessage("Versioned design configuration exported.");
 }
 const upstreamPath=selected?(academy?.templateIds?.includes(selected.id)?"/academies/"+academy.id+"/sites/"+selected.id+"/":"/sites/"+selected.id+"/"):"/";
 return <div className="td-app">
  <header className="td-header">
   <div className="td-heading"><Link to="/admin/launch-studio" className="td-back"><ArrowLeft size={16}/> Launch Studio</Link>
    <div className="td-eyebrow"><span className="td-status-dot"/> X1 UNIVERSAL SITE FACTORY / OWNER-CONTROLLED TEMPLATE ENGINE</div>
    <h1><span>Template</span> Designer</h1>
    <p>Forty complete layout sources, six industry academies, thirty-six tailored variants — one source-controlled template workflow.</p>
   </div>
   <div className="td-links"><a href={SOURCE+"/academies/"} target="_blank" rel="noreferrer"><BookOpen size={16}/> Industry guides <ArrowUpRight size={14}/></a>
    <a href={SOURCE+"/studio/"} target="_blank" rel="noreferrer"><ExternalLink size={16}/> Original academy</a></div>
  </header>
  <div className="td-workspace">
   <aside className="td-sidebar" aria-label="Template selection and customization">
    <div className="td-step"><Layers size={16}/> 01 / Select your design</div>
    <label htmlFor="td-academy">Industry academy</label>
    <div className="td-select-wrap"><select id="td-academy" value={academyId} onChange={e=>chooseAcademy(e.target.value)}>
      <option value="all">Universal master library · 40</option>
      {academies.map(a=><option key={a.id} value={a.id}>{a.name} · 6</option>)}
    </select><ChevronDown size={15}/></div>
    <label htmlFor="td-search">Find a design</label>
    <div className="td-search"><Search size={15}/><input id="td-search" placeholder="Search layouts, categories, recipes" value={search} onChange={e=>setSearch(e.target.value)}/></div>
    <div className="td-library" role="list" aria-label="Available design templates">
     {matches.map(t=><button role="listitem" key={t.id} type="button" className={"td-template"+(t.id===selectedId?" is-active":"")} onClick={()=>{setSelectedId(t.id);setActivePane("edit")}}>
      <span className="td-template-index">{String(t.index).padStart(2,"0")}</span><span><strong>{t.name}</strong><small>{t.category} · {t.origin==="recipe-interpretation"?"Digital Dominance":"Auto Builder"}</small></span>
      {t.id===selectedId?<Check size={16} className="td-active-check"/>:null}
     </button>)}
     {!matches.length&&!loading&&<p className="td-empty">No designs match this filter.</p>}
    </div>
    <div className="td-step"><Layers size={16}/> 02 / Customize website</div>
    <div className="td-fields">
     {[["brand","Brand name",70],["headline","Hero headline",130],["subtitle","Description",240],["category","Industry",55],["cta","Primary action",48]].map(([id,name,max])=>
      <label key={id}>{name}{id==="headline"||id==="subtitle"?
       <textarea maxLength={max} rows={id==="subtitle"?3:2} value={fields[id]} onChange={e=>edit(id,e.target.value)}/>
       :<input maxLength={max} value={fields[id]} onChange={e=>edit(id,e.target.value)}/>}</label>)}
     {fields.services.map((s,i)=><label key={i}>Service {i+1}<input maxLength={75} value={s} onChange={e=>editService(i,e.target.value)}/></label>)}
     <label>Accent color <span className="td-color-control"><input type="color" value={fields.accent} onChange={e=>edit("accent",e.target.value)}/><span>{fields.accent.toUpperCase()}</span></span></label>
    </div>
   </aside>
   <main className="td-editor">
    <div className="td-toolbar">
     <div className="td-live"><span className="td-status-dot"/> LIVE GENERATED HTML PREVIEW</div>
     <div className="td-toolbar-group" aria-label="Responsive viewport controls">
      {Object.entries(SIZE).map(([name,w])=><button type="button" key={name} aria-pressed={viewport===name} className={viewport===name?"active":""} onClick={()=>setViewport(name)} title={name+" viewport "+w+"px"}>{name==="desktop"?<Monitor size={15}/>:name==="tablet"?<Tablet size={15}/>:<Smartphone size={15}/>}<span>{name}</span></button>)}
     </div>
     <button type="button" className="td-reset" onClick={reset}><RefreshCw size={15}/> Reset</button>
    </div>
    <div className="td-canvas">
     {error?<div className="td-error" role="alert"><ShieldCheck size={23}/><h2>Template unavailable</h2><p>{error}</p></div>
      :loading||sourceLoading?<div className="td-loading" role="status">Loading owned Academy source and visual preview…</div>
      :!preview?<div className="td-loading">Choose a source template to start.</div>
      :<div className="td-browser" style={{width:SIZE[viewport]}}>
       <div className="td-browserbar"><span className="td-browserlights">● ● ●</span><span>{selected?.id} / {viewport.toUpperCase()} / ORIGINAL ACADEMY DESIGN</span><span>↗</span></div>
       <iframe key={selectedId+"-"+academyId} title={"Website preview "+selected?.name} srcDoc={preview} sandbox="allow-same-origin" referrerPolicy="no-referrer" />
      </div>}
    </div>
    <div className="td-output">
     <div className="td-output-copy"><div className="td-eyebrow">03 / REPLICATE & EXPORT</div><h2>Own the design. Keep the source.</h2>
      <p>Export standalone HTML and a reproducible configuration. Customer publication still uses X1's existing approvals and validation gates.</p>
      <span className="td-hash">Academy release SHA {SOURCE_SHA.slice(0,12)}…</span></div>
     <div className="td-actions">
      <button disabled={!preview} type="button" onClick={exportHtml} className="td-button td-primary"><FileCode size={16}/> Export website HTML <Download size={14}/></button>
      <button disabled={!config} type="button" onClick={exportConfig} className="td-button td-ghost"><FileJson size={16}/> Export JSON</button>
      <CopyPrompt data={config} onResult={setMessage}/>
      <a href={SOURCE+upstreamPath} rel="noreferrer" target="_blank" className="td-button td-ghost"><ExternalLink size={16}/> View original</a>
     </div>
    </div>
    <div className="td-footer" role="status">
     <ShieldCheck size={16}/><span>{message||"Preview exports remain noindex until verified business information, forms, accessibility, independent QA and explicit release approval are complete."}</span>
    </div>
   </main>
  </div>
 </div>;
}
