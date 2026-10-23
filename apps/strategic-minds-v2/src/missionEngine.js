// X1 unified mission protocol. Pure planning: no network, credentials or side effects.
export const QUESTIONS=[
 ['audience','Who is the customer?'],['market','Which market or cities?'],
 ['offer','What will you sell or deliver?'],['brand','What brand and visual style?'],
 ['features','Which features must work?'],['conversion','What customer action matters?'],
 ['constraints','Budget, legal scope and approvals?']
];
export const STAGES=[
 ['intake','Goal & onboarding','X1 Discovery'],['research','Competitive intelligence','Vision Cortex'],
 ['design','Ten visual directions','Launch Studio'],['prompt','Prompt transformation','Prompt Lab'],
 ['queue','Authorized task','Existing X1 queue'],['build','Sandbox build','Autonomous Code Factory'],
 ['guardian','Independent Guardian','APEX validator'],['preview','Browser preview','Cloud Browser / Vercel'],
 ['release','Approved release','X1 Release Controller'],['growth','SEO · social · revenue','Digital Dominance']
];
export const CONCEPTS=[
 ['Premium cinematic','Midnight / chrome'],['Local conversion','Graphite / gold'],
 ['Editorial authority','Warm neutral'],['Modern SaaS','Indigo / electric'],
 ['Commerce','Ivory / coral'],['Portfolio','Charcoal / copper'],
 ['Enterprise','Deep navy / cyan'],['Community','Cream / evergreen'],
 ['Luxury concierge','Black / champagne'],['Data platform','Emerald / graphite']
];
export const STATES=['DRAFT','PENDING','LEASED','COMPLETED','FAILED','BLOCKED','DEAD_LETTER'];
function clean(s,n=180){return String(s??'').replace(/[\x00-\x1f\x7f]/g,' ').replace(/\s+/g,' ').trim().slice(0,n);}
export function transformGoal(text,context={}){
 const goal=clean(text,700);
 if(goal.length<12)return {ok:false,error:'Describe the goal in at least 12 characters.'};
 const answers=Object.fromEntries(QUESTIONS.map(([id])=>[id,clean(context[id],180)]));
 const lines=[
 'X1 GOVERNED MISSION (STAGING DRAFT — NOT A DEPLOYED BUILD)',
 'Goal: '+goal,...QUESTIONS.map(([k,label])=>label+' '+(answers[k]||'[unanswered: discover and verify]')),
 'Use the EXISTING Strategic Minds AI admin, Visual Studio, Launch Studio, Prompt Lab and tenant-scoped Supabase queue. No duplicate scheduler, control plane or worker.',
 'Deliver 10 original visual mockups for approval, evidence-backed competitor research, a versioned build specification, source branch, functional tests, independent Guardian receipt, noindex browser preview, and approval-gated release.',
 'Include Stripe TEST billing, consented SMS/MMS, social automation, Google Search Console, GA4 and attribution only after separately verified bindings and permissions.',
 'No secret leakage, fake reviews, doorway-page spam, unsupported rankings, live charges, mass outreach, production publishing or DNS changes. Fail closed without evidence.',
 'Limit repairs to 3 cycles; preserve exact SHA, work_id, owner, tenant, costs, failure fingerprints and rollback receipts.'
 ];
 return {ok:true,goal,title:goal.slice(0,112),answers,prompt:lines.join('\n'),
   concepts:CONCEPTS.map(([name,palette],i)=>({id:i+1,name,palette,status:'IDEA_NOT_RENDERED'})),
   stages:STAGES.map(([id,label,agent])=>({id,label,agent,status:id==='intake'?'LOCAL_DRAFT':'NOT_RUN'}))};
}
export function toQueuePacket(mission,chosen=''){
 if(!mission?.ok)throw new Error('MISSION_INVALID');
 return {title:mission.title,category:'website-factory',description:(mission.prompt+'\nSelected visual direction: '+(clean(chosen)||'NOT_SELECTED')).slice(0,3950),
  acceptanceCriteria:[
   'Existing website and public deployments remain unchanged.',
   'Source/tenant/lease identity and receipt verified on canonical queue.',
   'Original ten design directions and selected mockup recorded.',
   'Noindex preview from pinned Git commit; browser desktop/mobile proof.',
   'Functional, accessibility, security and tenant isolation tests.',
   'Independent Guardian signoff at exact source SHA.',
   'Explicit approval before public release, payments or outbound messages.',
   'Cost accounting, rollback, monitor loop and resumable handoff.'
  ]};
}
export function missionProgress(queueRow,planned){
 const steps=STAGES.map(([id,label,agent])=>({id,label,agent,status:'NOT_RUN'}));
 if(planned)steps[0].status='LOCAL_DRAFT';
 if(!queueRow)return steps;
 steps[4].status=queueRow.status==='DRAFT'?'DRAFT_SAVED':STATES.includes(queueRow.status)?queueRow.status:'UNKNOWN';
 if(queueRow.status==='LEASED')steps[5].status='LEASE_REPORTED';
 if(queueRow.status==='COMPLETED')steps[5].status='WORKER_COMPLETE_UNVALIDATED';
 if(['BLOCKED','FAILED','DEAD_LETTER'].includes(queueRow.status))steps[5].status=queueRow.status;
 // No queue state can authorize Guardian, release, paid marketing or production.
 return steps;
}