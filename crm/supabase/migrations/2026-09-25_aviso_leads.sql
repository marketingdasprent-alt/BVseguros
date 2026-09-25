-- BV Seguros · CRM: aviso de leads novos vindos do site.
-- Correr uma vez no SQL Editor do Supabase, depois de 2026-09-25_importacao.sql.
-- O schema.sql já inclui isto para projetos novos.
--
-- Liga o Realtime à tabela leads, para o contador do menu "Leads" atualizar sozinho.
-- O Realtime respeita a RLS: só recebe alterações quem tem acesso aos leads.
-- (O email aos admins é configurado à parte: Database Webhook → api/aviso-lead.js.)
begin;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'leads'
    ) then
    alter publication supabase_realtime add table public.leads;
  end if;
end $$;

-- O contador pergunta muitas vezes por estes leads; o índice evita ler a tabela toda.
create index if not exists idx_leads_site_por_tratar on public.leads (criado_em)
  where origem = 'site' and estado = 'novo' and responsavel_id is null;

commit;
