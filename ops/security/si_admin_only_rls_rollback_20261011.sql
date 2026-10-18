-- BREAK-GLASS SI-2026-10-11-C rollback, reopens broad authenticated access.
-- This rollback is dangerous and must be reviewed by a human incident owner.
-- Original state: 9 tables had no policies and RLS disabled; all anon grants were
-- separately revoked by earlier SI-2026-10-11-A and must remain revoked here.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DO $do$
DECLARE n text;
DECLARE expected text[] := ARRAY[
 'client_tasks','ideas','onboarding_checklist_items','onboarding_clients',
 'operator_device','operator_task','swarm_runs','swarm_tasks','welcome_sequences'
];
BEGIN
 IF (SELECT count(*) FROM pg_policies
    WHERE schemaname='public' AND tablename=ANY(expected)
      AND policyname='si_admin_operator_guard_20261011') <> 9
 THEN RAISE EXCEPTION 'Abort rollback: expected 9 exact policies'; END IF;
 IF (SELECT count(*) FROM pg_policies
    WHERE schemaname='public' AND tablename=ANY(expected)) <> 9
 THEN RAISE EXCEPTION 'Abort rollback: additional policies exist'; END IF;
 FOR n IN SELECT unnest(expected)
 LOOP
  EXECUTE format('DROP POLICY si_admin_operator_guard_20261011 ON public.%I',n);
  EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY',n);
 END LOOP;
END $do$;
COMMIT;
