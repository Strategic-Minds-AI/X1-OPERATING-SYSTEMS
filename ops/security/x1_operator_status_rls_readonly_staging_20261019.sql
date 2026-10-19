-- Replace the temporary SECURITY DEFINER status RPC with least-privilege RLS reads.
drop function if exists public.x1_read_operator_status(uuid);

alter table public.x1_tenant_memberships enable row level security;
alter table public.x1_tenant_memberships force row level security;
alter table public.x1_tenants enable row level security;
alter table public.x1_tenants force row level security;
alter table public.x1_work_queue enable row level security;
alter table public.x1_work_queue force row level security;

revoke all on table public.x1_tenant_memberships from anon, authenticated;
revoke all on table public.x1_tenants from anon, authenticated;
revoke all on table public.x1_work_queue from anon, authenticated;

grant usage on schema public to authenticated;
grant select (user_id, tenant_id, role, status)
  on table public.x1_tenant_memberships to authenticated;
grant select (tenant_id, status)
  on table public.x1_tenants to authenticated;
grant select (tenant_id, status, updated_at)
  on table public.x1_work_queue to authenticated;

drop policy if exists x1_tenant_memberships_authenticated_self_read
  on public.x1_tenant_memberships;
create policy x1_tenant_memberships_authenticated_self_read
  on public.x1_tenant_memberships
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists x1_tenants_authenticated_member_read
  on public.x1_tenants;
create policy x1_tenants_authenticated_member_read
  on public.x1_tenants
  for select to authenticated
  using (
    status = 'ACTIVE'
    and exists (
      select 1
        from public.x1_tenant_memberships m
       where m.tenant_id = x1_tenants.tenant_id
         and m.user_id = (select auth.uid())
         and m.status = 'ACTIVE'
         and m.role in ('OWNER', 'ADMIN', 'BUILDER', 'VALIDATOR')
    )
  );

drop policy if exists x1_work_queue_authenticated_operator_read
  on public.x1_work_queue;
create policy x1_work_queue_authenticated_operator_read
  on public.x1_work_queue
  for select to authenticated
  using (
    exists (
      select 1
        from public.x1_tenant_memberships m
       where m.tenant_id = x1_work_queue.tenant_id
         and m.user_id = (select auth.uid())
         and m.status = 'ACTIVE'
         and m.role in ('OWNER', 'ADMIN', 'BUILDER', 'VALIDATOR')
    )
    and exists (
      select 1
        from public.x1_tenants t
       where t.tenant_id = x1_work_queue.tenant_id
         and t.status = 'ACTIVE'
    )
  );

comment on policy x1_tenant_memberships_authenticated_self_read
  on public.x1_tenant_memberships is
  'Authenticated users can read only their own active/inactive membership metadata.';
comment on policy x1_tenants_authenticated_member_read
  on public.x1_tenants is
  'Authenticated X1 operators can read only active tenants where they have an active allowed membership.';
comment on policy x1_work_queue_authenticated_operator_read
  on public.x1_work_queue is
  'Authenticated X1 operators can read only queue status metadata for their active tenant; column grants exclude payload and task details.';
