-- X1 Staging restricted-control-plane lockdown DRAFT ONLY, not executed.
-- Target exact project uvdkzsbjackpjvpoxtyk, not X1 Production.
-- BLOCKER: verify staging latest successful recoverable provider backup first.
-- Preserve service_role policies/grants. Revoke direct anon and authenticated
-- access on control-plane tables lacking a validated tenant discriminator.
-- This is a staged protection for unbound staging, NOT multi-tenant design.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DO $guard$
DECLARE e record;
BEGIN
  IF (SELECT COUNT(*) FROM auth.users) <> 0 OR
     (SELECT COUNT(*) FROM public.x1_tenant_memberships WHERE status='ACTIVE') <> 0
  THEN RAISE EXCEPTION 'Abort: staging has real users or active tenant memberships'; END IF;
  IF (SELECT count(*) FROM pg_policies p
      WHERE p.schemaname='public'
        AND p.tablename=ANY(ARRAY['agent_profiles','approval_requests','capabilities','connector_bindings','event_records','handoff_packets','leases','mcp_routes','memory_entries','missions','receipts','runtime_state','schedule_runs','schedule_specs','work_items'])
        AND p.roles::text LIKE '%authenticated%'
        AND (p.qual='true' OR p.with_check='true')) <> 15
  THEN RAISE EXCEPTION 'Abort: expected 15 unrestricted authenticated staging policies'; END IF;
  FOR e IN SELECT * FROM (VALUES
   ('agent_profiles','authenticated_read_agent_profiles'),
   ('approval_requests','authenticated_all_approval_requests'),
   ('capabilities','authenticated_all_capabilities'),
   ('connector_bindings','authenticated_all_connector_bindings'),
   ('event_records','authenticated_all_event_records'),
   ('handoff_packets','authenticated_all_handoff_packets'),
   ('leases','authenticated_all_leases'),
   ('mcp_routes','authenticated_all_mcp_routes'),
   ('memory_entries','authenticated_all_memory_entries'),
   ('missions','missions_authenticated_all'),
   ('receipts','authenticated_all_receipts'),
   ('runtime_state','authenticated_all_runtime_state'),
   ('schedule_runs','authenticated_all_schedule_runs'),
   ('schedule_specs','authenticated_all_schedule_specs'),
   ('work_items','authenticated_all_work_items')
  ) AS x(tablename,policyname)
  LOOP
    IF NOT EXISTS(SELECT 1 FROM pg_policies p WHERE p.schemaname='public'
        AND p.tablename=e.tablename AND p.policyname=e.policyname)
    THEN RAISE EXCEPTION 'Missing expected RLS policy on %',e.tablename; END IF;
    IF NOT has_table_privilege('service_role',format('public.%I',e.tablename),'SELECT')
    THEN RAISE EXCEPTION 'Service-role read privilege lost for %',e.tablename; END IF;
    EXECUTE format('DROP POLICY %I ON public.%I',e.policyname,e.tablename);
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM anon, authenticated',e.tablename);
  END LOOP;
  IF (SELECT count(*) FROM pg_policies p WHERE p.schemaname='public' AND
      p.policyname IN ('anon_select_capabilities','anon_select_receipts','anon_select_runtime_state'))<>3
  THEN RAISE EXCEPTION 'Abort: anonymous policy inventory drift'; END IF;
  DROP POLICY anon_select_capabilities ON public.capabilities;
  DROP POLICY anon_select_receipts ON public.receipts;
  DROP POLICY anon_select_runtime_state ON public.runtime_state;
END $guard$;
COMMIT;
