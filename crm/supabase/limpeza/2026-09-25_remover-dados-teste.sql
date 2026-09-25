-- BV Seguros · CRM: remover os dados de teste da base de produção, antes da entrega.
-- Correr UMA vez no SQL Editor do Supabase. Não é uma migração (não vai para projetos novos).
--
-- Apaga só estes registos, por id (lidos da produção em 25/09/2026):
--   leads      "Maria Silva", "TESTE Integração Site"
--   cliente    "João Pereira" e, em cascata, as apólices AP-2026-001/002,
--              o sinistro "Choque na traseira" e a renovação da AP-2026-002
--   proposta   Ageas (do lead Maria Silva)
--   atividade  "Ligar para confirmar dados"
-- Não mexe em contas nem no histórico de acessos.
-- Pode correr-se mais do que uma vez: o que já tiver sido apagado é só ignorado.

-- 1) Ver primeiro o que vai ser apagado (opcional: correr só este bloco).
select 'lead' as tipo, id, nome as descricao from public.leads
  where id in ('0a307300-3929-443f-ad74-19228eadf431', '1889750c-4867-4258-9358-a2ab3d003b99')
union all select 'cliente', id, nome from public.clientes where id = '1dd78a9e-f675-4d2e-b098-5077af8f26bd'
union all select 'apólice', id, numero_apolice from public.apolices where cliente_id = '1dd78a9e-f675-4d2e-b098-5077af8f26bd'
union all select 'proposta', id, seguradora from public.propostas where id = '353df060-d664-4ea6-91f6-0088c93d22b0'
union all select 'atividade', id, titulo from public.atividades where id = '0a238be4-037a-4460-a914-0ddf26da0c97';

-- 2) Apagar.
begin;

do $$
declare n int;
begin
  delete from public.atividades where id = '0a238be4-037a-4460-a914-0ddf26da0c97';
  get diagnostics n = row_count;
  raise notice 'atividade apagados: % (de 1)', n;

  delete from public.propostas where id = '353df060-d664-4ea6-91f6-0088c93d22b0';
  get diagnostics n = row_count;
  raise notice 'proposta apagados: % (de 1)', n;

  -- Apólices, sinistros e renovações do cliente vão em cascata.
  delete from public.clientes where id = '1dd78a9e-f675-4d2e-b098-5077af8f26bd';
  get diagnostics n = row_count;
  raise notice 'cliente apagados: % (de 1)', n;

  delete from public.leads where id in ('0a307300-3929-443f-ad74-19228eadf431', '1889750c-4867-4258-9358-a2ab3d003b99');
  get diagnostics n = row_count;
  raise notice 'leads apagados: % (de 2)', n;
end $$;

commit;

-- 3) Confirmar: tudo a zero.
select
  (select count(*) from public.leads) as leads,
  (select count(*) from public.clientes) as clientes,
  (select count(*) from public.apolices) as apolices,
  (select count(*) from public.propostas) as propostas,
  (select count(*) from public.sinistros) as sinistros,
  (select count(*) from public.renovacoes) as renovacoes,
  (select count(*) from public.atividades) as atividades;
