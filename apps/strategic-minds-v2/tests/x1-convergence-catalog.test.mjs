import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {CONVERGENCE_MODULES,KNOWN_STATES,routeReady} from '../src/convergenceCatalog.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const router=readFileSync(join(here,'../src/main.jsx'),'utf8');

test('catalog IDs and destinations are unique, explicit and scoped to admin',()=>{
 const ids=CONVERGENCE_MODULES.map(m=>m.id);
 assert.equal(new Set(ids).size,ids.length);
 assert.equal(new Set(CONVERGENCE_MODULES.map(m=>m.route)).size,CONVERGENCE_MODULES.length);
 for(const m of CONVERGENCE_MODULES){
  assert.match(m.id,/^[a-z0-9-]+$/);
  assert.match(m.route,/^\/admin\//);
  assert.ok(KNOWN_STATES.includes(m.state));
  assert.ok(m.owner && m.name && m.note);
 }
});
test('GPT MCP listing is not mistaken for authenticated X1 adapter',()=>{
 for(const id of ['digital-dominance','seo-generator','unlimited-websites','vision-cortex','fault-line','windsor']){
  const m=CONVERGENCE_MODULES.find(x=>x.id===id);
  assert.equal(m?.state,'ADAPTER_REQUIRED',id);
  assert.equal(routeReady(m),false);
 }
});
test('existing X1 routes do not assert E2E certification',()=>{
 for(const id of ['visual-x','prompt-lab','launch-studio','x1-jobs']){
  const m=CONVERGENCE_MODULES.find(x=>x.id===id);
  assert.equal(m?.state,'ROUTE_PRESENT',id);
  assert.equal(routeReady(m),true);
  assert.ok(router.includes('path="'+m.route+'"'),id);
 }
 assert.equal(CONVERGENCE_MODULES.filter(m=>m.state==='E2E_VERIFIED').length,0);
});
test('new integration-control route is explicitly registered and only read-only',()=>{
 assert.match(router,/path="\/admin\/convergence"/);
 const jsx=readFileSync(join(here,'../src/X1ConvergenceHub.jsx'),'utf8');
 assert.doesNotMatch(jsx,/\b(fetch|XMLHttpRequest|localStorage|sessionStorage)\s*\(/);
 assert.doesNotMatch(jsx,/onClick\s*=/);
 assert.match(jsx,/No automatic production operations/);
});
