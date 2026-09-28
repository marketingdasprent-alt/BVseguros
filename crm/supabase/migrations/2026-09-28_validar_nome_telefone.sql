-- BV Seguros · CRM: nome e telefone de leads e clientes nunca vazios (antes bastava um nome só com espaços).
-- Correr uma vez no SQL Editor do Supabase, depois de 2026-09-25_seguradoras.sql.
-- O schema.sql já inclui isto para projetos novos.
-- Só comandos simples, sem bloco "do": o SQL Editor do Supabase partia esse bloco a meio.

-- 1. As regras passam a valer já para registos novos e editados (not valid = ainda não verifica os antigos).
begin;

alter table public.leads drop constraint if exists leads_nome_valido;
alter table public.leads drop constraint if exists leads_telefone_valido;
alter table public.clientes drop constraint if exists clientes_nome_valido;
alter table public.clientes drop constraint if exists clientes_telefone_valido;

alter table public.leads
  add constraint leads_nome_valido check (char_length(btrim(nome)) between 2 and 254) not valid,
  add constraint leads_telefone_valido check (char_length(btrim(telefone)) between 1 and 30) not valid;
alter table public.clientes
  add constraint clientes_nome_valido check (char_length(btrim(nome)) between 2 and 254) not valid,
  add constraint clientes_telefone_valido check (char_length(btrim(telefone)) between 1 and 30) not valid;

commit;

-- 2. Verificar os registos antigos. Se um destes falhar, os que não cumprem aparecem com:
--    select id, nome, telefone from public.leads where char_length(btrim(nome)) not between 2 and 254 or char_length(btrim(telefone)) not between 1 and 30
--    (o mesmo com public.clientes). Corrigi-los e correr de novo só estas quatro linhas. O passo 1 já fica aplicado.
alter table public.leads validate constraint leads_nome_valido;
alter table public.leads validate constraint leads_telefone_valido;
alter table public.clientes validate constraint clientes_nome_valido;
alter table public.clientes validate constraint clientes_telefone_valido;

notify pgrst, 'reload schema';
