-- ============================================================================
-- 0010 — Grants e revokes explícitos por role
--
-- Por padrão o Supabase concede DML em public a anon e authenticated; a RLS é
-- que gera o escopo. Aqui endurecemos:
--   anon          -> SEM acesso a tabelas sensíveis (defesa em profundidade)
--   authenticated -> DML nas tabelas de aplicação (RLS escopa por org);
--                    apenas SELECT em logs/auditoria
--   service_role  -> mantém acesso total (uso server-side; bypassa RLS)
-- ============================================================================

-- anon não acessa NENHUMA tabela de negócio (mesmo que faltasse policy)
revoke all on public.profiles              from anon;
revoke all on public.organizations         from anon;
revoke all on public.organization_members  from anon;
revoke all on public.closers               from anon;
revoke all on public.criteria              from anon;
revoke all on public.calls                 from anon;
revoke all on public.call_analyses         from anon;
revoke all on public.scores                from anon;
revoke all on public.call_highlights       from anon;
revoke all on public.feedbacks             from anon;
revoke all on public.improvement_actions   from anon;
revoke all on public.slack_logs            from anon;
revoke all on public.webhook_logs          from anon;
revoke all on public.audit_logs            from anon;

-- authenticated: DML nas tabelas de aplicação (a RLS limita as linhas)
grant select, insert, update, delete on public.profiles             to authenticated;
grant select, insert, update, delete on public.organizations        to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;
grant select, insert, update, delete on public.closers              to authenticated;
grant select, insert, update, delete on public.criteria             to authenticated;
grant select, insert, update, delete on public.calls                to authenticated;
grant select, insert, update, delete on public.call_analyses        to authenticated;
grant select, insert, update, delete on public.scores               to authenticated;
grant select, insert, update, delete on public.call_highlights      to authenticated;
grant select, insert, update, delete on public.feedbacks            to authenticated;
grant select, insert, update, delete on public.improvement_actions  to authenticated;

-- logs e auditoria: authenticated só LÊ (gravação via service_role/triggers)
grant select on public.slack_logs   to authenticated;
grant select on public.webhook_logs to authenticated;
grant select on public.audit_logs   to authenticated;
revoke insert, update, delete on public.slack_logs   from authenticated;
revoke insert, update, delete on public.webhook_logs from authenticated;
revoke insert, update, delete on public.audit_logs   from authenticated;

-- NOTA: NÃO há grants para a role anon em nenhuma função (helpers e RPCs já
-- revogadas de public/anon nas migrations 0005 e 0009). service_role é usada
-- apenas no servidor (NUNCA no frontend).
