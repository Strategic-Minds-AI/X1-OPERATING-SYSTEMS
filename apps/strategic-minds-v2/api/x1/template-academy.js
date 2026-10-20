// X1 read-only adapter for the exact owner-controlled Universal Factory Academy release.
// This is NOT a new scheduler, queue, builder process or release adapter.
const SOURCE="https://universal-factory-academy-frgdq8fol-strategic-minds-advisory.vercel.app";
export const ACADEMY_RELEASE_SHA="059f9e8042aa413d05fcc6955be8a275e187ce26";
const SLUG=/^[a-z0-9][a-z0-9-]{0,63}$/;
const TYPES=new Set(["catalog","academies","template"]);
const fail=(res,status,reason)=>{res.statusCode=status;res.setHeader("Content-Type","application/json; charset=utf-8");res.setHeader("Cache-Control","no-store");res.end(JSON.stringify({status:"BLOCKED",reason}));};
export function resolveAcademyPath(query={}){
 const kind=typeof query.kind==="string"?query.kind:"";
 const id=typeof query.id==="string"?query.id:"";
 const academy=typeof query.academy==="string"?query.academy:"";
 if(!TYPES.has(kind))return null;
 if(kind==="catalog" && !id && !academy)return "/manifest.json";
 if(kind==="academies" && !id && !academy)return "/academies/registry.json";
 if(kind!=="template"||!SLUG.test(id)||academy&&!SLUG.test(academy))return null;
 return academy?"/academies/"+academy+"/sites/"+id+"/index.html":"/sites/"+id+"/index.html";
}
export async function runTemplateAcademy(req,res,{fetchImpl=fetch}={}){
 if(req.method!=="GET"){res.setHeader("Allow","GET");return fail(res,405,"METHOD_NOT_ALLOWED");}
 const query=req.query||Object.fromEntries(new URL(req.url||"/","https://x1.invalid").searchParams);
 const path=resolveAcademyPath(query);
 if(!path)return fail(res,400,"INVALID_ACADEMY_RESOURCE");
 let response;
 try{
  response=await fetchImpl(SOURCE+path,{method:"GET",redirect:"error",signal:AbortSignal.timeout(9000),
   headers:{accept:path.endsWith(".json")?"application/json":"text/html"}});
 }catch{return fail(res,503,"ACADEMY_SOURCE_UNAVAILABLE");}
 if(!response.ok)return fail(res,503,"ACADEMY_SOURCE_REJECTED");
 const max=250000;
 if(Number(response.headers.get("content-length")||0)>max)return fail(res,502,"ACADEMY_SOURCE_TOO_LARGE");
 let body;try{body=await response.text();}catch{return fail(res,503,"ACADEMY_SOURCE_UNAVAILABLE");}
 if(body.length>max)return fail(res,502,"ACADEMY_SOURCE_TOO_LARGE");
 if(path.endsWith(".json")){
  let parsed;try{parsed=JSON.parse(body);}catch{return fail(res,502,"INVALID_ACADEMY_SOURCE");}
  if(path==="/manifest.json" && (!Array.isArray(parsed.templates)||parsed.templates.length!==40))
   return fail(res,502,"INVALID_ACADEMY_CATALOG");
  if(path==="/academies/registry.json" && (!Array.isArray(parsed.academies)||parsed.academies.length!==6))
   return fail(res,502,"INVALID_ACADEMY_CATALOG");
 }else if(!body.includes('data-field=') || !/name="robots"[^>]+noindex/i.test(body)){
  return fail(res,502,"UNSAFE_ACADEMY_TEMPLATE");
 }
 res.statusCode=200;
 res.setHeader("Content-Type",path.endsWith(".json")?"application/json; charset=utf-8":"text/html; charset=utf-8");
 res.setHeader("Cache-Control","public, s-maxage=300, stale-while-revalidate=600");
 res.setHeader("X-X1-Source-SHA",ACADEMY_RELEASE_SHA);
 res.setHeader("X-Content-Type-Options","nosniff");
 res.end(body);
}
export default function handler(req,res){return runTemplateAcademy(req,res);}
