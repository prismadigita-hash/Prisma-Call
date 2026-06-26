-- ============================================================================
-- 0005 — Multiusuário: organizations + organization_members + papéis + helpers
--
-- Modelo de autorização:
--   - usuário autenticado (auth.users) pertence a 1+ organizações
--   - papel por organização: owner | admin | manager | member | viewer
--   - acesso aos dados sempre escopado pela organização (multi-tenant)
--
-- As funções auxiliares são SECURITY DEFINER (dono = postgres -> bypassam RLS),
-- evitando recursão de RLS ao consultar organization_members dentro das próprias
-- policies. search_path travado + schema explícito.
-- ============================================================================

do $$ begin
  create type org_role as enum ('owner', 'admin', 'manager', 'member', 'viewer');
exception when duplicate_object then null; end $$;

create table if not exists public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create or replace trigger trg_org_updated
  before update on public.organizations
  for each row execute function public.set_updated_at();

create table if not exists public.organization_members (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            org_role not null default 'member',
  created_at      timestamptz not null default now(),
  unique (organization_id, user_id)
);
-- Índices p/ RLS (lookups por user_id/organization_id são quentíssimos)
create index if not exists idx_org_members_user      on public.organization_members(user_id);
create index if not exists idx_org_members_org       on public.organization_members(organization_id);
create index if not exists idx_org_members_user_org  on public.organization_members(user_id, organization_id);

alter table public.organizations        enable row level security;
alter table public.organization_members enable row level security;

-- ---------------------------------------------------------------------------
-- Helpers de autorização
-- ---------------------------------------------------------------------------
create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members om
    where om.organization_id = org_id
      and om.user_id = (select auth.uid())
  );
$$;

create or replace function public.has_org_role(org_id uuid, allowed text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members om
    where om.organization_id = org_id
      and om.user_id = (select auth.uid())
      and om.role::text = any(allowed)
  );
$$;

create or replace function public.shares_org_with(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members a
    join public.organization_members b on a.organization_id = b.organization_id
    where a.user_id = (select auth.uid())
      and b.user_id = target
  );
$$;

-- Ao criar uma organização, o criador vira owner automaticamente.
create or replace function public.handle_new_organization()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.created_by is not null then
    insert into public.organization_members (organization_id, user_id, role)
    values (new.id, new.created_by, 'owner')
    on conflict (organization_id, user_id) do nothing;
  end if;
  return new;
end;
$$;
drop trigger if exists on_org_created on public.organizations;
create trigger on_org_created
  after insert on public.organizations
  for each row execute function public.handle_new_organization();

-- Execute apenas para authenticated (anon/public não enxergam essas funções).
revoke execute on function public.is_org_member(uuid)         from public, anon;
revoke execute on function public.has_org_role(uuid, text[])  from public, anon;
revoke execute on function public.shares_org_with(uuid)       from public, anon;
grant  execute on function public.is_org_member(uuid)         to authenticated;
grant  execute on function public.has_org_role(uuid, text[])  to authenticated;
grant  execute on function public.shares_org_with(uuid)       to authenticated;
