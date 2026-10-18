-- X1 Staging EMERGENCY rollback DRAFT, not executed.
-- Reintroduces dangerous broad auth/anon grants; require incident approval.
-- Original RLS policies/grants snapshot from 2026-10-11. No data mutations.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DO $restore$
DECLARE e record;
BEGIN
  IF (SELECT count(*) FROM pg_policies p WHERE p.schemaname='public' AND
      p.tablename=ANY(ARRAY['agent_profiles','approval_requests','capabilities','connector_bindings','event_records','handoff_packets','leases','mcp_routes','memory_entries','missions','receipts','runtime_state','schedule_runs','schedule_specs','work_items'])
      AND p.roles::text LIKE '%authenticated%')<>0
  THEN RAISE EXCEPTION 'Cannot rollback: authenticated policies already exist'; END IF;
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
    EXECUTE format('GRANT ALL PRIVILEGES ON TABLE public.%I TO anon',e.tablename);
    IF e.tablename='agent_profiles' THEN
      EXECUTE 'GRANT SELECT, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public.agent_profiles TO authenticated';
      EXECUTE 'CREATE POLICY authenticated_read_agent_profiles ON public.agent_profiles AS PERMISSIVE FOR SELECT TO authenticated USING (true)';
    ELSE
      EXECUTE format('GRANT ALL PRIVILEGES ON TABLE public.%I TO authenticated',e.tablename);
      EXECUTE format('CREATE POLICY %I ON public.%I AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true)',e.policyname,e.tablename);
    END IF;
  END LOOP;
  CREATE POLICY anon_select_capabilities ON public.capabilities AS PERMISSIVE FOR SELECT TO anon USING (true);
  CREATE POLICY anon_select_receipts ON public.receipts AS PERMISSIVE FOR SELECT TO anon USING (true);
  CREATE POLICY anon_select_runtime_state ON public.runtime_state AS PERMISSIVE FOR SELECT TO anon USING (true);
END $restore$;
COMMIT;
