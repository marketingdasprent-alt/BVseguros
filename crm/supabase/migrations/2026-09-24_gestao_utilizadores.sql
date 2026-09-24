-- BV Seguros · CRM: regras de integridade para o ecrã de gestão de utilizadores.
-- Correr uma vez no SQL Editor do Supabase (projeto já criado com schema.sql).
-- O schema.sql já inclui estas alterações para projetos novos.

-- ============================================================
-- proteger_profiles: o admin só gere acesso (ativo/is_admin).
-- id e email vêm do auth.users e não se editam aqui; e nunca se
-- pode ficar sem nenhum admin ativo (ninguém conseguiria ativar contas).
-- ============================================================
create or replace function public.proteger_profiles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.id <> old.id or new.email <> old.email then
    raise exception 'CONFLITO: O id e o email da conta não podem ser alterados aqui.';
  end if;

  if old.is_admin and old.ativo and not (new.is_admin and new.ativo)
    and not exists (
      select 1 from public.profiles
      where is_admin and ativo and id <> old.id
    ) then
    raise exception 'CONFLITO: Tem de existir pelo menos um administrador ativo.';
  end if;

  return new;
end;
$$;

drop trigger if exists proteger_profiles on public.profiles;
create trigger proteger_profiles
  before update on public.profiles
  for each row execute function public.proteger_profiles();

notify pgrst, 'reload schema';
