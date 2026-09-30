-- BV Seguros · CRM: formulários do site só pela função da Vercel do site, com limite por IP.
-- Corre depois de 2026-09-30_pedidos_sinistro.sql.
-- Antes: o site chamava criar_lead_site / criar_pedido_sinistro_site com a anon key, e o
-- único travão era um tecto global de 30 pedidos em 10 minutos (qualquer pessoa bloqueava
-- os pedidos reais com 30 falsos). Agora o site passa por /api/pedido (Turnstile + IP) e só
-- a service_role executa estas funções.
-- Ordem na publicação: variáveis na Vercel do site, esta migração, e logo a seguir o site.

-- O IP chega já cifrado (sha256 com segredo do servidor): o IP em claro nunca é guardado.
create table if not exists public.limites_pedidos_site (
  ip_hash text not null,
  tipo text not null constraint limites_pedidos_site_tipo_valido check (tipo in ('lead', 'sinistro')),
  criado_em timestamptz not null default now()
);
create index if not exists idx_limites_pedidos_site on public.limites_pedidos_site (ip_hash, tipo, criado_em);
alter table public.limites_pedidos_site enable row level security;
-- Sem políticas: só as funções do site (security definer) leem e escrevem.
revoke all on public.limites_pedidos_site from anon, authenticated;

create or replace function public.registar_pedido_site(p_tipo text, p_ip_hash text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(p_ip_hash, '') !~ '^[0-9a-f]{64}$' then
    raise exception 'dados_invalidos';
  end if;
  -- Guardar só um dia: chega para o limite por hora e não fica histórico de visitantes.
  delete from public.limites_pedidos_site where criado_em < now() - interval '1 day';
  if (select count(*) from public.limites_pedidos_site
        where ip_hash = p_ip_hash and tipo = p_tipo and criado_em > now() - interval '1 hour') >= 5 then
    raise exception 'limite_excedido';
  end if;
  insert into public.limites_pedidos_site (ip_hash, tipo) values (p_ip_hash, p_tipo);
end;
$$;

revoke all on function public.registar_pedido_site(text, text) from public, anon, authenticated, service_role;

drop function if exists public.criar_lead_site(text, text, text, text, text, boolean);
create or replace function public.criar_lead_site(
  p_nome text,
  p_email text,
  p_telefone text,
  p_ramo text,
  p_mensagem text,
  p_consentimento boolean,
  p_ip_hash text
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

  perform public.registar_pedido_site('lead', p_ip_hash);

  -- O limite por IP é a defesa principal; estes ficam para o caso de a função do site falhar.
  if (select count(*) from public.leads
        where origem = 'site' and criado_em > now() - interval '1 hour'
          and (lower(email) = v_email or telefone = v_telefone)) >= 3
    or (select count(*) from public.leads
        where origem = 'site' and criado_em > now() - interval '10 minutes') >= 200 then
    raise exception 'limite_excedido';
  end if;

  insert into public.leads (nome, email, telefone, ramo_interesse, estado, origem, mensagem, consentimento_em)
  values (v_nome, v_email, v_telefone, p_ramo, 'novo', 'site', v_mensagem, now());
end;
$$;

drop function if exists public.criar_pedido_sinistro_site(text, text, text, text, text, text, date, text, text, jsonb, boolean);
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
  p_consentimento boolean,
  p_ip_hash text
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

  if jsonb_typeof(v_detalhes) <> 'object'
    or octet_length(v_detalhes::text) > 4096
    or (select count(*) from jsonb_object_keys(v_detalhes)) > 15
    or exists (
      select 1 from jsonb_each(v_detalhes) e
      where e.key !~ '^[a-z_]{1,40}$' or jsonb_typeof(e.value) <> 'string' or char_length(e.value #>> '{}') > 200
    ) then
    raise exception 'dados_invalidos';
  end if;

  perform public.registar_pedido_site('sinistro', p_ip_hash);

  if (select count(*) from public.pedidos_sinistro
        where criado_em > now() - interval '1 hour'
          and (lower(email) = v_email or telefone = v_telefone)) >= 3
    or (select count(*) from public.pedidos_sinistro
        where criado_em > now() - interval '10 minutes') >= 200 then
    raise exception 'limite_excedido';
  end if;

  insert into public.pedidos_sinistro (
    nome, email, telefone, ramo, numero_apolice, seguradora, data_ocorrencia, local, descricao, detalhes, consentimento_em
  ) values (
    v_nome, v_email, v_telefone, p_ramo, v_apolice, v_seguradora, p_data_ocorrencia, v_local, v_descricao, v_detalhes, now()
  );
end;
$$;

-- Só a função do site (service_role) as chama: com a anon key ou uma sessão do CRM saltava-se o Turnstile.
revoke all on function public.criar_lead_site(text, text, text, text, text, boolean, text) from public, anon, authenticated;
revoke all on function public.criar_pedido_sinistro_site(text, text, text, text, text, text, date, text, text, jsonb, boolean, text) from public, anon, authenticated;
grant execute on function public.criar_lead_site(text, text, text, text, text, boolean, text) to service_role;
grant execute on function public.criar_pedido_sinistro_site(text, text, text, text, text, text, date, text, text, jsonb, boolean, text) to service_role;

notify pgrst, 'reload schema';
