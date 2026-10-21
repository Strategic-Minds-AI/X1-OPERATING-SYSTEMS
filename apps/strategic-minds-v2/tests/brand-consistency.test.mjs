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
test('Visual X uses authenticated X1 API instead of browser-local fake chat',()=>{
 const s=file('../src/VisualStudio.jsx'),agent=file('../src/X1NativeAgentChat.jsx');
 assert.ok(s.includes('<X1NativeAgentChat suggestion={agentSuggestion}/>'),'native chat mounted');
 assert.ok(s.includes('src="/v2/b"'),'same-origin live site shown in preview');
 assert.ok(s.includes("mode:'review_only'"),'visual edits remain reviewable');
 assert.ok(s.includes('source_repo:\'Strategic-Minds-AI/X1-OPERATING-SYSTEMS\''),'patch targets canonical repo');
 assert.ok(!s.includes('No model was called'),'old mock chat removed');
 assert.ok(agent.includes("fetch('/api/x1/agent-config'"),'native runtime probe');
 assert.ok(agent.includes("fetch('/api/x1/agent-chat'"),'native authenticated API');
 assert.ok(agent.includes('STAGING_CONFIGURED_NOT_AUTHENTICATED'),'fail closed when runtime unavailable');
 assert.ok(agent.includes('create_user:false'),'no automatic signup');
 assert.ok(agent.includes('Request unconfirmed:'),'unconfirmed sends never claim success');
});
