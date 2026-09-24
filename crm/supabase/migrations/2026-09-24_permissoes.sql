-- BV Seguros · CRM: permissões que não dependem da decisão sobre carteiras.
-- Correr uma vez no SQL Editor do Supabase, depois de 2026-09-24_gestao_utilizadores.sql.
-- O schema.sql já inclui estas alterações para projetos novos.
-- Modelo seguido: razao-dinamica/crm (supabase-migration-permissoes.sql), sem o
-- isolamento por carteira, que fica à espera da decisão do cliente.
begin;

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
  alteracao text not null check (alteracao in ('acesso_dado', 'acesso_retirado', 'tornado_admin', 'tornado_mediador')),
  realizado_por uuid references public.profiles(id) on delete set null,
  realizado_por_nome text,
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
  return new;
end;
$$;

drop trigger if exists auditar_acesso on public.profiles;
create trigger auditar_acesso
  after update on public.profiles
  for each row execute function public.auditar_acesso();

-- ============================================================
-- 4. proteger_profiles com bloqueio: dois admins a despromover-se ao mesmo
-- tempo viam cada um o outro ainda ativo e ficavam os dois sem admin.
-- ============================================================
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

commit;

notify pgrst, 'reload schema';
