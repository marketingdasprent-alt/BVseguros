-- BV Seguros · CRM: grupos configuráveis no CRM, com permissões por módulo e carteira própria ou partilhada.
-- Correr uma vez no SQL Editor do Supabase, depois de 2026-09-28_validar_nome_telefone.sql.
-- O schema.sql já inclui isto para projetos novos.
-- O administrador continua a ter acesso total. Os mediadores de hoje passam para o grupo "Mediador",
-- com as mesmas permissões que já tinham: no dia da mudança ninguém ganha nem perde acesso.
begin;

-- ============================================================
-- 1. Grupos e permissões
-- ============================================================
create table if not exists public.grupos (
  id uuid primary key default gen_random_uuid(),
  nome text not null constraint grupos_nome_valido check (char_length(btrim(nome)) between 2 and 60),
  descricao text constraint grupos_descricao_valida check (descricao is null or char_length(descricao) <= 300),
  -- toda: vê a carteira toda. propria: só os leads/clientes de que é responsável e os sem responsável.
  carteira text not null default 'toda' constraint grupos_carteira_valida check (carteira in ('toda', 'propria')),
  criado_em timestamptz not null default now()
);
create unique index if not exists grupos_nome_unico on public.grupos (lower(btrim(nome)));
alter table public.grupos enable row level security;

create table if not exists public.grupo_permissoes (
  grupo_id uuid not null references public.grupos(id) on delete cascade,
  modulo text not null constraint grupo_permissoes_modulo_valido
    check (modulo in ('dashboard', 'leads', 'propostas', 'clientes', 'apolices', 'renovacoes', 'sinistros', 'atividades')),
  nivel text not null default 'nenhum' constraint grupo_permissoes_nivel_valido check (nivel in ('nenhum', 'ver', 'editar')),
  pode_apagar boolean not null default false,
  pode_atribuir boolean not null default false,
  primary key (grupo_id, modulo),
  -- Apagar e atribuir só fazem sentido para quem edita; atribuir só existe em leads e clientes.
  constraint grupo_permissoes_extras_validos check ((not pode_apagar and not pode_atribuir) or nivel = 'editar'),
  constraint grupo_permissoes_atribuir_valido check (not pode_atribuir or modulo in ('leads', 'clientes'))
);
alter table public.grupo_permissoes enable row level security;

-- restrict: apagar um grupo com pessoas deixava-as sem acesso sem ninguém reparar.
alter table public.profiles add column if not exists grupo_id uuid references public.grupos(id) on delete restrict;
create index if not exists idx_profiles_grupo_id on public.profiles(grupo_id);

-- ============================================================
-- 2. Funções de permissão (security definer: leem profiles/grupos sem depender da RLS deles)
-- ============================================================
create or replace function public.pode(p_modulo text, p_acao text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select case
      when p.is_admin then true
      when p_acao = 'ver' then gp.nivel in ('ver', 'editar')
      when p_acao = 'editar' then gp.nivel = 'editar'
      when p_acao = 'apagar' then gp.nivel = 'editar' and gp.pode_apagar
      when p_acao = 'atribuir' then gp.nivel = 'editar' and gp.pode_atribuir
      else false
    end
    from public.profiles p
    left join public.grupo_permissoes gp on gp.grupo_id = p.grupo_id and gp.modulo = p_modulo
    where p.id = auth.uid() and p.ativo
  ), false);
$$;

create or replace function public.ve_carteira_toda()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select p.is_admin or g.carteira = 'toda'
    from public.profiles p
    left join public.grupos g on g.id = p.grupo_id
    where p.id = auth.uid() and p.ativo
  ), false);
$$;

-- Carteira própria: o registo é da pessoa ou ainda não tem responsável (para o poder assumir).
create or replace function public.ve_lead(p_lead uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.leads l where l.id = p_lead and (l.responsavel_id is null or l.responsavel_id = auth.uid()));
$$;

create or replace function public.ve_cliente(p_cliente uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.clientes c where c.id = p_cliente and (c.responsavel_id is null or c.responsavel_id = auth.uid()));
$$;

create or replace function public.ve_apolice(p_apolice uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.apolices a join public.clientes c on c.id = a.cliente_id
    where a.id = p_apolice and (c.responsavel_id is null or c.responsavel_id = auth.uid())
  );
$$;

create or replace function public.meu_grupo()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select grupo_id from public.profiles where id = auth.uid();
$$;

-- O que o CRM precisa para mostrar/esconder menus e botões (a garantia real é a RLS).
create or replace function public.minhas_permissoes()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'grupo', g.nome,
    'carteira', coalesce(g.carteira, 'toda'),
    'modulos', coalesce((
      select jsonb_object_agg(gp.modulo, jsonb_build_object('nivel', gp.nivel, 'apagar', gp.pode_apagar, 'atribuir', gp.pode_atribuir))
      from public.grupo_permissoes gp where gp.grupo_id = p.grupo_id
    ), '{}'::jsonb)
  )
  from public.profiles p
  left join public.grupos g on g.id = p.grupo_id
  where p.id = auth.uid() and p.ativo;
$$;

revoke all on function public.minhas_permissoes() from public;
grant execute on function public.minhas_permissoes() to authenticated;

-- Grava o grupo e as permissões de uma vez. p_permissoes: [{ modulo, nivel, apagar, atribuir }].
create or replace function public.guardar_grupo(p_id uuid, p_nome text, p_descricao text, p_carteira text, p_permissoes jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid := p_id;
begin
  if not public.is_admin_user() then
    raise exception 'CONFLITO: Só o administrador pode gerir grupos.';
  end if;

  if v_id is null then
    insert into public.grupos (nome, descricao, carteira)
    values (btrim(p_nome), nullif(btrim(coalesce(p_descricao, '')), ''), p_carteira)
    returning id into v_id;
  else
    update public.grupos
    set nome = btrim(p_nome), descricao = nullif(btrim(coalesce(p_descricao, '')), ''), carteira = p_carteira
    where id = v_id;
    if not found then
      raise exception 'CONFLITO: Este grupo já não existe. Atualize a página.';
    end if;
    delete from public.grupo_permissoes where grupo_id = v_id;
  end if;

  insert into public.grupo_permissoes (grupo_id, modulo, nivel, pode_apagar, pode_atribuir)
  select v_id, r.modulo, r.nivel, coalesce(r.apagar, false), coalesce(r.atribuir, false)
  from jsonb_to_recordset(coalesce(p_permissoes, '[]'::jsonb)) as r(modulo text, nivel text, apagar boolean, atribuir boolean)
  where r.nivel <> 'nenhum';

  return v_id;
end;
$$;

revoke all on function public.guardar_grupo(uuid, text, text, text, jsonb) from public;
grant execute on function public.guardar_grupo(uuid, text, text, text, jsonb) to authenticated;

-- ============================================================
-- 3. RLS de grupos: o admin gere; cada pessoa vê só o seu grupo.
-- ============================================================
drop policy if exists "grupos_ler" on public.grupos;
drop policy if exists "grupos_gerir" on public.grupos;
create policy "grupos_ler" on public.grupos for select using (public.is_admin_user() or id = public.meu_grupo());
create policy "grupos_gerir" on public.grupos for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists "grupo_permissoes_ler" on public.grupo_permissoes;
drop policy if exists "grupo_permissoes_gerir" on public.grupo_permissoes;
create policy "grupo_permissoes_ler" on public.grupo_permissoes for select using (public.is_admin_user() or grupo_id = public.meu_grupo());
create policy "grupo_permissoes_gerir" on public.grupo_permissoes for all using (public.is_admin_user()) with check (public.is_admin_user());

-- ============================================================
-- 4. RLS dos dados: o módulo tem de estar no grupo, e a carteira própria filtra por responsável.
-- (select ...) à volta das funções: o Postgres calcula-as uma vez por consulta, não por linha.
-- ============================================================
drop policy if exists "leads_ler" on public.leads;
drop policy if exists "leads_criar" on public.leads;
drop policy if exists "leads_editar" on public.leads;
drop policy if exists "leads_apagar" on public.leads;
create policy "leads_ler" on public.leads for select
  using ((select public.pode('leads', 'ver')) and ((select public.ve_carteira_toda()) or responsavel_id is null or responsavel_id = (select auth.uid())));
create policy "leads_criar" on public.leads for insert
  with check ((select public.pode('leads', 'editar')));
create policy "leads_editar" on public.leads for update
  using ((select public.pode('leads', 'editar')) and ((select public.ve_carteira_toda()) or responsavel_id is null or responsavel_id = (select auth.uid())))
  with check ((select public.pode('leads', 'editar')) and ((select public.ve_carteira_toda()) or responsavel_id is null or responsavel_id = (select auth.uid()) or (select public.pode('leads', 'atribuir'))));
create policy "leads_apagar" on public.leads for delete
  using ((select public.pode('leads', 'apagar')) and ((select public.ve_carteira_toda()) or responsavel_id is null or responsavel_id = (select auth.uid())));

drop policy if exists "clientes_ler" on public.clientes;
drop policy if exists "clientes_criar" on public.clientes;
drop policy if exists "clientes_editar" on public.clientes;
drop policy if exists "clientes_apagar" on public.clientes;
create policy "clientes_ler" on public.clientes for select
  using ((select public.pode('clientes', 'ver')) and ((select public.ve_carteira_toda()) or responsavel_id is null or responsavel_id = (select auth.uid())));
create policy "clientes_criar" on public.clientes for insert
  with check ((select public.pode('clientes', 'editar')));
create policy "clientes_editar" on public.clientes for update
  using ((select public.pode('clientes', 'editar')) and ((select public.ve_carteira_toda()) or responsavel_id is null or responsavel_id = (select auth.uid())))
  with check ((select public.pode('clientes', 'editar')) and ((select public.ve_carteira_toda()) or responsavel_id is null or responsavel_id = (select auth.uid()) or (select public.pode('clientes', 'atribuir'))));
create policy "clientes_apagar" on public.clientes for delete
  using ((select public.pode('clientes', 'apagar')) and ((select public.ve_carteira_toda()) or responsavel_id is null or responsavel_id = (select auth.uid())));

drop policy if exists "apolices_ler" on public.apolices;
drop policy if exists "apolices_criar" on public.apolices;
drop policy if exists "apolices_editar" on public.apolices;
drop policy if exists "apolices_apagar" on public.apolices;
create policy "apolices_ler" on public.apolices for select
  using ((select public.pode('apolices', 'ver')) and ((select public.ve_carteira_toda()) or public.ve_cliente(cliente_id)));
create policy "apolices_criar" on public.apolices for insert
  with check ((select public.pode('apolices', 'editar')) and ((select public.ve_carteira_toda()) or public.ve_cliente(cliente_id)));
create policy "apolices_editar" on public.apolices for update
  using ((select public.pode('apolices', 'editar')) and ((select public.ve_carteira_toda()) or public.ve_cliente(cliente_id)))
  with check ((select public.pode('apolices', 'editar')) and ((select public.ve_carteira_toda()) or public.ve_cliente(cliente_id)));
create policy "apolices_apagar" on public.apolices for delete
  using ((select public.pode('apolices', 'apagar')) and ((select public.ve_carteira_toda()) or public.ve_cliente(cliente_id)));

drop policy if exists "propostas_ler" on public.propostas;
drop policy if exists "propostas_criar" on public.propostas;
drop policy if exists "propostas_editar" on public.propostas;
drop policy if exists "propostas_apagar" on public.propostas;
create policy "propostas_ler" on public.propostas for select
  using ((select public.pode('propostas', 'ver')) and ((select public.ve_carteira_toda()) or (lead_id is not null and public.ve_lead(lead_id)) or (cliente_id is not null and public.ve_cliente(cliente_id))));
create policy "propostas_criar" on public.propostas for insert
  with check ((select public.pode('propostas', 'editar')) and ((select public.ve_carteira_toda()) or (lead_id is not null and public.ve_lead(lead_id)) or (cliente_id is not null and public.ve_cliente(cliente_id))));
create policy "propostas_editar" on public.propostas for update
  using ((select public.pode('propostas', 'editar')) and ((select public.ve_carteira_toda()) or (lead_id is not null and public.ve_lead(lead_id)) or (cliente_id is not null and public.ve_cliente(cliente_id))))
  with check ((select public.pode('propostas', 'editar')) and ((select public.ve_carteira_toda()) or (lead_id is not null and public.ve_lead(lead_id)) or (cliente_id is not null and public.ve_cliente(cliente_id))));
create policy "propostas_apagar" on public.propostas for delete
  using ((select public.pode('propostas', 'apagar')) and ((select public.ve_carteira_toda()) or (lead_id is not null and public.ve_lead(lead_id)) or (cliente_id is not null and public.ve_cliente(cliente_id))));

drop policy if exists "renovacoes_ler" on public.renovacoes;
drop policy if exists "renovacoes_criar" on public.renovacoes;
drop policy if exists "renovacoes_editar" on public.renovacoes;
drop policy if exists "renovacoes_apagar" on public.renovacoes;
create policy "renovacoes_ler" on public.renovacoes for select
  using ((select public.pode('renovacoes', 'ver')) and ((select public.ve_carteira_toda()) or public.ve_apolice(apolice_id)));
create policy "renovacoes_criar" on public.renovacoes for insert
  with check ((select public.pode('renovacoes', 'editar')) and ((select public.ve_carteira_toda()) or public.ve_apolice(apolice_id)));
create policy "renovacoes_editar" on public.renovacoes for update
  using ((select public.pode('renovacoes', 'editar')) and ((select public.ve_carteira_toda()) or public.ve_apolice(apolice_id)))
  with check ((select public.pode('renovacoes', 'editar')) and ((select public.ve_carteira_toda()) or public.ve_apolice(apolice_id)));
create policy "renovacoes_apagar" on public.renovacoes for delete
  using ((select public.pode('renovacoes', 'apagar')) and ((select public.ve_carteira_toda()) or public.ve_apolice(apolice_id)));

drop policy if exists "sinistros_ler" on public.sinistros;
drop policy if exists "sinistros_criar" on public.sinistros;
drop policy if exists "sinistros_editar" on public.sinistros;
drop policy if exists "sinistros_apagar" on public.sinistros;
create policy "sinistros_ler" on public.sinistros for select
  using ((select public.pode('sinistros', 'ver')) and ((select public.ve_carteira_toda()) or public.ve_apolice(apolice_id)));
create policy "sinistros_criar" on public.sinistros for insert
  with check ((select public.pode('sinistros', 'editar')) and ((select public.ve_carteira_toda()) or public.ve_apolice(apolice_id)));
create policy "sinistros_editar" on public.sinistros for update
  using ((select public.pode('sinistros', 'editar')) and ((select public.ve_carteira_toda()) or public.ve_apolice(apolice_id)))
  with check ((select public.pode('sinistros', 'editar')) and ((select public.ve_carteira_toda()) or public.ve_apolice(apolice_id)));
create policy "sinistros_apagar" on public.sinistros for delete
  using ((select public.pode('sinistros', 'apagar')) and ((select public.ve_carteira_toda()) or public.ve_apolice(apolice_id)));

-- Atividade de um cliente segue o cliente; de um lead, o lead; sem associação, quem a registou.
drop policy if exists "atividades_ler" on public.atividades;
drop policy if exists "atividades_criar" on public.atividades;
drop policy if exists "atividades_editar" on public.atividades;
drop policy if exists "atividades_apagar" on public.atividades;
create policy "atividades_ler" on public.atividades for select
  using ((select public.pode('atividades', 'ver')) and ((select public.ve_carteira_toda()) or case
    when cliente_id is not null then public.ve_cliente(cliente_id)
    when lead_id is not null then public.ve_lead(lead_id)
    else responsavel_id is null or responsavel_id = (select auth.uid()) end));
create policy "atividades_criar" on public.atividades for insert
  with check ((select public.pode('atividades', 'editar')) and ((select public.ve_carteira_toda()) or case
    when cliente_id is not null then public.ve_cliente(cliente_id)
    when lead_id is not null then public.ve_lead(lead_id)
    else responsavel_id is null or responsavel_id = (select auth.uid()) end));
create policy "atividades_editar" on public.atividades for update
  using ((select public.pode('atividades', 'editar')) and ((select public.ve_carteira_toda()) or case
    when cliente_id is not null then public.ve_cliente(cliente_id)
    when lead_id is not null then public.ve_lead(lead_id)
    else responsavel_id is null or responsavel_id = (select auth.uid()) end))
  with check ((select public.pode('atividades', 'editar')) and ((select public.ve_carteira_toda()) or case
    when cliente_id is not null then public.ve_cliente(cliente_id)
    when lead_id is not null then public.ve_lead(lead_id)
    else responsavel_id is null or responsavel_id = (select auth.uid()) end));
create policy "atividades_apagar" on public.atividades for delete
  using ((select public.pode('atividades', 'apagar')) and ((select public.ve_carteira_toda()) or case
    when cliente_id is not null then public.ve_cliente(cliente_id)
    when lead_id is not null then public.ve_lead(lead_id)
    else responsavel_id is null or responsavel_id = (select auth.uid()) end));

-- O histórico de um registo vê-o quem vê o módulo e o cliente (ou o lead) a que pertence.
drop policy if exists "historico_ler" on public.historico_registos;
create policy "historico_ler" on public.historico_registos for select
  using (public.pode(tabela, 'ver') and ((select public.ve_carteira_toda())
    or (cliente_id is not null and public.ve_cliente(cliente_id))
    or (tabela = 'leads' and public.ve_lead(registo_id))));

-- ============================================================
-- 5. Regras que diziam "só o admin" passam a perguntar ao grupo.
-- ============================================================
create or replace function public.proteger_responsavel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.responsavel_id is null or (auth.uid() is not null and not public.pode(tg_table_name, 'atribuir')) then
      new.responsavel_id := null;
      -- ifs separados: o plpgsql resolve new.lead_origem_id mesmo com o and a falhar.
      if tg_table_name = 'clientes' then
        if new.lead_origem_id is not null then
          select l.responsavel_id into new.responsavel_id from public.leads l where l.id = new.lead_origem_id;
        end if;
      end if;
      new.responsavel_id := coalesce(new.responsavel_id, auth.uid());
    end if;
  else
    if new.responsavel_id is not distinct from old.responsavel_id then
      return new;
    end if;
    if auth.uid() is not null and not public.pode(tg_table_name, 'atribuir')
      and not (old.responsavel_id is null and new.responsavel_id = auth.uid()) then
      raise exception 'CONFLITO: Não tem permissão para atribuir a outro responsável.';
    end if;
  end if;

  if new.responsavel_id is not null
    and not exists (select 1 from public.profiles where id = new.responsavel_id and ativo) then
    raise exception 'CONFLITO: O responsável tem de ser uma conta com acesso ativo.';
  end if;

  return new;
end;
$$;

-- security definer para mover também propostas e atividades que o grupo não edita:
-- sem isso ficavam presas ao lead e iam com ele se o lead fosse apagado.
create or replace function public.converter_lead(
  p_lead_id uuid,
  p_atualizado_em timestamptz,
  p_nome text,
  p_telefone text,
  p_email text,
  p_nif text,
  p_morada text
)
returns public.clientes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead public.leads;
  v_cliente public.clientes;
begin
  if not (public.pode('leads', 'editar') and public.pode('clientes', 'editar')) then
    raise exception 'CONFLITO: Não tem permissão para converter leads em clientes.';
  end if;

  select * into v_lead from public.leads where id = p_lead_id for update;
  if not found or not (public.ve_carteira_toda() or public.ve_lead(p_lead_id)) then
    raise exception 'CONFLITO: Este lead já não existe. Atualize a página.';
  end if;
  if v_lead.atualizado_em is distinct from p_atualizado_em then
    raise exception 'CONFLITO: este lead foi alterado por outra pessoa entretanto. Atualize a página e tente novamente.';
  end if;
  if exists (select 1 from public.clientes where lead_origem_id = p_lead_id) then
    raise exception 'CONFLITO: Este lead já foi convertido em cliente.';
  end if;

  insert into public.clientes (nome, telefone, email, nif, morada, lead_origem_id)
  values (
    btrim(p_nome),
    btrim(p_telefone),
    nullif(btrim(coalesce(p_email, '')), ''),
    nullif(btrim(coalesce(p_nif, '')), ''),
    nullif(btrim(coalesce(p_morada, '')), ''),
    p_lead_id
  )
  returning * into v_cliente;

  -- Sem isto, apagar o lead mais tarde levava as propostas em cascata.
  update public.propostas set cliente_id = v_cliente.id, lead_id = null where lead_id = p_lead_id;
  update public.atividades set cliente_id = v_cliente.id where lead_id = p_lead_id and cliente_id is null;
  update public.leads set estado = 'convertido', atualizado_em = now() where id = p_lead_id;

  return v_cliente;
end;
$$;

revoke all on function public.converter_lead(uuid, timestamptz, text, text, text, text, text) from public;
grant execute on function public.converter_lead(uuid, timestamptz, text, text, text, text, text) to authenticated;

-- Renovar mexe na apólice e na renovação: sem as duas permissões, a apólice "desaparecia" a meio.
create or replace function public.marcar_renovada(
  p_apolice_id uuid,
  p_renovacao_id uuid,
  p_data_fim_anterior date,
  p_nova_data_fim date,
  p_novo_premio numeric
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not (public.pode('renovacoes', 'editar') and public.pode('apolices', 'editar')) then
    raise exception 'CONFLITO: Não tem permissão para renovar apólices.';
  end if;

  update public.apolices
  set data_fim = p_nova_data_fim,
      premio_anual = coalesce(p_novo_premio, premio_anual)
  where id = p_apolice_id;

  if not found then
    raise exception 'Apólice não encontrada.';
  end if;

  if p_renovacao_id is not null then
    update public.renovacoes
    set estado = 'renovada', atualizado_em = now()
    where id = p_renovacao_id;
  else
    insert into public.renovacoes (apolice_id, data_fim_anterior, estado, notas)
    values (p_apolice_id, p_data_fim_anterior, 'renovada', null);
  end if;
end;
$$;

-- ============================================================
-- 6. Mudanças de grupo ficam no histórico de acessos.
-- ============================================================
alter table public.eventos_acesso add column if not exists detalhe text;
alter table public.eventos_acesso drop constraint if exists eventos_acesso_alteracao_check;
alter table public.eventos_acesso
  add constraint eventos_acesso_alteracao_check
  check (alteracao in ('acesso_dado', 'acesso_retirado', 'tornado_admin', 'tornado_mediador', 'nome_alterado', 'convidado', 'excluido', 'grupo_alterado'));

create or replace function public.auditar_acesso()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_autor text := (select nome from public.profiles where id = auth.uid());
begin
  if new.ativo is distinct from old.ativo then
    insert into public.eventos_acesso (perfil_id, perfil_nome, alteracao, realizado_por, realizado_por_nome)
    values (new.id, new.nome, case when new.ativo then 'acesso_dado' else 'acesso_retirado' end, auth.uid(), v_autor);
  end if;
  if new.is_admin is distinct from old.is_admin then
    insert into public.eventos_acesso (perfil_id, perfil_nome, alteracao, realizado_por, realizado_por_nome)
    values (new.id, new.nome, case when new.is_admin then 'tornado_admin' else 'tornado_mediador' end, auth.uid(), v_autor);
  end if;
  if new.nome is distinct from old.nome then
    insert into public.eventos_acesso (perfil_id, perfil_nome, alteracao, realizado_por, realizado_por_nome, nome_anterior)
    values (new.id, new.nome, 'nome_alterado', auth.uid(), v_autor, old.nome);
  end if;
  if new.grupo_id is distinct from old.grupo_id then
    insert into public.eventos_acesso (perfil_id, perfil_nome, alteracao, realizado_por, realizado_por_nome, detalhe)
    values (new.id, new.nome, 'grupo_alterado', auth.uid(), v_autor,
      coalesce((select g.nome from public.grupos g where g.id = new.grupo_id), 'Sem grupo'));
  end if;
  return new;
end;
$$;

-- ============================================================
-- 7. Grupo "Mediador" com as permissões de antes, para quem já não é admin.
-- ============================================================
insert into public.grupos (nome, descricao, carteira)
select 'Mediador', 'Criado automaticamente com as permissões que os mediadores tinham antes dos grupos.', 'toda'
where not exists (select 1 from public.grupos where lower(nome) = 'mediador');

insert into public.grupo_permissoes (grupo_id, modulo, nivel)
select g.id, m.modulo, case when m.modulo = 'dashboard' then 'ver' else 'editar' end
from public.grupos g
cross join (values ('dashboard'), ('leads'), ('propostas'), ('clientes'), ('apolices'), ('renovacoes'), ('sinistros'), ('atividades')) as m(modulo)
where lower(g.nome) = 'mediador'
on conflict (grupo_id, modulo) do nothing;

update public.profiles
set grupo_id = (select id from public.grupos where lower(nome) = 'mediador')
where not is_admin and grupo_id is null;

commit;

notify pgrst, 'reload schema';
