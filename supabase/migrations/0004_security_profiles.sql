-- ============================================================================
-- 0004 — Supabase Auth: tabela public.profiles + criação automática de profile
--
-- Motivo: usar auth.users como fonte de identidade. profiles guarda dados de
-- aplicação do usuário (1:1 com auth.users.id). Nunca usar email como chave de
-- permissão — sempre auth.uid().
-- ============================================================================

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  email       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- updated_at (reaproveita public.set_updated_at() criada na 0001)
create or replace trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

-- Cria o profile automaticamente quando um novo usuário é criado no Auth.
-- SECURITY DEFINER porque o insert ocorre no contexto do Auth; search_path
-- travado e tabelas referenciadas com schema explícito (boas práticas).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- profile não deve ser executável/alterável por anon; RLS cuida do acesso por
-- linha (policies na migration 0007).
