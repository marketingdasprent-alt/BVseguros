-- BV Seguros · CRM — schema inicial
-- Corre este ficheiro no SQL Editor do Supabase (projeto novo e vazio).
-- Convenções: ver AGENTS.md secção 11 (RLS desde a primeira migration).

-- ============================================================
-- profiles — um registo por utilizador interno (mediador/admin)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
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

  if old.is_admin and old.ativo and not (new.is_admin and new.ativo)
    and not exists (
      select 1 from public.profiles
      where is_admin and ativo and id <> old.id
    ) then
    raise exception 'CONFLITO: Tem de existir pelo menos um administrador ativo.';
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

create policy "leads_all_active_users" on public.leads
  for all using (public.is_active_user()) with check (public.is_active_user());

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

create policy "clientes_all_active_users" on public.clientes
  for all using (public.is_active_user()) with check (public.is_active_user());

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

create policy "apolices_all_active_users" on public.apolices
  for all using (public.is_active_user()) with check (public.is_active_user());

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

create policy "propostas_all_active_users" on public.propostas
  for all using (public.is_active_user()) with check (public.is_active_user());

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

create policy "renovacoes_all_active_users" on public.renovacoes
  for all using (public.is_active_user()) with check (public.is_active_user());

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

create policy "sinistros_all_active_users" on public.sinistros
  for all using (public.is_active_user()) with check (public.is_active_user());

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

create policy "atividades_all_active_users" on public.atividades
  for all using (public.is_active_user()) with check (public.is_active_user());

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

-- Supabase serve a API a partir de uma cache do desenho da base.
-- Sem isto, colunas/tabelas novas podem devolver "column not found" até a cache recarregar.
notify pgrst, 'reload schema';
