-- SECURITY PATCH SI-2026-10-11-A | STRATEGIC INTELLIGENCE ONLY
-- Supabase Project: jadlpbokfdkonvnfxjzs
-- Approved operator scope: specifically 10 public tables; non-destructive ACL/RLS hardening.
-- Preflight verified: all 10 exist, owner postgres, RLS disabled, no policies.
-- Metadata rollback at ops/security/si_anon_guard_rollback_20261011.sql
-- No rows are modified; frontend authenticated clients remain otherwise unchanged.
-- IMPORTANT: This is a Phase-1 emergency guard, not full authenticated tenant RLS.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
DO $guard$
DECLARE target_name text;
BEGIN
  -- Fail closed on schema drift, missing tables, or previously changed RLS configuration.
  IF (SELECT COUNT(*)
       FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
       WHERE n.nspname='public' AND c.relkind IN ('r','p')
         AND c.relname = ANY(ARRAY[
           'agent_secret','client_tasks','ideas','onboarding_checklist_items',
           'onboarding_clients','operator_device','operator_task',
           'swarm_runs','swarm_tasks','welcome_sequences'
         ]) AND NOT c.relrowsecurity) <> 10
  THEN RAISE EXCEPTION 'Security preflight changed: expected 10 public tables with RLS disabled';
  END IF;
  FOR target_name IN SELECT unnest(ARRAY[
      'agent_secret','client_tasks','ideas','onboarding_checklist_items',
      'onboarding_clients','operator_device','operator_task',
      'swarm_runs','swarm_tasks','welcome_sequences'
  ])
  LOOP
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM anon',target_name);
  END LOOP;
END
$guard$;
-- Secret-bearing table has no known direct client requirement, and zero rows at audit.
-- Leave service_role grants intact, block both anonymous and general authenticated access.
ALTER TABLE public.agent_secret ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.agent_secret FROM authenticated;
COMMIT;
