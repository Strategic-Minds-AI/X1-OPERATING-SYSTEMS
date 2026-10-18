-- X1 passive intelligence ingestion: staging-only migration.
-- Apply only to the verified staging Supabase project after review.
-- Do not apply to production as part of this source change.
create table if not exists public.x1_intelligence_ingest (
  ingest_id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.x1_tenants(tenant_id) on delete cascade,
  source text not null check (source in ('github_repository')),
  external_id text not null,
  title text not null,
  summary text not null default '',
  url text not null,
  stars integer not null default 0 check (stars >= 0),
  forks integer not null default 0 check (forks >= 0),
  open_issues integer not null default 0 check (open_issues >= 0),
  language text,
  pushed_at timestamptz,
  upstream_updated_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (tenant_id, source, external_id)
);

create index if not exists x1_intelligence_ingest_tenant_stars_idx
  on public.x1_intelligence_ingest (tenant_id, stars desc, last_seen_at desc);

alter table public.x1_intelligence_ingest enable row level security;
-- No anon/authenticated policies are granted. Native server routes use the
-- staging-only service credential after verifying operator and tenant scope.
-- External repository descriptions are untrusted metadata and must never be
-- evaluated as instructions or executed as code.
