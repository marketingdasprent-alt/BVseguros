-- BV Seguros · CRM: RGPD, exportar e anonimizar os dados de um cliente (crm/RGPD-PROPOSTA.md).
-- Correr uma vez no SQL Editor do Supabase, depois de 2026-10-01_convite_sem_senha.sql,
-- e antes de publicar o CRM com esta funcionalidade. O schema.sql já inclui isto.
begin;

-- O histórico passa a registar também quem exportou e quem anonimizou (sem copiar dados).
alter table public.historico_registos drop constraint if exists historico_registos_acao_check;
alter table public.historico_registos add constraint historico_registos_acao_check
  check (acao in ('criado', 'alterado', 'apagado', 'exportado', 'anonimizado'));

-- Tudo o que o CRM tem sobre um cliente, numa ida, para responder a um pedido de acesso.
-- Só admin; fica registado no histórico do cliente.
create or replace function public.exportar_cliente(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cli public.clientes;
  v_apolices uuid[];
  v_dados jsonb;
begin
  if not public.is_admin_user() then
    raise exception 'CONFLITO: Só um administrador pode exportar os dados de um cliente.' using errcode = '42501';
  end if;
  select * into v_cli from public.clientes where id = p_id;
  if not found then
    raise exception 'CONFLITO: Cliente não encontrado.';
  end if;
  select coalesce(array_agg(id), '{}') into v_apolices from public.apolices where cliente_id = p_id;

  v_dados := jsonb_build_object(
    'exportado_em', now(),
    'cliente', to_jsonb(v_cli),
    'lead_origem', (select to_jsonb(l) from public.leads l where l.id = v_cli.lead_origem_id),
    'apolices', coalesce((select jsonb_agg(to_jsonb(a) order by a.data_inicio) from public.apolices a where a.cliente_id = p_id), '[]'),
    'propostas', coalesce((select jsonb_agg(to_jsonb(p) order by p.criado_em) from public.propostas p
      where p.cliente_id = p_id or (v_cli.lead_origem_id is not null and p.lead_id = v_cli.lead_origem_id)), '[]'),
    'renovacoes', coalesce((select jsonb_agg(to_jsonb(r) order by r.criado_em) from public.renovacoes r where r.apolice_id = any(v_apolices)), '[]'),
    'sinistros', coalesce((select jsonb_agg(to_jsonb(s) order by s.data_ocorrencia) from public.sinistros s where s.apolice_id = any(v_apolices)), '[]'),
    'atividades', coalesce((select jsonb_agg(to_jsonb(t) order by t.data_atividade) from public.atividades t
      where t.cliente_id = p_id or (v_cli.lead_origem_id is not null and t.lead_id = v_cli.lead_origem_id)), '[]'),
    'pedidos_sinistro', coalesce((select jsonb_agg(to_jsonb(ps) order by ps.criado_em) from public.pedidos_sinistro ps where ps.cliente_id = p_id), '[]'),
    'historico', coalesce((select jsonb_agg(jsonb_build_object('quando', h.criado_em, 'quem', h.autor_nome, 'acao', h.acao, 'tabela', h.tabela, 'resumo', h.resumo, 'alteracoes', h.alteracoes) order by h.criado_em)
      from public.historico_registos h where h.cliente_id = p_id or (h.tabela = 'leads' and h.registo_id = v_cli.lead_origem_id)), '[]')
  );

  insert into public.historico_registos (tabela, registo_id, cliente_id, acao, resumo, autor_id, autor_nome)
  values ('clientes', p_id, p_id, 'exportado', v_cli.nome, auth.uid(), (select nome from public.profiles where id = auth.uid()));

  return v_dados;
end;
$$;

revoke all on function public.exportar_cliente(uuid) from public, anon;
grant execute on function public.exportar_cliente(uuid) to authenticated;

-- Apaga os dados pessoais do cliente e de tudo o que o identifica, numa transação.
-- Fica o que serve para estatística (apólices, ramos, prémios, datas, estados). Irreversível:
-- o nome tem de ser escrito por extenso para confirmar.
create or replace function public.anonimizar_cliente(p_id uuid, p_confirmacao text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cli public.clientes;
  v_marca text := 'anonimizado (' || left(p_id::text, 8) || ')';
begin
  if not public.is_admin_user() then
    raise exception 'CONFLITO: Só um administrador pode anonimizar um cliente.' using errcode = '42501';
  end if;
  select * into v_cli from public.clientes where id = p_id for update;
  if not found then
    raise exception 'CONFLITO: Cliente não encontrado.';
  end if;
  if btrim(coalesce(p_confirmacao, '')) is distinct from btrim(v_cli.nome) then
    raise exception 'CONFLITO: O nome escrito não é igual ao do cliente. Nada foi alterado.';
  end if;

  update public.clientes set nome = 'Cliente ' || v_marca, telefone = 'anonimizado', email = null, nif = null, morada = null where id = p_id;
  update public.leads set nome = 'Lead ' || v_marca, telefone = 'anonimizado', email = null, mensagem = null, notas = null
    where id = v_cli.lead_origem_id;
  update public.pedidos_sinistro set nome = 'anonimizado', email = 'anonimizado', telefone = 'anonimizado', descricao = 'anonimizado',
    local = null, detalhes = '{}'::jsonb, notas = null where cliente_id = p_id;
  update public.sinistros set descricao = 'anonimizado', notas = null where apolice_id in (select id from public.apolices where cliente_id = p_id);
  update public.renovacoes set notas = null where apolice_id in (select id from public.apolices where cliente_id = p_id);
  update public.propostas set notas = null
    where cliente_id = p_id or (v_cli.lead_origem_id is not null and lead_id = v_cli.lead_origem_id);
  update public.atividades set titulo = 'anonimizado', notas = null
    where cliente_id = p_id or (v_cli.lead_origem_id is not null and lead_id = v_cli.lead_origem_id);

  -- O gatilho do histórico acabou de guardar os valores antigos destas alterações: saem,
  -- e nas entradas anteriores apagam-se os valores e os nomes. Fica só o registo de quem anonimizou.
  delete from public.historico_registos h
    where h.criado_em = now() and h.acao = 'alterado'
      and (h.cliente_id = p_id or (h.tabela = 'leads' and h.registo_id = v_cli.lead_origem_id)
        or (h.tabela = 'propostas' and h.registo_id in (select id from public.propostas where lead_id = v_cli.lead_origem_id)));
  update public.historico_registos h
    set alteracoes = null,
        resumo = case when h.tabela in ('clientes', 'leads', 'sinistros') then v_marca else h.resumo end
    where h.cliente_id = p_id or (h.tabela = 'leads' and h.registo_id = v_cli.lead_origem_id)
      or (h.tabela = 'propostas' and h.registo_id in (select id from public.propostas where lead_id = v_cli.lead_origem_id));

  insert into public.historico_registos (tabela, registo_id, cliente_id, acao, resumo, autor_id, autor_nome)
  values ('clientes', p_id, p_id, 'anonimizado', 'Cliente ' || v_marca, auth.uid(), (select nome from public.profiles where id = auth.uid()));
end;
$$;

revoke all on function public.anonimizar_cliente(uuid, text) from public, anon;
grant execute on function public.anonimizar_cliente(uuid, text) to authenticated;

commit;
