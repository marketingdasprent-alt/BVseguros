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
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.leads enable row level security;

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

-- Supabase serve a API a partir de uma cache do desenho da base.
-- Sem isto, colunas/tabelas novas podem devolver "column not found" até a cache recarregar.
notify pgrst, 'reload schema';
