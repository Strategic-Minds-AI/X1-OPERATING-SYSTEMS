// Adapted from the uploaded Universal Template System color-intelligence and deterministic template engines.
// Safe, dependency-free utilities used by Launch Studio. This module never executes template code.

const SECRET_HINTS = /(?:secret|password|token|api[_-]?key|private[_-]?key)/i;

export function renderText(template, vars = {}) {
  if (typeof template !== "string") return "";
  let out = renderEach(template, vars);
  out = renderIf(out, vars);
  return renderVars(out, vars);
}
function resolvePath(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
function renderVars(template, vars) {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, path) => {
    const value = resolvePath(vars, path);
    if (value === undefined || value === null) return "";
    if (SECRET_HINTS.test(path) && typeof value === "string" && value.length) return "[REDACTED]";
    return String(value);
  });
}
function renderIf(template, vars) {
  const pattern = /\{\{#if\s+([^}]+?)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  return template.replace(pattern, (_match, condition, body) => evalCondition(condition, vars) ? renderIf(body, vars) : "");
}
function renderEach(template, vars) {
  const pattern = /\{\{#each\s+([\w.]+)\s*\}\}([\s\S]*?)\{\{\/each\}\}/g;
  return template.replace(pattern, (_match, path, body) => {
    const list = resolvePath(vars, path);
    if (!Array.isArray(list)) return "";
    return list.map((item, index) => renderEach(body, {...vars, this:item, index})
      .replace(/\{\{\s*this\.([\w.]+)\s*\}\}/g, (_m, key) => {
        const value = resolvePath(item, key);
        return value == null ? "" : String(value);
      }).replace(/\{\{\s*index\s*\}\}/g, String(index))).join("");
  });
}
function evalCondition(condition, vars) {
  const cond = condition.trim();
  const equality = cond.match(/^([\w.]+)\s*==\s*(.+)$/);
  if (equality) {
    const left = resolvePath(vars, equality[1]);
    let right = equality[2].trim();
    if ((right.startsWith('"') && right.endsWith('"')) || (right.startsWith("'") && right.endsWith("'"))) right = right.slice(1, -1);
    return String(left) === String(right);
  }
  return !!resolvePath(vars, cond);
}
export function renderFileTree(pack, vars = {}) {
  return (pack?.files || []).map(file => {
    const path = renderText(file.path || file.name || "file.txt", vars);
    return {path, content:renderText(file.content || file.template || "", vars), media_type:file.media_type || guessMediaType(path)};
  });
}
export function guessMediaType(path) {
  const ext = (String(path).split(".").pop() || "").toLowerCase();
  const types = {js:"text/javascript",jsx:"text/javascript",ts:"text/typescript",tsx:"text/typescript",json:"application/json",md:"text/markdown",html:"text/html",css:"text/css",sql:"application/sql",yml:"application/yaml",yaml:"application/yaml",txt:"text/plain",sh:"application/x-sh",py:"text/x-python",svg:"image/svg+xml"};
  return types[ext] || "application/octet-stream";
}
export function validateTemplatePack(pack) {
  const errors = [];
  if (!pack || typeof pack !== "object") return {valid:false,errors:["pack is not an object"]};
  if (!pack.id) errors.push("id is required");
  if (!pack.version) errors.push("version is required");
  if (!pack.mode) errors.push("mode is required");
  if (!Array.isArray(pack.files)) errors.push("files must be an array");
  return {valid:errors.length===0,errors};
}

function hslToHex(h, s, l) {
  s/=100; l/=100;
  const k=n=>(n+h/30)%12;
  const a=s*Math.min(l,1-l);
  const f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));
  const toHex=x=>Math.round(255*x).toString(16).padStart(2,"0");
  return "#"+toHex(f(0))+toHex(f(8))+toHex(f(4));
}
function luminance(hex) {
  const clean=String(hex||"#000000").replace("#","");
  if(!/^[0-9a-f]{6}$/i.test(clean)) return 0;
  const rgb=[0,2,4].map(i=>parseInt(clean.slice(i,i+2),16)/255);
  const linear=v=>v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);
  return 0.2126*linear(rgb[0])+0.7152*linear(rgb[1])+0.0722*linear(rgb[2]);
}
export function contrastRatio(a,b) {
  const x=luminance(a),y=luminance(b);
  return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);
}
export function tonalScale(hue,saturation=100) {
  const tones=[0,10,20,30,40,50,60,70,80,90,95,99,100],scale={};
  tones.forEach(t=>{const sat=t<10||t>95?Math.min(saturation,20):saturation;scale[t]=hslToHex(hue,sat,t);});
  return scale;
}
const ROLE_TONES={"canvas":100,"surface":99,"raised-surface":95,"overlay":90,"text-primary":0,"text-secondary":30,"text-muted":40,"border":90,"divider":92,"primary-action":50,"secondary-action":0,"destructive-action":40,"focus":55,"selection":80,"success":50,"warning":60,"error":45,"information":50};
export function semanticRoles(hue,saturation=100,mode="light") {
  const scale=tonalScale(hue,saturation),roles={};
  Object.entries(ROLE_TONES).forEach(([role,tone])=>{
    let t=tone;
    if(mode==="dark")t=100-tone;
    if(mode==="high-contrast-light")t=tone<50?0:tone>50?100:tone;
    if(mode==="high-contrast-dark")t=100-tone;
    roles[role]=scale[t]||scale[tone];
  });
  return roles;
}
export function generateTokens(seedColor="#176bff") {
  let hex=String(seedColor||"#176bff").replace("#","").toLowerCase();
  if(!/^[0-9a-f]{6}$/i.test(hex))hex="176bff";
  const rgb=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255);
  const max=Math.max(...rgb),min=Math.min(...rgb),delta=max-min;
  let hue=0;
  if(delta!==0){if(max===rgb[0])hue=((rgb[1]-rgb[2])/delta)%6;else if(max===rgb[1])hue=(rgb[2]-rgb[0])/delta+2;else hue=(rgb[0]-rgb[1])/delta+4;hue=Math.round(hue*60);if(hue<0)hue+=360;}
  const primitive={"color.primary":"#"+hex,"color.secondary":"#000000","color.neutral.0":"#FFFFFF","color.neutral.100":"#000000","radius.md":"8px","radius.lg":"12px","radius.full":"9999px","spacing.1":"4px","spacing.2":"8px","spacing.3":"16px","spacing.4":"24px","spacing.5":"32px","spacing.6":"64px"};
  const themes={};["light","dark","high-contrast-light","high-contrast-dark"].forEach(mode=>{themes[mode]=semanticRoles(hue,100,mode);});
  const light=themes.light;
  const contrast_checks={"text-on-canvas":contrastRatio(light["text-primary"],light.canvas),"primary-on-canvas":contrastRatio(light["primary-action"],light.canvas)};
  return {primitive,semantic:themes,contrast_checks,meta:{hue,saturation:100,source:"#"+hex,standard:"DTCG 2025.10"}};
}
export function validateContrast(tokens) {
  const failures=[];
  Object.entries(tokens?.contrast_checks||{}).forEach(([pair,ratio])=>{if(ratio<4.5)failures.push({pair,ratio:Number(ratio.toFixed(2)),required:"4.5 (WCAG AA)"});});
  return failures;
}
export function validateLaunchBlueprint(project,content,tokens) {
  const errors=[],warnings=[];
  if(!project?.businessName?.trim())errors.push("Business name is required.");
  if(!Array.isArray(project?.pages)||project.pages.length===0)errors.push("At least one page is required.");
  if(!Array.isArray(project?.sections)||!project.sections.includes("hero"))errors.push("A hero section is required.");
  if(!content?.headline?.trim())errors.push("Hero headline is required.");
  if(!content?.primaryCta?.trim())errors.push("Primary conversion CTA is required.");
  if(!content?.serviceCards?.length)warnings.push("No service/product cards have been defined.");
  if(!project?.location?.trim())warnings.push("Local GEO target is missing.");
  const contrastFailures=validateContrast(tokens);
  contrastFailures.forEach(f=>warnings.push("Contrast review required for "+f.pair+" ("+f.ratio+":1)."));
  if(!Array.isArray(project?.sections)||!project.sections.includes("contact"))warnings.push("No contact section selected.");
  return {status:errors.length?"BLOCKED":warnings.length?"REVIEW_REQUIRED":"READY_FOR_OPERATOR_REVIEW",errors,warnings,contrastFailures,checks:{pages:Array.isArray(project?.pages)?project.pages.length:0,sections:Array.isArray(project?.sections)?project.sections.length:0,serviceCards:content?.serviceCards?.length||0,seoConfigured:!!content?.seoTitle&&!!content?.seoDescription,tokenStandard:tokens?.meta?.standard||"unknown"}};
}
