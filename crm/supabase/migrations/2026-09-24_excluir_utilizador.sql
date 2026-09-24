-- BV Seguros · CRM: excluir contas no ecrã Utilizadores (api/utilizadores.js, DELETE).
-- Correr uma vez no SQL Editor do Supabase, depois de 2026-09-24_conversao_convites.sql.
-- O schema.sql já inclui estas alterações para projetos novos.
begin;

-- A API apaga a conta em auth.users e o perfil vai em cascata; este trigger corre
-- nessa cascata e cancela tudo se fosse o último admin ativo.
create or replace function public.proteger_ultimo_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.is_admin and old.ativo then
    perform pg_advisory_xact_lock(hashtext('bv_profiles_admins'));
    if not exists (select 1 from public.profiles where is_admin and ativo and id <> old.id) then
      raise exception 'CONFLITO: Tem de existir pelo menos um administrador ativo.';
    end if;
  end if;
  return old;
end;
$$;

drop trigger if exists proteger_ultimo_admin on public.profiles;
create trigger proteger_ultimo_admin
  before delete on public.profiles
  for each row execute function public.proteger_ultimo_admin();

alter table public.eventos_acesso drop constraint if exists eventos_acesso_alteracao_check;
alter table public.eventos_acesso
  add constraint eventos_acesso_alteracao_check
  check (alteracao in ('acesso_dado', 'acesso_retirado', 'tornado_admin', 'tornado_mediador', 'nome_alterado', 'convidado', 'excluido'));

commit;

notify pgrst, 'reload schema';
