-- BV Seguros · CRM: seguradoras como lista (antes era texto livre: "Fidelidade",
-- "fidelidade" e "Fidelidade Seguros" contavam como três).
-- Correr uma vez no SQL Editor do Supabase, depois de 2026-09-25_historico.sql.
-- O schema.sql já inclui isto para projetos novos.
--
-- As colunas apolices.seguradora e propostas.seguradora continuam a ser texto (menos
-- risco nesta fase); um trigger põe-lhes o nome oficial da lista e acrescenta à lista
-- os nomes novos. O admin renomeia, junta duplicados e desativa em "Seguradoras".
begin;

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

commit;

notify pgrst, 'reload schema';
