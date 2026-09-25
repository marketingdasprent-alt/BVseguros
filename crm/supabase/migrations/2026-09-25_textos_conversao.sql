-- BV Seguros · CRM: mensagens da conversão de leads na forma de cortesia (você), como o resto do CRM.
-- Correr uma vez no SQL Editor do Supabase. Só troca textos; a lógica de converter_lead não muda.
-- O schema.sql já inclui esta versão para projetos novos.
begin;

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

commit;

notify pgrst, 'reload schema';
