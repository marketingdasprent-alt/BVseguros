-- BV Seguros · CRM: histórico de alterações dos registos (quem mudou o quê, quando).
-- Correr uma vez no SQL Editor do Supabase, depois de 2026-09-25_aviso_leads.sql.
-- O schema.sql já inclui isto para projetos novos.
begin;

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

commit;

notify pgrst, 'reload schema';
