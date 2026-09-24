-- BV Seguros · CRM: leads vindos do formulário do site institucional.
-- Correr uma vez no SQL Editor do Supabase (projeto já criado com schema.sql).
-- O schema.sql já inclui estas alterações para projetos novos.

alter table public.leads
  add column if not exists origem text not null default 'manual',
  add column if not exists mensagem text,
  add column if not exists consentimento_em timestamptz;

alter table public.leads drop constraint if exists leads_origem_valida;
alter table public.leads
  add constraint leads_origem_valida check (origem in ('manual', 'site'));

create index if not exists idx_leads_origem_criado_em on public.leads(origem, criado_em);

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

notify pgrst, 'reload schema';
