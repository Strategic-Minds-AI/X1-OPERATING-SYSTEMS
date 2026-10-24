import { createHash } from "node:crypto";
import { mkdir, open, readFile } from "node:fs/promises";
import path from "node:path";

const OUTPUT = path.resolve(process.cwd(), "artifacts", "candidates");
const clean = (s:string) => s.replace(/[\u0000-\u001f\u007f]/g," ").trim().slice(0, 180);
const escapeHTML=(s:string)=>clean(s).replace(/[&<>"']/g,c=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]!));

export type SiteKind="website" | "app";
export function renderCandidate(goal:string, title:string, kind:SiteKind) {
  const g=escapeHTML(goal),t=escapeHTML(title);
  const isApp=kind==="app";
  const headline=isApp?"Calculate. Compare. Decide.":"Built to stand out. Designed to convert.";
  const kindSection=isApp?`
    <section class="calculator" id="tool" aria-labelledby="calc-h2">
      <p class="kicker">YOUR WORKSPACE</p><h2 id="calc-h2">Project estimate calculator</h2>
      <p class="muted">Illustrative calculations only. No real pricing data is connected.</p>
      <div class="calcrow"><label>Area (sq ft)<input id="area" type="number" min="0" max="100000" value="400"></label><label>Rate ($/sq ft)<input id="rate" type="number" min="0" max="1000" step=".5" value="7"></label></div>
      <div class="total"><span>Illustrative estimate</span><strong id="result">$2,800</strong></div>
      <p id="error" role="status" aria-live="polite"></p>
    </section>`:`
    <section class="calculator" id="tool" aria-labelledby="calc-h2">
      <p class="kicker">HOW IT WORKS</p><h2 id="calc-h2">From your idea to a clear plan</h2>
      <div class="cards"><article><b>01</b><h3>Discover</h3><p>Understand the goal and the audience.</p></article><article><b>02</b><h3>Design</h3><p>Choose a direction worth building.</p></article><article><b>03</b><h3>Deliver</h3><p>Validate the experience before launch.</p></article></div>
    </section>`;
  const appScript=isApp?`<script>
    const area=document.getElementById('area'); const rate=document.getElementById('rate'); const result=document.getElementById('result'); const error=document.getElementById('error');
    function recalc(){const a=Number(area.value), r=Number(rate.value);if(!Number.isFinite(a)||!Number.isFinite(r)||a<0||r<0||a>100000||r>1000){result.textContent='—';error.textContent='Enter values within the displayed limits';return}error.textContent='';result.textContent=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(a*r)}
    area.addEventListener('input',recalc);rate.addEventListener('input',recalc);recalc();
  </script>`:"";
  return `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${t} — Preview</title><meta name="description" content="${g}">
<meta name="robots" content="noindex,nofollow">
<style>
:root{font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#0b0e13;color:#f8f5ed}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;line-height:1.5}a{color:inherit}button,input{font:inherit}
nav{display:flex;justify-content:space-between;align-items:center;padding:24px clamp(22px,5vw,80px);border-bottom:1px solid #343943}.logo{font-weight:900;letter-spacing:.08em}.logo span{color:#f3c15b}
nav a{font-size:12px;font-weight:700;text-decoration:none;border:1px solid #555b62;border-radius:8px;padding:12px 16px}
main{max-width:1400px;margin:auto}.hero{padding:clamp(70px,10vw,150px) clamp(22px,7vw,105px);background:radial-gradient(circle at 88% 12%,#293748,#0b0e13 55%)}
.kicker{font-size:12px;letter-spacing:.2em;font-weight:800;color:#f3c15b;text-transform:uppercase}.hero h1{font-size:clamp(48px,7vw,104px);line-height:1.02;max-width:950px;letter-spacing:-.055em;margin:20px 0}
.hero p{max-width:640px;color:#bac4cc;font-size:clamp(17px,2.2vw,21px)}.button{display:inline-flex;text-decoration:none;color:#14110c;background:#f3c15b;padding:17px 26px;border-radius:8px;font-weight:800;margin-top:25px}
.stats{display:flex;gap:25px;margin-top:55px;flex-wrap:wrap;font-size:12px;color:#a7b0be}.stats span{padding-left:14px;border-left:2px solid #f3c15b}
.calculator{padding:75px clamp(22px,7vw,105px);border-top:1px solid #323945}.calculator h2{font-size:clamp(30px,5vw,54px);margin:0 0 18px;max-width:650px}.muted{color:#b8bfcb}
.calcrow,.cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;max-width:700px}.calcrow label{display:grid;gap:8px;color:#b9c4d1;font-size:12px}.calcrow input{border:1px solid #56616f;background:#141c26;color:white;border-radius:8px;padding:14px;max-width:100%}
.cards{grid-template-columns:repeat(3,minmax(0,1fr));max-width:none}.cards article{background:#171f2a;border:1px solid #344354;padding:24px;border-radius:10px}.cards b{color:#f3c15b}.cards h3{margin:10px 0}.cards p{color:#b0bac6}
.total{display:flex;justify-content:space-between;align-items:center;background:#192332;padding:30px;border-radius:14px;margin-top:18px;max-width:700px}.total strong{font-size:34px;color:#f3c15b}
footer{padding:25px clamp(22px,7vw,105px);border-top:1px solid #343943;color:#b6c0ce;font-size:12px}
@media(max-width:650px){nav{padding:18px 22px}.cards,.calcrow{grid-template-columns:1fr}.hero{padding-top:85px}.total strong{font-size:23px}}
</style></head>
<body><nav><div class="logo">${t}<span>.</span></div><a href="#tool">Explore</a></nav>
<main><section class="hero"><p class="kicker">STRATEGIC MINDS · ISOLATED CANDIDATE</p><h1>${headline}</h1><p>${g}</p><a class="button" href="#tool">${isApp?"Open calculator":"Explore our approach"} →</a>
<div class="stats"><span>Preview only</span><span>Not published</span><span>Independent QA pending</span></div></section>
${kindSection}</main><footer>${t} · Concept preview · No customer data collected · Not approved for production</footer>
${appScript}</body></html>`;
}
export async function createCandidate(goal:string,title:string,kind:SiteKind) {
 if (process.env.NODE_ENV === "production") throw new Error("PREVIEW_WRITE_DENIED: production requires authenticated tenant gateway");
 const g=clean(goal), t=clean(title);
 if(g.length<3||t.length<3) throw new Error("Goal/title too short");
 const id=createHash("sha256").update(JSON.stringify({g,t,kind,version:2})).digest("hex").slice(0,16);
 const root=path.join(OUTPUT,id);
 await mkdir(root,{recursive:true,mode:0o700});
 const file=path.join(root,"index.html");
 const source=renderCandidate(g,t,kind);
 try {
   const h=await open(file,"wx",0o600);
   try {await h.writeFile(source,"utf8")} finally {await h.close()}
 } catch(error:any) { if(error.code!=="EEXIST") throw error; }
 const bytes=await readFile(file);
 const sha256=createHash("sha256").update(bytes).digest("hex");
 return {candidateId:id,kind,title:t,goal:g,localPath:file,sha256,bytes:bytes.length,
   publication:"NOT_PUBLISHED",quality:"NOT_INDEPENDENTLY_VERIFIED",
   nextStep:"Run validate_site_preview and obtain independent browser QA."};
}
export async function validateCandidate(id:string) {
 if(!/^[a-f0-9]{16}$/.test(id)) throw new Error("Invalid candidate ID");
 const file=path.join(OUTPUT,id,"index.html");
 const src=await readFile(file,"utf8");
 const checks=[
   {name:"doctype",pass:src.startsWith("<!doctype html>")},
   {name:"responsive-viewport",pass:src.includes('name="viewport"')},
   {name:"noindex-preview",pass:src.includes('content="noindex,nofollow"')},
   {name:"semantic-main",pass:src.includes("<main>")&&src.includes("</main>")},
   {name:"primary-heading",pass:src.includes("<h1>")},
   {name:"escape-and-no-remote-scripts",pass:!/<script[^>]+src=/i.test(src)&&!/<iframe/i.test(src)},
   {name:"isolation-banner",pass:src.includes("Not approved for production")}
 ];
 return {candidateId:id,checks,passed:checks.filter(c=>c.pass).length,failed:checks.filter(c=>!c.pass).length,
   browserQA:"NOT_RUN",accessibilityAudit:"NOT_RUN",independentQA:"NOT_RUN",releaseAuthorized:false};
}
