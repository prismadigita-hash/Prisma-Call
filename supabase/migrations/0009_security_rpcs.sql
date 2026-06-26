-- ============================================================================
-- 0009 — RPCs (Postgres Functions) para operações críticas/pesadas
--
-- Preferência: SECURITY INVOKER (a RLS já escopa por org). Validação explícita
-- de auth.uid()/membership/role dentro de cada função. search_path travado.
-- Erros claros via RAISE EXCEPTION. GRANT EXECUTE só para authenticated.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- create_call: cria uma call validando a organização do closer
-- ---------------------------------------------------------------------------
create or replace function public.create_call(
  p_closer_id     uuid,
  p_client_name   text,
  p_call_date     date default current_date,
  p_transcript    text default null,
  p_recording_url text default null,
  p_source        text default 'transcricao'
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_org uuid;
  v_id  uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Não autenticado' using errcode = '28000';
  end if;

  -- RLS em closers garante que só lemos closer da nossa org
  select organization_id into v_org from public.closers
   where id = p_closer_id and deleted_at is null;
  if v_org is null then
    raise exception 'Closer não encontrado ou sem acesso' using errcode = '42501';
  end if;
  if not public.is_org_member(v_org) then
    raise exception 'Sem permissão na organização' using errcode = '42501';
  end if;
  if coalesce(length(trim(p_transcript)), 0) = 0
     and coalesce(length(trim(p_recording_url)), 0) = 0 then
    raise exception 'Informe a transcrição ou um link da gravação' using errcode = '22023';
  end if;

  insert into public.calls (organization_id, closer_id, client_name, call_date,
                            transcript, recording_url, source, status)
  values (v_org, p_closer_id, p_client_name, coalesce(p_call_date, current_date),
          nullif(trim(p_transcript), ''), nullif(trim(p_recording_url), ''),
          p_source::public.call_source, 'pendente')
  returning id into v_id;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- set_action_status: muda status de uma ação (RLS garante org)
-- ---------------------------------------------------------------------------
create or replace function public.set_action_status(p_action_id uuid, p_status text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.improvement_actions
     set status = p_status::public.action_status
   where id = p_action_id;
  if not found then
    raise exception 'Ação não encontrada ou sem acesso' using errcode = '42501';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- soft_delete_call: exclusão lógica (restrita a owner/admin/manager)
-- ---------------------------------------------------------------------------
create or replace function public.soft_delete_call(p_call_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare v_org uuid;
begin
  select organization_id into v_org from public.calls where id = p_call_id;
  if v_org is null then
    raise exception 'Call não encontrada ou sem acesso' using errcode = '42501';
  end if;
  if not public.has_org_role(v_org, array['owner','admin','manager']) then
    raise exception 'Sem permissão para excluir' using errcode = '42501';
  end if;
  update public.calls
     set deleted_at = now(), deleted_by = (select auth.uid())
   where id = p_call_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- get_dashboard_metrics: agregações do dashboard (1 ida ao banco)
-- ---------------------------------------------------------------------------
create or replace function public.get_dashboard_metrics(p_org uuid)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare result jsonb;
begin
  if not public.is_org_member(p_org) then
    raise exception 'Sem acesso à organização' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'closers_ativos', (
      select count(*) from public.closers c
      where c.organization_id = p_org and c.active and c.deleted_at is null),
    'calls_analisadas', (
      select count(*) from public.call_analyses a
      where a.organization_id = p_org and a.status = 'concluida'),
    'nota_media', (
      select round(avg(a.overall_score)::numeric, 1) from public.call_analyses a
      where a.organization_id = p_org and a.status = 'concluida'),
    'acoes_aplicadas', (
      select count(*) from public.improvement_actions ia
      where ia.organization_id = p_org and ia.status = 'aplicada')
  ) into result;

  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- GRANTS: nenhuma RPC exposta a anon/public; só authenticated executa.
-- ---------------------------------------------------------------------------
revoke execute on function public.create_call(uuid, text, date, text, text, text) from public, anon;
revoke execute on function public.set_action_status(uuid, text)                   from public, anon;
revoke execute on function public.soft_delete_call(uuid)                          from public, anon;
revoke execute on function public.get_dashboard_metrics(uuid)                     from public, anon;

grant execute on function public.create_call(uuid, text, date, text, text, text)  to authenticated;
grant execute on function public.set_action_status(uuid, text)                    to authenticated;
grant execute on function public.soft_delete_call(uuid)                           to authenticated;
grant execute on function public.get_dashboard_metrics(uuid)                      to authenticated;
