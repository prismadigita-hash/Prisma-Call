-- ============================================================================
-- 0007 — RLS policies (granular, por operação, sem USING(true))
--
-- Regras gerais:
--   SELECT  -> só dados de organizações onde o usuário é membro
--   INSERT  -> só dentro de organização onde é membro (impede forjar org alheia)
--   UPDATE  -> escopo da org (using + with check impedem mover p/ outra org)
--   DELETE  -> restrito a papéis (owner/admin/manager) — operação sensível
--   service_role BYPASSA RLS (continua funcionando no servidor).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_insert on public.profiles;
drop policy if exists profiles_update on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using ( id = (select auth.uid()) or public.shares_org_with(id) );
create policy profiles_insert on public.profiles for insert to authenticated
  with check ( id = (select auth.uid()) );
create policy profiles_update on public.profiles for update to authenticated
  using ( id = (select auth.uid()) ) with check ( id = (select auth.uid()) );
-- (sem policy de DELETE -> authenticated não apaga profiles)

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
drop policy if exists organizations_select on public.organizations;
drop policy if exists organizations_insert on public.organizations;
drop policy if exists organizations_update on public.organizations;
drop policy if exists organizations_delete on public.organizations;
create policy organizations_select on public.organizations for select to authenticated
  using ( public.is_org_member(id) );
create policy organizations_insert on public.organizations for insert to authenticated
  with check ( created_by = (select auth.uid()) );
create policy organizations_update on public.organizations for update to authenticated
  using ( public.has_org_role(id, array['owner','admin']) )
  with check ( public.has_org_role(id, array['owner','admin']) );
create policy organizations_delete on public.organizations for delete to authenticated
  using ( public.has_org_role(id, array['owner']) );

-- ---------------------------------------------------------------------------
-- organization_members  (gestão de acesso = owner/admin)
-- ---------------------------------------------------------------------------
drop policy if exists org_members_select on public.organization_members;
drop policy if exists org_members_insert on public.organization_members;
drop policy if exists org_members_update on public.organization_members;
drop policy if exists org_members_delete on public.organization_members;
create policy org_members_select on public.organization_members for select to authenticated
  using ( public.is_org_member(organization_id) );
create policy org_members_insert on public.organization_members for insert to authenticated
  with check ( public.has_org_role(organization_id, array['owner','admin']) );
create policy org_members_update on public.organization_members for update to authenticated
  using ( public.has_org_role(organization_id, array['owner','admin']) )
  with check ( public.has_org_role(organization_id, array['owner','admin']) );
create policy org_members_delete on public.organization_members for delete to authenticated
  using ( public.has_org_role(organization_id, array['owner','admin']) );

-- ---------------------------------------------------------------------------
-- Helper de geração: tabelas "de aplicação" com escopo simples por org.
-- (closers, calls, call_analyses, scores, call_highlights, feedbacks,
--  improvement_actions)
-- ---------------------------------------------------------------------------
-- closers
drop policy if exists closers_select on public.closers;
drop policy if exists closers_insert on public.closers;
drop policy if exists closers_update on public.closers;
drop policy if exists closers_delete on public.closers;
create policy closers_select on public.closers for select to authenticated using ( public.is_org_member(organization_id) );
create policy closers_insert on public.closers for insert to authenticated with check ( public.is_org_member(organization_id) );
create policy closers_update on public.closers for update to authenticated using ( public.is_org_member(organization_id) ) with check ( public.is_org_member(organization_id) );
create policy closers_delete on public.closers for delete to authenticated using ( public.has_org_role(organization_id, array['owner','admin','manager']) );

-- calls
drop policy if exists calls_select on public.calls;
drop policy if exists calls_insert on public.calls;
drop policy if exists calls_update on public.calls;
drop policy if exists calls_delete on public.calls;
create policy calls_select on public.calls for select to authenticated using ( public.is_org_member(organization_id) );
create policy calls_insert on public.calls for insert to authenticated with check ( public.is_org_member(organization_id) );
create policy calls_update on public.calls for update to authenticated using ( public.is_org_member(organization_id) ) with check ( public.is_org_member(organization_id) );
create policy calls_delete on public.calls for delete to authenticated using ( public.has_org_role(organization_id, array['owner','admin','manager']) );

-- call_analyses
drop policy if exists analyses_select on public.call_analyses;
drop policy if exists analyses_insert on public.call_analyses;
drop policy if exists analyses_update on public.call_analyses;
drop policy if exists analyses_delete on public.call_analyses;
create policy analyses_select on public.call_analyses for select to authenticated using ( public.is_org_member(organization_id) );
create policy analyses_insert on public.call_analyses for insert to authenticated with check ( public.is_org_member(organization_id) );
create policy analyses_update on public.call_analyses for update to authenticated using ( public.is_org_member(organization_id) ) with check ( public.is_org_member(organization_id) );
create policy analyses_delete on public.call_analyses for delete to authenticated using ( public.has_org_role(organization_id, array['owner','admin','manager']) );

-- scores
drop policy if exists scores_select on public.scores;
drop policy if exists scores_insert on public.scores;
drop policy if exists scores_update on public.scores;
drop policy if exists scores_delete on public.scores;
create policy scores_select on public.scores for select to authenticated using ( public.is_org_member(organization_id) );
create policy scores_insert on public.scores for insert to authenticated with check ( public.is_org_member(organization_id) );
create policy scores_update on public.scores for update to authenticated using ( public.is_org_member(organization_id) ) with check ( public.is_org_member(organization_id) );
create policy scores_delete on public.scores for delete to authenticated using ( public.has_org_role(organization_id, array['owner','admin','manager']) );

-- call_highlights
drop policy if exists highlights_select on public.call_highlights;
drop policy if exists highlights_insert on public.call_highlights;
drop policy if exists highlights_update on public.call_highlights;
drop policy if exists highlights_delete on public.call_highlights;
create policy highlights_select on public.call_highlights for select to authenticated using ( public.is_org_member(organization_id) );
create policy highlights_insert on public.call_highlights for insert to authenticated with check ( public.is_org_member(organization_id) );
create policy highlights_update on public.call_highlights for update to authenticated using ( public.is_org_member(organization_id) ) with check ( public.is_org_member(organization_id) );
create policy highlights_delete on public.call_highlights for delete to authenticated using ( public.has_org_role(organization_id, array['owner','admin','manager']) );

-- feedbacks
drop policy if exists feedbacks_select on public.feedbacks;
drop policy if exists feedbacks_insert on public.feedbacks;
drop policy if exists feedbacks_update on public.feedbacks;
drop policy if exists feedbacks_delete on public.feedbacks;
create policy feedbacks_select on public.feedbacks for select to authenticated using ( public.is_org_member(organization_id) );
create policy feedbacks_insert on public.feedbacks for insert to authenticated with check ( public.is_org_member(organization_id) );
create policy feedbacks_update on public.feedbacks for update to authenticated using ( public.is_org_member(organization_id) ) with check ( public.is_org_member(organization_id) );
create policy feedbacks_delete on public.feedbacks for delete to authenticated using ( public.has_org_role(organization_id, array['owner','admin','manager']) );

-- improvement_actions
drop policy if exists actions_select on public.improvement_actions;
drop policy if exists actions_insert on public.improvement_actions;
drop policy if exists actions_update on public.improvement_actions;
drop policy if exists actions_delete on public.improvement_actions;
create policy actions_select on public.improvement_actions for select to authenticated using ( public.is_org_member(organization_id) );
create policy actions_insert on public.improvement_actions for insert to authenticated with check ( public.is_org_member(organization_id) );
create policy actions_update on public.improvement_actions for update to authenticated using ( public.is_org_member(organization_id) ) with check ( public.is_org_member(organization_id) );
create policy actions_delete on public.improvement_actions for delete to authenticated using ( public.has_org_role(organization_id, array['owner','admin','manager']) );

-- ---------------------------------------------------------------------------
-- criteria (rubrica): NULL = global (todos leem); custom = por org (owner/admin)
-- ---------------------------------------------------------------------------
drop policy if exists criteria_select on public.criteria;
drop policy if exists criteria_insert on public.criteria;
drop policy if exists criteria_update on public.criteria;
drop policy if exists criteria_delete on public.criteria;
create policy criteria_select on public.criteria for select to authenticated
  using ( organization_id is null or public.is_org_member(organization_id) );
create policy criteria_insert on public.criteria for insert to authenticated
  with check ( organization_id is not null and public.has_org_role(organization_id, array['owner','admin']) );
create policy criteria_update on public.criteria for update to authenticated
  using ( organization_id is not null and public.has_org_role(organization_id, array['owner','admin']) )
  with check ( organization_id is not null and public.has_org_role(organization_id, array['owner','admin']) );
create policy criteria_delete on public.criteria for delete to authenticated
  using ( organization_id is not null and public.has_org_role(organization_id, array['owner','admin']) );

-- ---------------------------------------------------------------------------
-- LOGS (slack_logs, webhook_logs): leitura só p/ gestão; escrita só service_role
-- ---------------------------------------------------------------------------
drop policy if exists slack_logs_select on public.slack_logs;
create policy slack_logs_select on public.slack_logs for select to authenticated
  using ( public.has_org_role(organization_id, array['owner','admin','manager']) );

drop policy if exists webhook_logs_select on public.webhook_logs;
create policy webhook_logs_select on public.webhook_logs for select to authenticated
  using ( public.has_org_role(organization_id, array['owner','admin','manager']) );
-- (sem insert/update/delete p/ authenticated -> só service_role grava logs)
