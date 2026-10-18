import { test } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
const read=(name)=>readFileSync(new URL(name,import.meta.url),'utf8');
test('no Base44 runtime references in deployed application',()=>{
 const s=read('../src/V2Experience.jsx')+read('../src/main.jsx');
 assert.doesNotMatch(s,/@base44|InvokeLLM|base44\.app|from ['"]base44/);
});
test('all approved V2 variants and call buttons remain',()=>{
 const s=read('../src/V2Experience.jsx');
 for(const term of ["variant==='a'?<Hero", "variant==='b'?<LongPage", "<EdenPage", "CALL EDEN", "CALL NOW", "INTELLIGENCE IN MOTION"])assert.ok(s.includes(term),term);
 assert.ok(s.includes("tel:+18665711174"));assert.ok(s.includes("tel:+17722090266"));
});
test('X1 frontend does not contain dead old marketing href paths',()=>{
 const s=read('../src/V2Experience.jsx'); assert.doesNotMatch(s,/\/strategic-minds#/);
});
test('all direct asset references are self-hosted',()=>{
 for(const asset of ['silver-emblem.png','chrome-wordmark.png','connected-earth.jpg','eden-skye-original.avif']){
  assert.ok(existsSync(new URL('../public/v2-assets/'+asset,import.meta.url)),asset);
 }
});
test('motion honors reduced-motion preferences',()=>{
 const s=read('../src/V2Motion.css');assert.match(s,/prefers-reduced-motion:\s*reduce/);
 for(const marker of ['v2-earth-drift','v2-stardust','v2-eden-heartbeat','v2-nav-tracer'])assert.ok(s.includes(marker));
});
test('preview robots gate is active and onboarding never silently persists client data',()=>{
 assert.match(read('../index.html'),/noindex/);
 assert.match(read('../src/V2Experience.jsx'),/No details have been sent to any server/);
 assert.doesNotMatch(read('../src/V2Experience.jsx'),/fetch\(|localStorage|sessionStorage|axios\./);
});
test('routing provides all three variants',()=>{const s=read('../src/main.jsx');assert.match(s,/\/v2\/:variant/);assert.match(s,/NavigateToHash/);});
