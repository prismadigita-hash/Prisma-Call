-- ============================================================================
-- Migration 0003: integração Tactiq (webhook)
--   * novos status de call: 'recebida' e 'erro_na_analise'
--   * nova origem de call: 'tactiq'
--   * tabela webhook_logs (auditoria/erros dos webhooks recebidos)
--
-- Obs.: ALTER TYPE ... ADD VALUE não pode ser usado na MESMA transação em que
-- o valor é utilizado. Aqui só adicionamos os valores e criamos uma tabela, então
-- é seguro. Se o seu editor reclamar de transação, rode os 3 ALTER TYPE
-- separadamente (um de cada vez) e depois o CREATE TABLE.
-- ============================================================================

alter type call_status add value if not exists 'recebida';
alter type call_status add value if not exists 'erro_na_analise';
alter type call_source add value if not exists 'tactiq';

create table if not exists webhook_logs (
  id          uuid primary key default gen_random_uuid(),
  source      text not null default 'tactiq',
  call_id     uuid references calls(id) on delete set null,
  ok          boolean not null default false,
  status      text,
  error       text,
  payload     jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists idx_webhook_logs_source on webhook_logs(source);
create index if not exists idx_webhook_logs_call on webhook_logs(call_id);

alter table webhook_logs enable row level security;
