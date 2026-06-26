-- ============================================================================
-- Call Intelligence — SCHEMA COMPLETO (arquivo único)
-- Cole TODO este conteúdo no SQL Editor do Supabase e clique em "Run".
-- Gerado a partir de migrations/0001_init.sql + migrations/0002_seed_criteria.sql
-- Idempotente: pode rodar mais de uma vez sem quebrar.
-- (Opcional) Para dados de exemplo, rode depois o arquivo supabase/seed.sql
-- ============================================================================


-- ============================================================================
-- AdBalanceBilling — Sales Call Intelligence
-- Migration 0001: initial schema
--
-- Design notes:
--  * Scores live in their own table (one row per criterion per analysis) so the
--    evaluation rubric can grow/shrink without migrations and historical
--    comparison is a simple GROUP BY.
--  * Every analysis stores the model + rubric version used, so notes stay
--    comparable over time even if the rubric changes.
--  * RLS is ON for every table with NO public policy. All access goes through
--    the server using the service_role key (which bypasses RLS). The browser
--    never touches the database directly.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type call_status as enum ('pendente', 'em_analise', 'concluida', 'revisada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type analysis_status as enum ('pendente', 'em_analise', 'concluida', 'falhou');
exception when duplicate_object then null; end $$;

do $$ begin
  create type action_status as enum ('pendente', 'em_andamento', 'aplicada', 'descartada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type call_source as enum ('transcricao', 'link', 'audio', 'video');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- closers — the sales reps being evaluated
-- ---------------------------------------------------------------------------
create table if not exists closers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text,
  avatar_url  text,
  role        text default 'Closer',
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create or replace trigger trg_closers_updated before update on closers
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- criteria — the evaluation rubric (versioned, weighted, ordered)
-- ---------------------------------------------------------------------------
create table if not exists criteria (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,          -- stable machine key (e.g. 'diagnostico')
  label       text not null,                 -- human label (pt-BR)
  description text,                           -- what "good" looks like
  weight      numeric(4,2) not null default 1.0,
  sort_order  int not null default 0,
  active      boolean not null default true,
  version     int not null default 1,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- calls — a single sales call
-- ---------------------------------------------------------------------------
create table if not exists calls (
  id            uuid primary key default gen_random_uuid(),
  closer_id     uuid not null references closers(id) on delete cascade,
  client_name   text not null,               -- cliente / lead
  call_date     date not null default current_date,
  source        call_source not null default 'transcricao',
  recording_url text,                          -- link da gravação (opcional)
  transcript    text,                          -- transcrição em texto
  status        call_status not null default 'pendente',
  duration_sec  int,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_calls_closer on calls(closer_id);
create index if not exists idx_calls_date on calls(call_date);
create index if not exists idx_calls_status on calls(status);
create or replace trigger trg_calls_updated before update on calls
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- call_analyses — the AI result (one current analysis per call; history kept)
-- ---------------------------------------------------------------------------
create table if not exists call_analyses (
  id               uuid primary key default gen_random_uuid(),
  call_id          uuid not null references calls(id) on delete cascade,
  status           analysis_status not null default 'pendente',
  overall_score    numeric(4,2),               -- 0..10
  summary          text,                        -- resumo geral
  closer_talk_pct  int,                         -- % tempo de fala do closer
  client_talk_pct  int,                         -- % tempo de fala do cliente
  model            text,                        -- modelo de IA usado
  rubric_version   int not null default 1,
  raw              jsonb,                        -- payload bruto da IA (auditoria)
  error            text,                        -- mensagem de erro se falhou
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_analyses_call on call_analyses(call_id);
create or replace trigger trg_analyses_updated before update on call_analyses
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- scores — one row per criterion per analysis (the engine of evolution metrics)
-- ---------------------------------------------------------------------------
create table if not exists scores (
  id            uuid primary key default gen_random_uuid(),
  analysis_id   uuid not null references call_analyses(id) on delete cascade,
  criterion_key text not null,
  score         numeric(4,2) not null,          -- 0..10
  justification text,                             -- por que essa nota
  created_at    timestamptz not null default now()
);
create index if not exists idx_scores_analysis on scores(analysis_id);
create index if not exists idx_scores_criterion on scores(criterion_key);

-- ---------------------------------------------------------------------------
-- call_highlights — important moments / trechos (objections, pains, turning points)
-- ---------------------------------------------------------------------------
create table if not exists call_highlights (
  id           uuid primary key default gen_random_uuid(),
  analysis_id  uuid not null references call_analyses(id) on delete cascade,
  kind         text not null default 'momento', -- dor | objecao | virada | risco | momento
  timestamp_ref text,                             -- ex: "12:30" (se conhecido)
  quote        text,                              -- trecho citado
  comment      text,                              -- comentário do analista IA
  created_at   timestamptz not null default now()
);
create index if not exists idx_highlights_analysis on call_highlights(analysis_id);

-- ---------------------------------------------------------------------------
-- feedbacks — the human-facing final feedback for the closer
-- ---------------------------------------------------------------------------
create table if not exists feedbacks (
  id             uuid primary key default gen_random_uuid(),
  analysis_id    uuid not null references call_analyses(id) on delete cascade,
  strengths      text[],     -- pontos fortes
  weaknesses     text[],     -- pontos fracos
  keep_doing     text[],     -- o que manter
  fix_doing      text[],     -- o que corrigir
  final_comment  text,        -- comentário final humano e direto
  better_approach text,       -- como poderia ter conduzido melhor (exemplos práticos)
  created_at     timestamptz not null default now()
);
create index if not exists idx_feedbacks_analysis on feedbacks(analysis_id);

-- ---------------------------------------------------------------------------
-- improvement_actions — recommended next actions (tracked => "feedbacks applied")
-- ---------------------------------------------------------------------------
create table if not exists improvement_actions (
  id           uuid primary key default gen_random_uuid(),
  analysis_id  uuid not null references call_analyses(id) on delete cascade,
  closer_id    uuid not null references closers(id) on delete cascade,
  title        text not null,
  detail       text,
  priority     int not null default 2,           -- 1 alta, 2 média, 3 baixa
  status       action_status not null default 'pendente',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_actions_closer on improvement_actions(closer_id);
create index if not exists idx_actions_status on improvement_actions(status);
create or replace trigger trg_actions_updated before update on improvement_actions
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- slack_logs — audit of every Slack notification attempt
-- ---------------------------------------------------------------------------
create table if not exists slack_logs (
  id          uuid primary key default gen_random_uuid(),
  call_id     uuid references calls(id) on delete set null,
  channel     text,
  payload     jsonb,
  ok          boolean not null default false,
  error       text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_slack_logs_call on slack_logs(call_id);

-- ---------------------------------------------------------------------------
-- Row Level Security: ON everywhere, no public policies.
-- Server uses service_role (bypasses RLS). Browser never queries directly.
-- ---------------------------------------------------------------------------
alter table closers             enable row level security;
alter table criteria            enable row level security;
alter table calls               enable row level security;
alter table call_analyses       enable row level security;
alter table scores              enable row level security;
alter table call_highlights     enable row level security;
alter table feedbacks           enable row level security;
alter table improvement_actions enable row level security;
alter table slack_logs          enable row level security;


-- ============================================================================
-- Migration 0002: seed the evaluation rubric (criteria)
-- Idempotent: re-running updates labels/descriptions but keeps ids.
-- ============================================================================

insert into criteria (key, label, description, weight, sort_order) values
  ('clareza_comunicacao', 'Clareza na comunicação',
   'Fala objetiva, sem ruído, fácil de entender; ritmo e linguagem adequados ao cliente.', 1.0, 1),
  ('dominio_processo', 'Domínio do processo comercial',
   'Conduz as etapas da venda com método; sabe onde está e para onde vai.', 1.2, 2),
  ('diagnostico', 'Diagnóstico do cliente',
   'Entende o contexto, cenário e necessidade real antes de oferecer solução.', 1.5, 3),
  ('perguntas', 'Capacidade de fazer perguntas',
   'Faz perguntas abertas e relevantes que aprofundam o entendimento.', 1.2, 4),
  ('identificacao_dores', 'Identificação de dores',
   'Encontra e qualifica as dores e o impacto/custo delas para o cliente.', 1.5, 5),
  ('conducao', 'Condução da conversa',
   'Mantém o controle e o direcionamento da call sem ser atropelado.', 1.3, 6),
  ('quebra_objecoes', 'Quebra de objeções',
   'Lida com objeções com segurança, validando e reposicionando valor.', 1.4, 7),
  ('apresentacao_solucao', 'Apresentação da solução',
   'Conecta a solução às dores levantadas, de forma personalizada.', 1.3, 8),
  ('criacao_valor', 'Criação de valor',
   'Constrói percepção de valor acima do preço; foca em resultado.', 1.3, 9),
  ('proximos_passos', 'Próximos passos',
   'Define claramente o que acontece a seguir, com data e compromisso.', 1.1, 10),
  ('fechamento', 'Fechamento / tentativa de avanço',
   'Pede o avanço/fechamento na hora certa; não deixa a call morrer.', 1.4, 11),
  ('postura', 'Postura profissional',
   'Confiança, escuta ativa, tom consultivo e presença.', 1.0, 12)
on conflict (key) do update set
  label = excluded.label,
  description = excluded.description,
  weight = excluded.weight,
  sort_order = excluded.sort_order;
