# Camada de Segurança — Supabase Auth + RLS + RPC + Performance

Implementação da segurança multiusuário/multi-tenant do sistema de análise de
calls. Aplicar as migrations na ordem (0001 → 0010) no SQL Editor do Supabase.

> Importante: o app atual usa `service_role` no servidor, que **bypassa RLS** —
> ativar estas políticas **não quebra** o sistema. As policies passam a valer
> quando o app for migrado para clientes **autenticados** (ETAPA 4).

---

## 1. Modelo de autorização

- Identidade: **Supabase Auth** (`auth.users`). `public.profiles` 1:1 com o user.
- Tenant: **organizations** + **organization_members** (papel por organização).
- Papéis (`org_role`): `owner` > `admin` > `manager` > `member` > `viewer`.
- Todo dado de negócio carrega `organization_id` (desnormalizado p/ RLS rápida).
- Decisão de acesso **sempre** via `auth.uid()` + membership/role — nunca via
  dados vindos do frontend, nunca por email.

Funções auxiliares (SECURITY DEFINER, `search_path=''`, schema explícito):
- `is_org_member(org_id)` — usuário pertence à org?
- `has_org_role(org_id, text[])` — usuário tem um dos papéis na org?
- `shares_org_with(user_id)` — compartilham alguma org? (visibilidade de profile)

---

## 2. Tabelas analisadas (schema base 0001–0003)

closers, criteria, calls, call_analyses, scores, call_highlights, feedbacks,
improvement_actions, slack_logs, webhook_logs.

## 3. Tabelas criadas (segurança)

profiles, organizations, organization_members, audit_logs.

## 4. RLS — ativado em TODAS as tabelas acima

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| profiles | próprio ou mesma org | próprio | próprio | — |
| organizations | membro | criador | owner/admin | owner |
| organization_members | membro | owner/admin | owner/admin | owner/admin |
| closers | membro (oculta deletados*) | membro | membro | owner/admin/manager |
| criteria | global(null) ou membro | owner/admin (org) | owner/admin | owner/admin |
| calls | membro (oculta deletados*) | membro | membro | owner/admin/manager |
| call_analyses | membro | membro | membro | owner/admin/manager |
| scores | membro | membro | membro | owner/admin/manager |
| call_highlights | membro | membro | membro | owner/admin/manager |
| feedbacks | membro | membro | membro | owner/admin/manager |
| improvement_actions | membro | membro | membro | owner/admin/manager |
| slack_logs | owner/admin/manager | — | — | — |
| webhook_logs | owner/admin/manager | — | — | — |
| audit_logs | owner/admin | — (só trigger) | — | — |

\* deletados (soft delete) só aparecem para owner/admin.
Nenhuma policy usa `USING (true)`. INSERT/UPDATE usam `with check` para impedir
forjar/mover `organization_id` para fora do escopo do usuário.

## 5. Funções / RPC criadas

- `create_call(closer_id, client_name, call_date, transcript, recording_url, source)`
  — valida org do closer; cria call. (SECURITY INVOKER)
- `set_action_status(action_id, status)` — muda status (RLS escopa).
- `soft_delete_call(call_id)` — exclusão lógica; exige owner/admin/manager.
- `get_dashboard_metrics(org_id)` — agregações em 1 chamada; valida membership.
- Auxiliares: `is_org_member`, `has_org_role`, `shares_org_with`.
- Triggers: `handle_new_user`, `handle_new_organization`, `audit_trigger`,
  `set_updated_at` (reuso).

## 6. Grants/Revokes

- `anon`: **sem acesso** a nenhuma tabela de negócio nem função.
- `authenticated`: DML nas tabelas de aplicação (RLS escopa); **só SELECT** em
  logs/auditoria; EXECUTE somente nas RPCs liberadas.
- `service_role`: total (server-side; nunca no frontend).

## 7. Índices criados (performance / RLS)

- `organization_members(user_id)`, `(organization_id)`, `(user_id, organization_id)`
- `organization_id` em todas as tabelas de negócio
- Compostos: `calls(organization_id, call_date desc)`, `calls(organization_id, status)`,
  `calls(organization_id, closer_id)`, `improvement_actions(organization_id, status)`,
  `call_analyses(organization_id, created_at desc)`,
  `calls(organization_id, deleted_at)`, `closers(organization_id, deleted_at)`
- `audit_logs(organization_id, created_at desc)`, `audit_logs(entity_type, entity_id)`

## 8. Triggers

- `on_auth_user_created` → cria profile
- `on_org_created` → criador vira owner
- `trg_audit_org_members` (INSERT/UPDATE/DELETE), `trg_audit_calls_status` e
  `trg_audit_actions_status` (mudança de status) → audit_logs
- `trg_*_updated` → updated_at

---

## 9. CHECKLIST DE SEGURANÇA (produção)

- [ ] RLS habilitado em TODAS as tabelas com dado sensível (sim: 0001 + 0004/05/08).
- [ ] Nenhuma policy `USING (true)`.
- [ ] `anon` não lê dados privados (revogado em 0010).
- [ ] `authenticated` não acessa outra org (helpers + with check).
- [ ] INSERT não permite forjar `organization_id` (with check is_org_member).
- [ ] UPDATE não permite mover linha p/ outra org (using + with check).
- [ ] DELETE sensível restrito a papéis (owner/admin/manager).
- [ ] Funções SECURITY DEFINER têm `search_path=''` e schema explícito.
- [ ] EXECUTE de funções revogado de public/anon; liberado só a authenticated.
- [ ] `service_role` nunca usada no frontend (só server-side).
- [ ] audit_logs imutável (sem insert/update/delete p/ authenticated).
- [ ] Soft delete: SELECT padrão esconde deletados.

## 10. CHECKLIST DE PERFORMANCE

- [ ] Índice em cada coluna usada por RLS (`organization_id`).
- [ ] Índices compostos p/ listagens/dashboards.
- [ ] Helpers `stable` + padrão `(select auth.uid())` (avalia 1x por query).
- [ ] Dashboards via RPC `get_dashboard_metrics` (1 ida ao banco).
- [ ] `EXPLAIN ANALYZE` nas telas críticas (calls list, dashboard, perfil closer).
- [ ] Evitar `select *` em telas críticas; paginar listas grandes.

---

## 11. TESTES DE RLS (rodar no SQL Editor)

Crie 2 orgs e 2 usuários e valide o isolamento. Padrão para simular um usuário
autenticado dentro de uma transação:

```sql
-- Simular o usuário <UID> como 'authenticated'
begin;
  select set_config('request.jwt.claims', json_build_object('sub','<UID>','role','authenticated')::text, true);
  set local role authenticated;

  -- 1) Usuário A NÃO vê calls da org B  -> deve retornar 0
  select count(*) from public.calls where organization_id = '<ORG_B>';

  -- 2) INSERT forjando org alheia -> deve FALHAR (violação de RLS)
  insert into public.closers (organization_id, name) values ('<ORG_B>', 'Hacker');

  -- 3) member tentando virar admin -> deve FALHAR
  update public.organization_members set role = 'admin'
   where organization_id = '<ORG_A>' and user_id = '<UID>';
rollback;
```

Cenários esperados:
1. Usuário A não acessa dados da org B. ✔ (SELECT retorna 0)
2. Sem login (`anon`) não lê dados privados. ✔ (grants revogados)
3. member não executa ação de admin. ✔ (has_org_role bloqueia)
4. viewer não altera dados. ✔ (sem grant de papel; ajuste policies por papel se
   quiser leitura-apenas estrita para viewer — ver Pontos de atenção).
5. INSERT não forja `organization_id`. ✔ (with check)
6. UPDATE não move p/ outra org. ✔ (using + with check)
7. DELETE respeita papel. ✔
8. RPC não vaza dados (valida membership e RAISE). ✔
9. audit_logs não é gravável por authenticated. ✔

---

## 12. PONTOS DE ATENÇÃO ANTES DE PRODUÇÃO

- **viewer estritamente leitura**: hoje as tabelas de aplicação permitem
  INSERT/UPDATE a qualquer `member`/`viewer`. Se quiser `viewer` 100% read-only,
  troque os `with check`/`using` de INSERT/UPDATE/DELETE para
  `has_org_role(organization_id, array['owner','admin','manager','member'])`
  (exclui viewer). Decisão deixada para você definir por tabela.
- **NOT NULL em organization_id**: depois que o app novo SEMPRE gravar org,
  endureça com `alter table ... alter column organization_id set not null`.
- **Refactor do app (ETAPA 4)**: trocar uso de `service_role` por cliente
  Supabase autenticado (cookies/SSR `@supabase/ssr`); manter `service_role`
  apenas em rotas server-side seguras (ex.: webhook Tactiq, jobs).
- **Webhook Tactiq**: continua server-side com `service_role`; deve setar
  `organization_id` ao inserir (mapear a org de destino no payload/segredo).
- **Storage** (quando usar): buckets privados; policies por `organization_id`;
  path `organization_id/entity_type/entity_id/arquivo`; signed URLs.
- **EXPLAIN ANALYZE**: rodar nas queries de lista/dashboard após popular dados.
- **Headers/anti-ataques (app)**: CSP, X-Content-Type-Options, Referrer-Policy,
  cookies httpOnly, validação server-side de input, sem `dangerouslySetInnerHTML`
  sem sanitização — ver prompt de segurança web (implementar na camada Next).

---

## ORDEM DE APLICAÇÃO DAS MIGRATIONS
0001 → 0002 → 0003 → 0004 → 0005 → 0006 → 0007 → 0008 → 0009 → 0010
(todas idempotentes; podem ser re-rodadas.)
