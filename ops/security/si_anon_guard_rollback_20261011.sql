-- ROLLBACK PLAN SI-2026-10-11-A | STRATEGIC INTELLIGENCE ONLY
-- Only execute if SI-2026-10-11-A causes a confirmed regression.
-- Restores exact privileges and RLS state audited immediately before that change.
-- Restoring anonymous access is intentionally INSECURE. It requires review and
-- explicit incident rollback approval, not automatic recovery.
-- Baseline: all 10 tables RLS disabled, no policies, postgres owner.
-- Each table: role anon had SELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER/MAINTAIN;
-- role authenticated had the same. role service_role remains unchanged by patch.
-- PUBLIC had no table grants in the inspected ACLs.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
-- Restore the original ACL for anon roles on precisely the ten modified tables.
GRANT ALL PRIVILEGES ON TABLE
 public.agent_secret,
 public.client_tasks,
 public.ideas,
 public.onboarding_checklist_items,
 public.onboarding_clients,
 public.operator_device,
 public.operator_task,
 public.swarm_runs,
 public.swarm_tasks,
 public.welcome_sequences
TO anon;
-- Only agent_secret had authenticated grants removed and RLS enabled by this patch.
GRANT ALL PRIVILEGES ON TABLE public.agent_secret TO authenticated;
ALTER TABLE public.agent_secret DISABLE ROW LEVEL SECURITY;
COMMIT;
-- After a rollback: verify all ten ACL grants and all 10 RLS flags; inspect activity logs.
-- For a healthy system, prefer a secure application compatibility fix rather than rolling
-- back to world-readable client records. No data rows are changed in either direction.
