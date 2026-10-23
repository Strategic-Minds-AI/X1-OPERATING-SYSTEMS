import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {QUESTIONS,CONCEPTS,STAGES,transformGoal,toQueuePacket,missionProgress} from '../src/missionEngine.js';
const goal='Build a premium epoxy floor website with visual estimates and appointment booking';
test('one sentence creates complete mission and ten design directions',()=>{
 const x=transformGoal(goal);assert.equal(x.ok,true);assert.equal(QUESTIONS.length,7);
 assert.equal(STAGES.length,10);assert.equal(CONCEPTS.length,10);assert.equal(x.concepts.length,10);
 assert.ok(x.prompt.includes('EXISTING Strategic Minds AI admin'));
});
test('invalid goal cannot be queued',()=>{assert.equal(transformGoal('short').ok,false);
 assert.throws(()=>toQueuePacket({ok:false}),/MISSION_INVALID/);});
test('optional details are bounded, and control characters sanitized',()=>{
 const x=transformGoal(goal,{features:'CRM\u0000'+('x'.repeat(700))});
 assert.equal(x.answers.features.length,180);assert.ok(!x.answers.features.includes('\u0000'));
});
test('work item uses canonical queue-compatible contract and protected release',()=>{
 const v=toQueuePacket(transformGoal(goal),'Premium cinematic');assert.equal(v.category,'website-factory');
 assert.ok(v.description.length<4000);assert.equal(v.acceptanceCriteria.length,8);
 assert.ok(v.acceptanceCriteria.some(x=>x.includes('Guardian')));
 assert.ok(v.acceptanceCriteria.some(x=>x.includes('approval')));
});
test('queue completion does not certify Guardian or production release',()=>{
 const p=missionProgress({status:'COMPLETED'},true);
 assert.equal(p[5].status,'WORKER_COMPLETE_UNVALIDATED');
 assert.equal(p[6].status,'NOT_RUN');assert.equal(p[7].status,'NOT_RUN');
 assert.equal(p[8].status,'NOT_RUN');assert.equal(p[9].status,'NOT_RUN');
});
test('dead letters are never automatically marked complete',()=>{
 const p=missionProgress({status:'DEAD_LETTER'},true);
 assert.equal(p[5].status,'DEAD_LETTER');assert.equal(p[8].status,'NOT_RUN');
});
test('mission console reuses existing authenticated endpoints and does not embed secrets',()=>{
 const ui=readFileSync(new URL('../src/MissionControl.jsx',import.meta.url),'utf8');
 assert.ok(ui.includes('/api/x1/agent-config'));
 assert.ok(ui.includes('/api/x1/work-items'));
 assert.ok(ui.includes('/api/x1/worker-status'));
 assert.ok(ui.includes('/auth/v1/verify'));
 assert.ok(!ui.includes('SUPABASE_SERVICE_ROLE_KEY'));
 assert.ok(!ui.includes('STRIPE_SECRET_KEY'));
});
test('existing public homepage remains authoritative',()=>{
 const src=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');
 assert.match(src,/path="\/" element=\{<Navigate to="\/v2\/b"/);
 assert.ok(src.includes('/admin/mission-control'));
});
