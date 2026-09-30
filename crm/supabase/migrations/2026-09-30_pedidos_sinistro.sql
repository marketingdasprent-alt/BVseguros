-- BV Seguros · CRM: pedidos de sinistro feitos no formulário do site.
-- Correr uma vez no SQL Editor do Supabase, depois de 2026-09-29_senha_inicial.sql.
-- O schema.sql já inclui isto para projetos novos.
begin;

-- Um pedido de ajuda com um sinistro, vindo do site. Não é o sinistro: esse exige uma apólice,
-- que o visitante não sabe indicar. A equipa liga o pedido ao cliente/apólice e cria o sinistro.
create table if not exists public.pedidos_sinistro (
  id uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  nome text not null,
  email text not null,
  telefone text not null,
  ramo text not null
    constraint pedidos_sinistro_ramo_check check (ramo in ('auto', 'vida', 'saude', 'multirriscos', 'acidentes_trabalho', 'outro')),
  numero_apolice text,
  seguradora text,
  data_ocorrencia date not null,
  local text,
  descricao text not null,
  -- Respostas próprias do ramo (ex.: matrícula, tipo de dano): texto simples, chave -> valor.
  detalhes jsonb not null default '{}'::jsonb,
  consentimento_em timestamptz not null,
  estado text not null default 'novo'
    constraint pedidos_sinistro_estado_check check (estado in ('novo', 'em_tratamento', 'convertido', 'arquivado')),
  cliente_id uuid references public.clientes(id) on delete set null,
  sinistro_id uuid references public.sinistros(id) on delete set null,
  tratado_por uuid references public.profiles(id) on delete set null,
  notas text
);

create index if not exists idx_pedidos_sinistro_estado_criado_em on public.pedidos_sinistro(estado, criado_em desc);

create or replace function public.tocar_pedido_sinistro()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists tocar_pedido_sinistro on public.pedidos_sinistro;
create trigger tocar_pedido_sinistro before update on public.pedidos_sinistro
  for each row execute function public.tocar_pedido_sinistro();

-- Quem tem o módulo Sinistros vê e trata os pedidos (ainda não têm cliente, logo não há carteira).
-- Ninguém insere diretamente: o site usa criar_pedido_sinistro_site. Só o admin apaga
-- (por decisão do cliente, os pedidos ficam todos guardados).
alter table public.pedidos_sinistro enable row level security;

drop policy if exists "pedidos_sinistro_ler" on public.pedidos_sinistro;
drop policy if exists "pedidos_sinistro_editar" on public.pedidos_sinistro;
drop policy if exists "pedidos_sinistro_apagar" on public.pedidos_sinistro;
create policy "pedidos_sinistro_ler" on public.pedidos_sinistro for select
  using ((select public.pode('sinistros', 'ver')));
create policy "pedidos_sinistro_editar" on public.pedidos_sinistro for update
  using ((select public.pode('sinistros', 'editar')))
  with check ((select public.pode('sinistros', 'editar')));
create policy "pedidos_sinistro_apagar" on public.pedidos_sinistro for delete
  using ((select public.is_admin_user()));

revoke insert on public.pedidos_sinistro from anon, authenticated;

-- ============================================================
-- criar_pedido_sinistro_site: única porta de entrada pública, como criar_lead_site.
-- Valida tudo, aplica o anti-spam e força o estado.
-- ============================================================
create or replace function public.criar_pedido_sinistro_site(
  p_nome text,
  p_email text,
  p_telefone text,
  p_ramo text,
  p_numero_apolice text,
  p_seguradora text,
  p_data_ocorrencia date,
  p_local text,
  p_descricao text,
  p_detalhes jsonb,
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
  v_apolice text := nullif(btrim(coalesce(p_numero_apolice, '')), '');
  v_seguradora text := nullif(btrim(coalesce(p_seguradora, '')), '');
  v_local text := nullif(btrim(coalesce(p_local, '')), '');
  v_descricao text := btrim(coalesce(p_descricao, ''));
  v_detalhes jsonb := coalesce(p_detalhes, '{}'::jsonb);
begin
  if p_consentimento is not true then
    raise exception 'consentimento_em_falta';
  end if;

  if char_length(v_nome) < 2 or char_length(v_nome) > 120
    or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(v_email) > 254
    or v_telefone !~ '^\+?[0-9]{9,15}$'
    or p_ramo is null or p_ramo not in ('auto', 'vida', 'saude', 'multirriscos', 'acidentes_trabalho', 'outro')
    or char_length(coalesce(v_apolice, '')) > 60
    or char_length(coalesce(v_seguradora, '')) > 80
    or p_data_ocorrencia is null or p_data_ocorrencia > current_date or p_data_ocorrencia < current_date - 730
    or char_length(coalesce(v_local, '')) > 160
    or char_length(v_descricao) < 10 or char_length(v_descricao) > 1500 then
    raise exception 'dados_invalidos';
  end if;

  -- Detalhes do ramo: um objeto pequeno, só com texto (nada de listas ou objetos dentro).
  if jsonb_typeof(v_detalhes) <> 'object'
    or octet_length(v_detalhes::text) > 4096
    or (select count(*) from jsonb_object_keys(v_detalhes)) > 15
    or exists (
      select 1 from jsonb_each(v_detalhes) e
      where e.key !~ '^[a-z_]{1,40}$' or jsonb_typeof(e.value) <> 'string' or char_length(e.value #>> '{}') > 200
    ) then
    raise exception 'dados_invalidos';
  end if;

  -- Anti-spam igual ao dos leads: o mesmo contacto no máximo 3x/hora, e um teto global.
  if (select count(*) from public.pedidos_sinistro
        where criado_em > now() - interval '1 hour'
          and (lower(email) = v_email or telefone = v_telefone)) >= 3
    or (select count(*) from public.pedidos_sinistro
        where criado_em > now() - interval '10 minutes') >= 30 then
    raise exception 'limite_excedido';
  end if;

  insert into public.pedidos_sinistro (
    nome, email, telefone, ramo, numero_apolice, seguradora, data_ocorrencia, local, descricao, detalhes, consentimento_em
  ) values (
    v_nome, v_email, v_telefone, p_ramo, v_apolice, v_seguradora, p_data_ocorrencia, v_local, v_descricao, v_detalhes, now()
  );
end;
$$;

revoke all on function public.criar_pedido_sinistro_site(text, text, text, text, text, text, date, text, text, jsonb, boolean) from public;
grant execute on function public.criar_pedido_sinistro_site(text, text, text, text, text, text, date, text, text, jsonb, boolean) to anon, authenticated;

-- ============================================================
-- converter_pedido_sinistro: cria o sinistro na apólice escolhida e fecha o pedido,
-- numa só operação. Corre com os direitos de quem chama (RLS de sinistros e de pedidos).
-- ============================================================
create or replace function public.converter_pedido_sinistro(p_pedido uuid, p_apolice uuid, p_descricao text)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_pedido public.pedidos_sinistro;
  v_cliente uuid;
  v_sinistro uuid;
begin
  select * into v_pedido from public.pedidos_sinistro where id = p_pedido for update;
  if not found then raise exception 'CONFLITO: Este pedido já não existe.'; end if;
  if v_pedido.estado = 'convertido' then raise exception 'CONFLITO: Este pedido já foi convertido num sinistro.'; end if;

  select cliente_id into v_cliente from public.apolices where id = p_apolice;
  if v_cliente is null then raise exception 'CONFLITO: Apólice não encontrada.'; end if;

  insert into public.sinistros (apolice_id, data_ocorrencia, descricao, estado)
  values (p_apolice, v_pedido.data_ocorrencia, coalesce(nullif(btrim(p_descricao), ''), v_pedido.descricao), 'participado')
  returning id into v_sinistro;

  update public.pedidos_sinistro
  set estado = 'convertido', cliente_id = v_cliente, sinistro_id = v_sinistro, tratado_por = coalesce(tratado_por, auth.uid())
  where id = p_pedido;

  return v_sinistro;
end;
$$;

revoke all on function public.converter_pedido_sinistro(uuid, uuid, text) from public;
grant execute on function public.converter_pedido_sinistro(uuid, uuid, text) to authenticated;

-- O contador "Pedidos do site" no menu do CRM atualiza por Realtime, como o dos leads.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pedidos_sinistro'
    ) then
    alter publication supabase_realtime add table public.pedidos_sinistro;
  end if;
end $$;

commit;

notify pgrst, 'reload schema';
