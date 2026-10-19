create or replace function public.x1_read_operator_status(p_tenant_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_membership_count integer;
  v_tenant_id uuid;
  v_role text;
  v_sample_count integer := 0;
  v_counts jsonb := '{}'::jsonb;
begin
  if v_user_id is null then
    return jsonb_build_object('status', 'BLOCKED', 'reason', 'AUTHENTICATION_REQUIRED');
  end if;

  select count(*)::integer
    into v_membership_count
    from public.x1_tenant_memberships m
   where m.user_id = v_user_id
     and m.status = 'ACTIVE';

  if v_membership_count = 0 then
    return jsonb_build_object('status', 'BLOCKED', 'reason', 'NO_ACTIVE_TENANT_MEMBERSHIP');
  end if;

  if p_tenant_id is null then
    if v_membership_count <> 1 then
      return jsonb_build_object('status', 'BLOCKED', 'reason', 'TENANT_SELECTION_REQUIRED');
    end if;
    select m.tenant_id, m.role
      into v_tenant_id, v_role
      from public.x1_tenant_memberships m
     where m.user_id = v_user_id
       and m.status = 'ACTIVE'
     limit 1;
  else
    select m.tenant_id, m.role
      into v_tenant_id, v_role
      from public.x1_tenant_memberships m
     where m.user_id = v_user_id
       and m.status = 'ACTIVE'
       and m.tenant_id = p_tenant_id
     limit 1;
    if not found then
      return jsonb_build_object('status', 'BLOCKED', 'reason', 'TENANT_SCOPE_DENIED');
    end if;
  end if;

  if v_role not in ('OWNER', 'ADMIN', 'BUILDER', 'VALIDATOR') then
    return jsonb_build_object('status', 'BLOCKED', 'reason', 'ROLE_NOT_PERMITTED');
  end if;

  if not exists (
    select 1 from public.x1_tenants t
     where t.tenant_id = v_tenant_id
       and t.status = 'ACTIVE'
  ) then
    return jsonb_build_object('status', 'BLOCKED', 'reason', 'TENANT_NOT_ACTIVE');
  end if;

  with sampled as (
    select q.status
      from public.x1_work_queue q
     where q.tenant_id = v_tenant_id
     order by q.updated_at desc
     limit 201
  ),
  bounded as (
    select s.status from sampled s limit 200
  )
  select
    (select count(*)::integer from sampled),
    jsonb_build_object(
      'PENDING', count(*) filter (where status = 'PENDING'),
      'LEASED', count(*) filter (where status = 'LEASED'),
      'COMPLETED', count(*) filter (where status = 'COMPLETED'),
      'FAILED', count(*) filter (where status = 'FAILED'),
      'BLOCKED', count(*) filter (where status = 'BLOCKED'),
      'DEAD_LETTER', count(*) filter (where status = 'DEAD_LETTER')
    )
    into v_sample_count, v_counts
    from bounded;

  return jsonb_build_object(
    'status', 'STAGING_READ_VERIFIED',
    'tenant_id', v_tenant_id,
    'role', v_role,
    'user_id', v_user_id,
    'sample', jsonb_build_object(
      'limit', 200,
      'truncated', v_sample_count > 200,
      'counts', coalesce(v_counts, '{}'::jsonb)
    ),
    'dispatch', 'DISABLED',
    'writes', 'DISABLED'
  );
end;
$function$;

revoke all on function public.x1_read_operator_status(uuid) from public;
revoke all on function public.x1_read_operator_status(uuid) from anon;
grant execute on function public.x1_read_operator_status(uuid) to authenticated;
comment on function public.x1_read_operator_status(uuid) is
  'X1 staging-only read path. Verifies auth.uid(), active tenant membership and role; returns bounded queue status counts only. No writes or dispatch.';
