-- BV Seguros · CRM: o admin edita o nome das contas no ecrã Utilizadores.
-- Correr uma vez no SQL Editor do Supabase, depois de 2026-09-24_permissoes.sql.
-- O schema.sql já inclui estas alterações para projetos novos.
begin;

-- 254 e não 120: as contas convidadas nascem com o email como nome.
alter table public.profiles drop constraint if exists profiles_nome_valido;
alter table public.profiles
  add constraint profiles_nome_valido check (char_length(btrim(nome)) between 2 and 254);

alter table public.eventos_acesso add column if not exists nome_anterior text;
alter table public.eventos_acesso drop constraint if exists eventos_acesso_alteracao_check;
alter table public.eventos_acesso
  add constraint eventos_acesso_alteracao_check
  check (alteracao in ('acesso_dado', 'acesso_retirado', 'tornado_admin', 'tornado_mediador', 'nome_alterado'));

create or replace function public.auditar_acesso()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_autor text := (select nome from public.profiles where id = auth.uid());
begin
  if new.ativo is distinct from old.ativo then
    insert into public.eventos_acesso (perfil_id, perfil_nome, alteracao, realizado_por, realizado_por_nome)
    values (new.id, new.nome, case when new.ativo then 'acesso_dado' else 'acesso_retirado' end, auth.uid(), v_autor);
  end if;
  if new.is_admin is distinct from old.is_admin then
    insert into public.eventos_acesso (perfil_id, perfil_nome, alteracao, realizado_por, realizado_por_nome)
    values (new.id, new.nome, case when new.is_admin then 'tornado_admin' else 'tornado_mediador' end, auth.uid(), v_autor);
  end if;
  if new.nome is distinct from old.nome then
    insert into public.eventos_acesso (perfil_id, perfil_nome, alteracao, realizado_por, realizado_por_nome, nome_anterior)
    values (new.id, new.nome, 'nome_alterado', auth.uid(), v_autor, old.nome);
  end if;
  return new;
end;
$$;

commit;

notify pgrst, 'reload schema';
