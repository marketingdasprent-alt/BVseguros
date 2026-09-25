-- BV Seguros · CRM: importação da carteira por CSV (página Importar, só admin).
-- Correr uma vez no SQL Editor do Supabase, depois de 2026-09-25_textos_conversao.sql.
-- O schema.sql já inclui estas funções para projetos novos.
--
-- O browser valida e envia lotes de linhas já limpas; estas funções voltam a validar o
-- essencial (RLS + constraints) e gravam linha a linha: uma linha com problema fica em
-- "ignorados" com o motivo e não impede as outras. security invoker: aplica-se a RLS
-- de quem chama e o trigger de responsável.
begin;

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

commit;

notify pgrst, 'reload schema';
