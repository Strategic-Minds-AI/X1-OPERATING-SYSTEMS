import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const forward=readFileSync(new URL('../../../ops/security/x1_staging_admin_agent_chat_20261011.sql',import.meta.url),'utf8');
const rollback=readFileSync(new URL('../../../ops/security/x1_staging_admin_agent_chat_ROLLBACK_20261011.sql',import.meta.url),'utf8');
test('chat schema is staging-only, not another queue or scheduler',()=>{
 assert.match(forward,/uvdkzsbjackpjvpoxtyk/);
 assert.doesNotMatch(forward,/vgsmyhqqtkkluhypxyua/);
 assert.match(forward,/CREATE TABLE public\.x1_admin_chat_turns/);
 assert.doesNotMatch(forward,/\bcron\.schedule\b|\bCREATE\s+EXTENSION\b|\bCREATE\s+ROLE\b/);
});
test('chat table enforces RLS and no direct user grants',()=>{
 assert.match(forward,/ENABLE ROW LEVEL SECURITY/);
 assert.match(forward,/FORCE ROW LEVEL SECURITY/);
 assert.match(forward,/REVOKE ALL ON public\.x1_admin_chat_turns FROM PUBLIC,anon,authenticated/);
 assert.match(forward,/GRANT SELECT,INSERT ON public\.x1_admin_chat_turns TO service_role/);
});
test('tenant, operator, session, request and role jointly identify every immutable turn',()=>{
 assert.match(forward,/UNIQUE\(tenant_id,actor_user_id,session_id,request_id,role\)/);
 assert.match(forward,/REFERENCES public\.x1_tenants\(tenant_id\)/);
 assert.match(forward,/CHECK \(char_length\(content\) BETWEEN 1 AND 8000\)/);
});
test('break glass rollback disables access without destroying transcripts',()=>{
 assert.match(rollback,/REVOKE SELECT,INSERT ON public\.x1_admin_chat_turns FROM service_role/);
 assert.doesNotMatch(rollback,/\bDROP TABLE\b|\bTRUNCATE\b|\bDELETE FROM\b/);
});
