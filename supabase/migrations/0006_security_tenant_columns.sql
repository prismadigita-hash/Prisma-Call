-- ============================================================================
-- 0006 — Escopo multi-tenant: organization_id nas tabelas do app
--
-- Estratégia: DESNORMALIZAR organization_id em todas as tabelas (inclusive
-- filhas como scores/feedbacks) para que as RLS policies filtrem por uma coluna
-- INDEXADA, sem subquery pesada por linha. Coluna NULLABLE para não quebrar o
-- app atual (que insere via service_role sem org). Backfill move o que existe
-- para uma organização padrão.
--
-- criteria fica com organization_id NULLABLE: NULL = rubrica global (visível a
-- todos os autenticados); valor preenchido = rubrica custom da organização.
-- ============================================================================

alter table public.closers             add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.criteria            add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.calls               add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.call_analyses       add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.scores              add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.call_highlights     add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.feedbacks           add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.improvement_actions add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.slack_logs          add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.webhook_logs        add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

-- ---------------------------------------------------------------------------
-- Backfill: garante uma organização padrão e move os dados existentes para ela.
-- criteria existentes ficam como global (NULL) — rubrica padrão do produto.
-- ---------------------------------------------------------------------------
do $$
declare org uuid;
begin
  select id into org from public.organizations order by created_at limit 1;
  if org is null then
    insert into public.organizations (name, slug) values ('Organização Padrão', 'default')
    returning id into org;
  end if;

  update public.closers             set organization_id = org where organization_id is null;
  update public.calls               set organization_id = org where organization_id is null;
  update public.call_analyses       set organization_id = org where organization_id is null;
  update public.scores              set organization_id = org where organization_id is null;
  update public.call_highlights     set organization_id = org where organization_id is null;
  update public.feedbacks           set organization_id = org where organization_id is null;
  update public.improvement_actions set organization_id = org where organization_id is null;
  update public.slack_logs          set organization_id = org where organization_id is null;
  update public.webhook_logs        set organization_id = org where organization_id is null;
end $$;

-- ---------------------------------------------------------------------------
-- Índices em organization_id (usados nas policies de RLS) + compostos quentes.
-- ---------------------------------------------------------------------------
create index if not exists idx_closers_org             on public.closers(organization_id);
create index if not exists idx_criteria_org            on public.criteria(organization_id);
create index if not exists idx_calls_org               on public.calls(organization_id);
create index if not exists idx_call_analyses_org       on public.call_analyses(organization_id);
create index if not exists idx_scores_org              on public.scores(organization_id);
create index if not exists idx_highlights_org          on public.call_highlights(organization_id);
create index if not exists idx_feedbacks_org           on public.feedbacks(organization_id);
create index if not exists idx_actions_org             on public.improvement_actions(organization_id);
create index if not exists idx_slack_logs_org          on public.slack_logs(organization_id);
create index if not exists idx_webhook_logs_org        on public.webhook_logs(organization_id);

-- Compostos para listagens/filtros/dashboards
create index if not exists idx_calls_org_date          on public.calls(organization_id, call_date desc);
create index if not exists idx_calls_org_status        on public.calls(organization_id, status);
create index if not exists idx_calls_org_closer        on public.calls(organization_id, closer_id);
create index if not exists idx_actions_org_status      on public.improvement_actions(organization_id, status);
create index if not exists idx_actions_org_closer      on public.improvement_actions(organization_id, closer_id);
create index if not exists idx_analyses_org_created    on public.call_analyses(organization_id, created_at desc);

-- OBS: depois que o app novo passar a SEMPRE gravar organization_id, você pode
-- endurecer com NOT NULL (ex.: alter table ... alter column organization_id set not null).
-- Não fazemos agora para não quebrar inserts do app atual via service_role.
