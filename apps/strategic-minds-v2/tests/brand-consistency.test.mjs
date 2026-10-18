import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=x=>readFileSync(new URL(x,import.meta.url),'utf8');
test('Approved homepage palette is canonical',()=>{
 const h=file('../src/V2Experience.css'),b=file('../src/BrandTheme.css'),main=file('../src/main.jsx');
 const tokens={canvas:'#02050d',header:'#02060f',surface:'#030914',cyan:'#02cfff',blue:'#128cff',green:'#66ff9c',white:'#f6fbff'};
 for(const [name,hex] of Object.entries(tokens))assert.ok(b.includes('--smai-'+name+':'+hex+';'),name);
 assert.ok(h.includes('--v2-cyan:var(--smai-cyan)'));
 assert.ok(h.includes('--v2-lime:var(--smai-green)'));
 assert.ok(main.includes("import './BrandTheme.css'"));
 assert.ok(main.includes('"/admin/studio"'));
});
test('Commerce and Studio inherit canonical colors',()=>{
 const c=file('../src/CommercePortal.css'),s=file('../src/VisualStudio.css');
 for(const variable of ['--smai-canvas','--smai-cyan','--smai-green']){
  assert.ok(c.includes('var('+variable+')'),variable+' commerce');
  assert.ok(s.includes('var('+variable+')'),variable+' studio');
 }
 assert.ok(c.includes('.cp-site .cp-pricing-hero'));
 assert.ok(s.includes('.x1-studio .x1-topbar'));
});
test('All major views use the original metallic S',()=>{
 const paths=['V2Experience.jsx','PricingExperience.jsx','ClientPortalExperience.jsx','VisualStudio.jsx'];
 for(const p of paths)assert.ok(file('../src/'+p).includes('/v2-assets/silver-emblem.png'),p);
 assert.ok(file('../src/V2Experience.jsx').includes('className="v2-header-s"'));
});
test('Studio agent statuses disclose unbound runtime',()=>{
 const s=file('../src/VisualStudio.jsx');
 for(const k of ['UNBOUND','No model was called','not a live sandbox'])assert.ok(s.includes(k),k);
 assert.doesNotMatch(s,/\bfetch\(/);
});
