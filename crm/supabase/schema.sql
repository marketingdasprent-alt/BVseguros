-- BV Seguros · CRM — schema inicial
-- Corre este ficheiro no SQL Editor do Supabase (projeto novo e vazio).
-- Convenções: ver AGENTS.md secção 11 (RLS desde a primeira migration).

-- ============================================================
-- profiles — um registo por utilizador interno (mediador/admin)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null constraint profiles_nome_valido check (char_length(btrim(nome)) between 2 and 254),
  email text not null,
  is_admin boolean not null default false,
  ativo boolean not null default false, -- nova conta começa inativa; admin ativa manualmente
  criado_em timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- cria automaticamente um profile (inativo) quando alguém se regista
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.email), new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_active_user()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and ativo = true
  );
$$;

create or replace function public.is_admin_user()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true and ativo = true
  );
$$;

create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin_user());

create policy "profiles_update_admin_only" on public.profiles
  for update using (public.is_admin_user()) with check (public.is_admin_user());

-- O admin só gere acesso (ativo/is_admin): id e email vêm do auth.users, e nunca
-- se pode ficar sem nenhum admin ativo (ninguém conseguiria ativar contas).
create or replace function public.proteger_profiles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.id <> old.id or new.email <> old.email then
    raise exception 'CONFLITO: O id e o email da conta não podem ser alterados aqui.';
  end if;

  -- O bloqueio impede dois admins de se despromoverem ao mesmo tempo.
  if old.is_admin and old.ativo and not (new.is_admin and new.ativo) then
    perform pg_advisory_xact_lock(hashtext('bv_profiles_admins'));
    if not exists (
      select 1 from public.profiles
      where is_admin and ativo and id <> old.id
    ) then
      raise exception 'CONFLITO: Tem de existir pelo menos um administrador ativo.';
    end if;
  end if;

  return new;
end;
$$;

create trigger proteger_profiles
  before update on public.profiles
  for each row execute function public.proteger_profiles();

-- ============================================================
-- leads
-- ============================================================
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text not null,
  email text,
  ramo_interesse text not null check (ramo_interesse in ('auto', 'vida', 'saude', 'multirriscos', 'acidentes_trabalho', 'outro')),
  estado text not null default 'novo' check (estado in ('novo', 'contactado', 'proposta_enviada', 'convertido', 'perdido')),
  notas text,
  origem text not null default 'manual' constraint leads_origem_valida check (origem in ('manual', 'site')),
  mensagem text,
  consentimento_em timestamptz, -- aceitação da política de privacidade (leads do site)
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.leads enable row level security;

create index idx_leads_origem_criado_em on public.leads(origem, criado_em);

-- ============================================================
-- clientes
-- ============================================================
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  nif text,
  telefone text not null,
  email text,
  morada text,
  lead_origem_id uuid references public.leads(id) on delete set null,
  criado_em timestamptz not null default now()
);

alter table public.clientes enable row level security;

-- ============================================================
-- apolices
-- ============================================================
create table public.apolices (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  numero_apolice text not null,
  ramo text not null check (ramo in ('auto', 'vida', 'saude', 'multirriscos', 'acidentes_trabalho', 'outro')),
  seguradora text not null,
  premio_anual numeric(10, 2),
  data_inicio date not null,
  data_fim date,
  estado text not null default 'ativa' check (estado in ('ativa', 'pendente', 'cancelada', 'expirada')),
  criado_em timestamptz not null default now()
);

alter table public.apolices enable row level security;

create index idx_apolices_cliente_id on public.apolices(cliente_id);
create index idx_clientes_lead_origem_id on public.clientes(lead_origem_id);

-- ============================================================
-- propostas — simulação/pedido de emissão ainda não aceite
-- ============================================================
create table public.propostas (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete cascade,
  ramo text not null check (ramo in ('auto', 'vida', 'saude', 'multirriscos', 'acidentes_trabalho', 'outro')),
  seguradora text not null,
  premio_anual_estimado numeric(10, 2),
  coberturas text,
  estado text not null default 'rascunho' check (estado in ('rascunho', 'enviada', 'aceite', 'rejeitada')),
  notas text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint propostas_origem_unica check (
    (lead_id is not null and cliente_id is null) or (lead_id is null and cliente_id is not null)
  )
);

alter table public.propostas enable row level security;

create index idx_propostas_lead_id on public.propostas(lead_id);
create index idx_propostas_cliente_id on public.propostas(cliente_id);

-- ============================================================
-- renovacoes — acompanhamento de cada ciclo de fim de vigência
-- ============================================================
create table public.renovacoes (
  id uuid primary key default gen_random_uuid(),
  apolice_id uuid not null references public.apolices(id) on delete cascade,
  data_fim_anterior date not null,
  estado text not null default 'pendente' check (estado in ('pendente', 'contactado', 'renovada', 'nao_renovada')),
  notas text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.renovacoes enable row level security;

create index idx_renovacoes_apolice_id on public.renovacoes(apolice_id);

-- ============================================================
-- sinistros — participação de ocorrência sobre uma apólice
-- ============================================================
create table public.sinistros (
  id uuid primary key default gen_random_uuid(),
  apolice_id uuid not null references public.apolices(id) on delete cascade,
  numero_sinistro text,
  data_ocorrencia date not null,
  descricao text not null,
  estado text not null default 'participado'
    check (estado in ('participado', 'em_analise', 'aprovado', 'recusado', 'pago')),
  valor_estimado numeric(10, 2),
  valor_pago numeric(10, 2),
  notas text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.sinistros enable row level security;

create index idx_sinistros_apolice_id on public.sinistros(apolice_id);

-- ============================================================
-- atividades — chamadas, emails, reuniões, tarefas e notas
-- ============================================================
create table public.atividades (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('chamada', 'email', 'reuniao', 'tarefa', 'nota')),
  titulo text not null,
  notas text,
  lead_id uuid references public.leads(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete cascade,
  responsavel_id uuid references public.profiles(id) on delete set null,
  concluida boolean not null default false,
  data_prevista date,
  data_atividade timestamptz not null default now(),
  criado_em timestamptz not null default now()
);

alter table public.atividades enable row level security;

create index idx_atividades_lead_id on public.atividades(lead_id);
create index idx_atividades_cliente_id on public.atividades(cliente_id);

-- ============================================================
-- Validação de integridade (auditoria pós-lançamento)
-- Frontend já valida para UX; isto é a garantia real, no lado da BD.
-- ============================================================

alter table public.clientes
  add constraint clientes_nif_formato check (nif is null or nif ~ '^[0-9]{9}$');

alter table public.clientes
  add constraint clientes_nif_unico unique (nif);

-- (de migrations/2026-09-28_validar_nome_telefone.sql)
alter table public.leads
  add constraint leads_nome_valido check (char_length(btrim(nome)) between 2 and 254),
  add constraint leads_telefone_valido check (char_length(btrim(telefone)) between 1 and 30);
alter table public.clientes
  add constraint clientes_nome_valido check (char_length(btrim(nome)) between 2 and 254),
  add constraint clientes_telefone_valido check (char_length(btrim(telefone)) between 1 and 30);

alter table public.apolices
  add constraint apolices_numero_unico unique (numero_apolice);

alter table public.apolices
  add constraint apolices_premio_nao_negativo check (premio_anual is null or premio_anual >= 0);

alter table public.propostas
  add constraint propostas_premio_nao_negativo check (premio_anual_estimado is null or premio_anual_estimado >= 0);

alter table public.sinistros
  add constraint sinistros_valor_estimado_nao_negativo check (valor_estimado is null or valor_estimado >= 0);

alter table public.sinistros
  add constraint sinistros_valor_pago_nao_negativo check (valor_pago is null or valor_pago >= 0);

alter table public.sinistros
  add constraint sinistros_data_nao_futura check (data_ocorrencia <= current_date);

-- ============================================================
-- marcar_renovada — grava apólice + renovação numa única transação.
-- Evita o estado inconsistente descrito na auditoria (gravações
-- separadas onde a segunda podia falhar depois da primeira já ter
-- sido confirmada).
-- ============================================================
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
  if not public.is_active_user() then
    raise exception 'Sem permissão.';
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
-- obter_resumo_dashboard — contagens agregadas para o Dashboard.
-- Antes disto, o Dashboard descarregava 4 tabelas inteiras só para
-- contar linhas. security invoker mantém a RLS de cada tabela em
-- vigor (cada subquery corre com os privilégios de quem chama).
-- ============================================================
create or replace function public.obter_resumo_dashboard()
returns table (
  total_clientes bigint,
  apolices_ativas bigint,
  renovacoes_30_dias bigint,
  propostas_em_aberto bigint,
  sinistros_em_aberto bigint
)
language sql
security invoker
set search_path = public
as $$
  select
    (select count(*) from public.clientes) as total_clientes,
    (select count(*) from public.apolices where estado = 'ativa') as apolices_ativas,
    (select count(*) from public.apolices
       where estado = 'ativa' and data_fim >= current_date and data_fim <= current_date + 30) as renovacoes_30_dias,
    (select count(*) from public.propostas where estado in ('rascunho', 'enviada')) as propostas_em_aberto,
    (select count(*) from public.sinistros where estado not in ('pago', 'recusado')) as sinistros_em_aberto;
$$;

-- ============================================================
-- criar_lead_site: única porta de entrada pública para leads.
-- O visitante anónimo não tem política nenhuma sobre public.leads;
-- só pode chamar esta função, que valida tudo e força origem/estado.
-- ============================================================
create or replace function public.criar_lead_site(
  p_nome text,
  p_email text,
  p_telefone text,
  p_ramo text,
  p_mensagem text,
  p_consentimento boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nome text := btrim(coalesce(p_nome, ''));
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_telefone text := regexp_replace(coalesce(p_telefone, ''), '[\s().-]', '', 'g');
  v_mensagem text := nullif(btrim(coalesce(p_mensagem, '')), '');
begin
  if p_consentimento is not true then
    raise exception 'consentimento_em_falta';
  end if;

  if char_length(v_nome) < 2 or char_length(v_nome) > 120
    or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(v_email) > 254
    or v_telefone !~ '^\+?[0-9]{9,15}$'
    or p_ramo not in ('auto', 'vida', 'saude', 'multirriscos', 'acidentes_trabalho', 'outro')
    or char_length(coalesce(v_mensagem, '')) > 2000 then
    raise exception 'dados_invalidos';
  end if;

  -- Anti-spam simples: o mesmo contacto no máximo 3x/hora, e um tecto global contra inundação.
  if (select count(*) from public.leads
        where origem = 'site' and criado_em > now() - interval '1 hour'
          and (lower(email) = v_email or telefone = v_telefone)) >= 3
    or (select count(*) from public.leads
        where origem = 'site' and criado_em > now() - interval '10 minutes') >= 30 then
    raise exception 'limite_excedido';
  end if;

  insert into public.leads (nome, email, telefone, ramo_interesse, estado, origem, mensagem, consentimento_em)
  values (v_nome, v_email, v_telefone, p_ramo, 'novo', 'site', v_mensagem, now());
end;
$$;

revoke all on function public.criar_lead_site(text, text, text, text, text, boolean) from public;
grant execute on function public.criar_lead_site(text, text, text, text, text, boolean) to anon, authenticated;

-- ============================================================
-- 1. Só o admin apaga. O CRM não tem botões de apagar, mas a política
-- "for all" deixava qualquer conta ativa apagar pela API.
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array['leads', 'clientes', 'apolices', 'propostas', 'renovacoes', 'sinistros', 'atividades'] loop
    execute format('drop policy if exists %I on public.%I', t || '_all_active_users', t);
    execute format('drop policy if exists %I on public.%I', t || '_ler', t);
    execute format('drop policy if exists %I on public.%I', t || '_criar', t);
    execute format('drop policy if exists %I on public.%I', t || '_editar', t);
    execute format('drop policy if exists %I on public.%I', t || '_apagar', t);
    execute format('create policy %I on public.%I for select using (public.is_active_user())', t || '_ler', t);
    execute format('create policy %I on public.%I for insert with check (public.is_active_user())', t || '_criar', t);
    execute format('create policy %I on public.%I for update using (public.is_active_user()) with check (public.is_active_user())', t || '_editar', t);
    execute format('create policy %I on public.%I for delete using (public.is_admin_user())', t || '_apagar', t);
  end loop;
end $$;

-- ============================================================
-- 2. Responsável por lead e por cliente.
-- ============================================================
alter table public.leads add column if not exists responsavel_id uuid references public.profiles(id) on delete set null;
alter table public.clientes add column if not exists responsavel_id uuid references public.profiles(id) on delete set null;
create index if not exists idx_leads_responsavel_id on public.leads(responsavel_id);
create index if not exists idx_clientes_responsavel_id on public.clientes(responsavel_id);

-- Quem cria fica responsável (o cliente herda o do lead de origem); leads do site
-- entram sem responsável. Qualquer conta assume um registo livre; só o admin
-- atribui a outra pessoa. auth.uid() nulo = SQL Editor ou função do site.
create or replace function public.proteger_responsavel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.responsavel_id is null or (auth.uid() is not null and not public.is_admin_user()) then
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
    if auth.uid() is not null and not public.is_admin_user()
      and not (old.responsavel_id is null and new.responsavel_id = auth.uid()) then
      raise exception 'CONFLITO: Só o administrador pode atribuir a outro responsável.';
    end if;
  end if;

  if new.responsavel_id is not null
    and not exists (select 1 from public.profiles where id = new.responsavel_id and ativo) then
    raise exception 'CONFLITO: O responsável tem de ser uma conta com acesso ativo.';
  end if;

  return new;
end;
$$;

drop trigger if exists proteger_responsavel on public.leads;
create trigger proteger_responsavel
  before insert or update on public.leads
  for each row execute function public.proteger_responsavel();

drop trigger if exists proteger_responsavel on public.clientes;
create trigger proteger_responsavel
  before insert or update on public.clientes
  for each row execute function public.proteger_responsavel();

-- A RLS de profiles só mostra a própria conta a quem não é admin; isto dá a
-- todos os nomes da equipa, sem emails, para mostrar e escolher responsáveis.
create or replace function public.listar_equipa()
returns table (id uuid, nome text, ativo boolean)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.nome, p.ativo from public.profiles p
  where public.is_active_user()
  order by p.nome;
$$;

revoke all on function public.listar_equipa() from public;
grant execute on function public.listar_equipa() to authenticated;

-- ============================================================
-- 3. Histórico de acessos: quem deu/retirou acesso ou admin a quem.
-- ============================================================
create table if not exists public.eventos_acesso (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid references public.profiles(id) on delete set null,
  perfil_nome text not null,
  alteracao text not null constraint eventos_acesso_alteracao_check
    check (alteracao in ('acesso_dado', 'acesso_retirado', 'tornado_admin', 'tornado_mediador', 'nome_alterado', 'convidado', 'excluido')),
  realizado_por uuid references public.profiles(id) on delete set null,
  realizado_por_nome text,
  nome_anterior text,
  criado_em timestamptz not null default now()
);

alter table public.eventos_acesso enable row level security;

-- Sem políticas de escrita: só o trigger (security definer) grava.
drop policy if exists "eventos_acesso_ler_admin" on public.eventos_acesso;
create policy "eventos_acesso_ler_admin" on public.eventos_acesso
  for select using (public.is_admin_user());

create index if not exists idx_eventos_acesso_criado_em on public.eventos_acesso(criado_em desc);

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
  return new;
end;
$$;

drop trigger if exists auditar_acesso on public.profiles;
create trigger auditar_acesso
  after update on public.profiles
  for each row execute function public.auditar_acesso();

-- ============================================================
-- converter_lead: cria o cliente, passa-lhe propostas e atividades do lead
-- e marca o lead como convertido, tudo na mesma transação. security invoker:
-- a RLS e o trigger de responsável aplicam-se a quem chama.
-- ============================================================
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
security invoker
set search_path = public
as $$
declare
  v_lead public.leads;
  v_cliente public.clientes;
begin
  if not public.is_active_user() then
    raise exception 'Sem permissão.';
  end if;

  select * into v_lead from public.leads where id = p_lead_id for update;
  if not found then
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

-- ============================================================
-- Excluir contas (api/utilizadores.js): nunca o último admin ativo.
-- ============================================================
-- A API apaga a conta em auth.users e o perfil vai em cascata; este trigger corre
-- nessa cascata e cancela tudo se fosse o último admin ativo.
create or replace function public.proteger_ultimo_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.is_admin and old.ativo then
    perform pg_advisory_xact_lock(hashtext('bv_profiles_admins'));
    if not exists (select 1 from public.profiles where is_admin and ativo and id <> old.id) then
      raise exception 'CONFLITO: Tem de existir pelo menos um administrador ativo.';
    end if;
  end if;
  return old;
end;
$$;

drop trigger if exists proteger_ultimo_admin on public.profiles;
create trigger proteger_ultimo_admin
  before delete on public.profiles
  for each row execute function public.proteger_ultimo_admin();

-- (de migrations/2026-09-25_importacao.sql)
create or replace function public.importar_clientes(p_linhas jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_linha record;
  v_responsavel uuid;
  v_inseridos int := 0;
  v_ignorados jsonb := '[]'::jsonb;
begin
  if not public.is_admin_user() then
    raise exception 'CONFLITO: Só o administrador pode importar dados.';
  end if;
  if jsonb_array_length(p_linhas) > 500 then
    raise exception 'CONFLITO: Envie no máximo 500 linhas de cada vez.';
  end if;

  for v_linha in select value as l, (ordinality - 1)::int as indice from jsonb_array_elements(p_linhas) with ordinality loop
    begin
      if nullif(v_linha.l->>'nif', '') is not null
        and exists (select 1 from public.clientes where nif = v_linha.l->>'nif') then
        v_ignorados := v_ignorados || jsonb_build_object('indice', v_linha.indice, 'motivo', 'Já existe um cliente com este NIF.');
        continue;
      end if;

      -- Sem responsável válido, o trigger proteger_responsavel atribui a quem importa.
      select id into v_responsavel from public.profiles
        where lower(email) = lower(v_linha.l->>'responsavel_email') and ativo;

      insert into public.clientes (nome, telefone, email, nif, morada, responsavel_id)
      values (
        btrim(v_linha.l->>'nome'),
        btrim(v_linha.l->>'telefone'),
        nullif(btrim(coalesce(v_linha.l->>'email', '')), ''),
        nullif(btrim(coalesce(v_linha.l->>'nif', '')), ''),
        nullif(btrim(coalesce(v_linha.l->>'morada', '')), ''),
        v_responsavel
      );
      v_inseridos := v_inseridos + 1;
    exception when others then
      v_ignorados := v_ignorados || jsonb_build_object('indice', v_linha.indice, 'motivo', sqlerrm);
    end;
  end loop;

  return jsonb_build_object('inseridos', v_inseridos, 'ignorados', v_ignorados);
end;
$$;

create or replace function public.importar_apolices(p_linhas jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_linha record;
  v_cliente uuid;
  v_inseridos int := 0;
  v_ignorados jsonb := '[]'::jsonb;
begin
  if not public.is_admin_user() then
    raise exception 'CONFLITO: Só o administrador pode importar dados.';
  end if;
  if jsonb_array_length(p_linhas) > 500 then
    raise exception 'CONFLITO: Envie no máximo 500 linhas de cada vez.';
  end if;

  for v_linha in select value as l, (ordinality - 1)::int as indice from jsonb_array_elements(p_linhas) with ordinality loop
    begin
      select id into v_cliente from public.clientes where nif = v_linha.l->>'nif_cliente';
      if v_cliente is null then
        v_ignorados := v_ignorados || jsonb_build_object('indice', v_linha.indice,
          'motivo', 'Não existe nenhum cliente com o NIF ' || coalesce(v_linha.l->>'nif_cliente', '') || '. Importe primeiro os clientes.');
        continue;
      end if;
      if exists (select 1 from public.apolices where numero_apolice = v_linha.l->>'numero_apolice') then
        v_ignorados := v_ignorados || jsonb_build_object('indice', v_linha.indice, 'motivo', 'Já existe uma apólice com este número.');
        continue;
      end if;

      insert into public.apolices (cliente_id, numero_apolice, ramo, seguradora, premio_anual, data_inicio, data_fim, estado)
      values (
        v_cliente,
        btrim(v_linha.l->>'numero_apolice'),
        v_linha.l->>'ramo',
        btrim(v_linha.l->>'seguradora'),
        (v_linha.l->>'premio_anual')::numeric,
        (v_linha.l->>'data_inicio')::date,
        nullif(v_linha.l->>'data_fim', '')::date,
        coalesce(nullif(v_linha.l->>'estado', ''), 'ativa')
      );
      v_inseridos := v_inseridos + 1;
    exception when others then
      v_ignorados := v_ignorados || jsonb_build_object('indice', v_linha.indice, 'motivo', sqlerrm);
    end;
  end loop;

  return jsonb_build_object('inseridos', v_inseridos, 'ignorados', v_ignorados);
end;
$$;

revoke all on function public.importar_clientes(jsonb), public.importar_apolices(jsonb) from public;
grant execute on function public.importar_clientes(jsonb), public.importar_apolices(jsonb) to authenticated;

-- (de migrations/2026-09-25_aviso_leads.sql)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'leads'
    ) then
    alter publication supabase_realtime add table public.leads;
  end if;
end $$;

-- O contador pergunta muitas vezes por estes leads; o índice evita ler a tabela toda.
create index if not exists idx_leads_site_por_tratar on public.leads (criado_em)
  where origem = 'site' and estado = 'novo' and responsavel_id is null;

-- (de migrations/2026-09-25_historico.sql)
create table if not exists public.historico_registos (
  id uuid primary key default gen_random_uuid(),
  tabela text not null,
  registo_id uuid not null,
  -- Sem chave estrangeira de propósito: o histórico sobrevive ao registo apagado.
  cliente_id uuid,
  acao text not null check (acao in ('criado', 'alterado', 'apagado')),
  -- Nome/nº do registo, para continuar legível depois de apagado.
  resumo text,
  -- Só em "alterado": { campo: { antes, depois } }.
  alteracoes jsonb,
  autor_id uuid references public.profiles(id) on delete set null,
  autor_nome text,
  criado_em timestamptz not null default now()
);

alter table public.historico_registos enable row level security;

-- Carteira partilhada: quem vê os registos vê o histórico deles. Sem políticas de
-- escrita: só o trigger (security definer) grava, e ninguém edita nem apaga entradas.
drop policy if exists "historico_ler" on public.historico_registos;
create policy "historico_ler" on public.historico_registos
  for select using (public.is_active_user());

create index if not exists idx_historico_cliente on public.historico_registos (cliente_id, criado_em desc);
create index if not exists idx_historico_registo on public.historico_registos (tabela, registo_id, criado_em desc);

create or replace function public.registar_historico()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_novo jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  v_antigo jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  v_registo jsonb;
  v_alteracoes jsonb := '{}'::jsonb;
  v_campo text;
  v_apolice uuid;
begin
  v_registo := coalesce(v_novo, v_antigo);

  if tg_op = 'UPDATE' then
    for v_campo in select jsonb_object_keys(v_novo) loop
      -- Carimbos de data não dizem nada a quem lê o histórico.
      continue when v_campo in ('atualizado_em', 'criado_em');
      if v_novo -> v_campo is distinct from v_antigo -> v_campo then
        v_alteracoes := v_alteracoes || jsonb_build_object(v_campo, jsonb_build_object('antes', v_antigo -> v_campo, 'depois', v_novo -> v_campo));
      end if;
    end loop;
    if v_alteracoes = '{}'::jsonb then
      return new;
    end if;
  end if;

  if tg_table_name in ('sinistros', 'renovacoes') then
    v_apolice := (v_registo ->> 'apolice_id')::uuid;
  end if;

  insert into public.historico_registos (tabela, registo_id, cliente_id, acao, resumo, alteracoes, autor_id, autor_nome)
  values (
    tg_table_name,
    (v_registo ->> 'id')::uuid,
    case tg_table_name
      when 'clientes' then (v_registo ->> 'id')::uuid
      when 'apolices' then (v_registo ->> 'cliente_id')::uuid
      when 'propostas' then (v_registo ->> 'cliente_id')::uuid
      else (select a.cliente_id from public.apolices a where a.id = v_apolice)
    end,
    case tg_op when 'INSERT' then 'criado' when 'UPDATE' then 'alterado' else 'apagado' end,
    case tg_table_name
      when 'apolices' then v_registo ->> 'numero_apolice'
      when 'propostas' then v_registo ->> 'seguradora'
      when 'sinistros' then v_registo ->> 'descricao'
      when 'renovacoes' then (select a.numero_apolice from public.apolices a where a.id = v_apolice)
      else v_registo ->> 'nome'
    end,
    case when tg_op = 'UPDATE' then v_alteracoes end,
    auth.uid(),
    (select p.nome from public.profiles p where p.id = auth.uid())
  );

  return coalesce(new, old);
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['leads', 'clientes', 'apolices', 'propostas', 'sinistros', 'renovacoes'] loop
    execute format('drop trigger if exists registar_historico on public.%I', t);
    execute format('create trigger registar_historico after insert or update or delete on public.%I for each row execute function public.registar_historico()', t);
  end loop;
end $$;

-- (de migrations/2026-09-25_seguradoras.sql)
create table if not exists public.seguradoras (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(btrim(nome)) between 2 and 120),
  ativa boolean not null default true,
  criado_em timestamptz not null default now()
);

create unique index if not exists seguradoras_nome_unico on public.seguradoras (lower(btrim(nome)));

alter table public.seguradoras enable row level security;

drop policy if exists "seguradoras_ler" on public.seguradoras;
create policy "seguradoras_ler" on public.seguradoras for select using (public.is_active_user());
drop policy if exists "seguradoras_criar" on public.seguradoras;
create policy "seguradoras_criar" on public.seguradoras for insert with check (public.is_admin_user());
drop policy if exists "seguradoras_editar" on public.seguradoras;
create policy "seguradoras_editar" on public.seguradoras for update using (public.is_admin_user()) with check (public.is_admin_user());

-- Só os nomes que já estão nos dados: não se inventa nenhuma seguradora.
insert into public.seguradoras (nome)
select distinct on (lower(btrim(s))) btrim(s)
from (select seguradora as s from public.apolices union all select seguradora from public.propostas) x
where char_length(btrim(coalesce(s, ''))) >= 2
order by lower(btrim(s)), btrim(s)
on conflict (lower(btrim(nome))) do nothing;

-- Nome oficial em vez de variações de maiúsculas/espaços; nome novo entra na lista.
create or replace function public.normalizar_seguradora()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_oficial text;
begin
  new.seguradora := btrim(regexp_replace(new.seguradora, '\s+', ' ', 'g'));
  select nome into v_oficial from public.seguradoras where lower(btrim(nome)) = lower(new.seguradora);
  if v_oficial is null then
    -- Um nome curto demais para a lista não pode impedir de gravar a apólice.
    if char_length(new.seguradora) >= 2 then
      insert into public.seguradoras (nome) values (new.seguradora) on conflict (lower(btrim(nome))) do nothing;
    end if;
  else
    new.seguradora := v_oficial;
  end if;
  return new;
end;
$$;

drop trigger if exists normalizar_seguradora on public.apolices;
create trigger normalizar_seguradora before insert or update of seguradora on public.apolices
  for each row execute function public.normalizar_seguradora();
drop trigger if exists normalizar_seguradora on public.propostas;
create trigger normalizar_seguradora before insert or update of seguradora on public.propostas
  for each row execute function public.normalizar_seguradora();

-- Renomear passa o nome novo às apólices e propostas. Se o nome novo já existir,
-- é juntar duplicados: tudo passa para a existente e esta desaparece da lista.
create or replace function public.renomear_seguradora(p_id uuid, p_nome text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_antigo text;
  v_nome text := btrim(regexp_replace(coalesce(p_nome, ''), '\s+', ' ', 'g'));
  v_destino uuid;
begin
  if not public.is_admin_user() then
    raise exception 'CONFLITO: Só o administrador pode gerir seguradoras.';
  end if;
  if char_length(v_nome) < 2 then
    raise exception 'CONFLITO: O nome deve ter pelo menos 2 caracteres.';
  end if;
  select nome into v_antigo from public.seguradoras where id = p_id for update;
  if v_antigo is null then
    raise exception 'CONFLITO: Esta seguradora já não existe. Atualize a página.';
  end if;

  select id into v_destino from public.seguradoras where lower(btrim(nome)) = lower(v_nome) and id <> p_id;
  if v_destino is not null then
    select nome into v_nome from public.seguradoras where id = v_destino;
    delete from public.seguradoras where id = p_id;
  else
    update public.seguradoras set nome = v_nome where id = p_id;
  end if;

  update public.apolices set seguradora = v_nome where lower(btrim(seguradora)) = lower(btrim(v_antigo));
  update public.propostas set seguradora = v_nome where lower(btrim(seguradora)) = lower(btrim(v_antigo));
end;
$$;

revoke all on function public.renomear_seguradora(uuid, text) from public;
grant execute on function public.renomear_seguradora(uuid, text) to authenticated;


-- (de migrations/2026-09-28_grupos_permissoes.sql)
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

-- (de migrations/2026-09-29_senha_inicial.sql)
-- Senha escolhida pelo admin (e partilhada por mensagem): no primeiro acesso o CRM pede uma nova.
alter table public.profiles add column if not exists deve_trocar_senha boolean not null default false;

-- A pessoa não edita o próprio perfil (RLS: só o admin); isto só desliga o aviso, depois de trocar a senha.
create or replace function public.senha_trocada()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles set deve_trocar_senha = false where id = auth.uid() and deve_trocar_senha;
$$;

revoke all on function public.senha_trocada() from public;
grant execute on function public.senha_trocada() to authenticated;

alter table public.eventos_acesso drop constraint if exists eventos_acesso_alteracao_check;
alter table public.eventos_acesso
  add constraint eventos_acesso_alteracao_check
  check (alteracao in ('acesso_dado', 'acesso_retirado', 'tornado_admin', 'tornado_mediador', 'nome_alterado', 'convidado', 'excluido', 'grupo_alterado', 'conta_criada', 'senha_definida'));

-- Supabase serve a API a partir de uma cache do desenho da base.
-- Sem isto, colunas/tabelas novas podem devolver "column not found" até a cache recarregar.
notify pgrst, 'reload schema';
