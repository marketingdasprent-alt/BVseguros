-- BV Seguros · CRM: o admin pode criar contas já com senha (sem email) e definir a senha de uma conta.
-- Correr uma vez no SQL Editor do Supabase, depois de 2026-09-28_grupos_permissoes.sql.
-- O schema.sql já inclui isto para projetos novos.
begin;

-- Senha escolhida pelo admin (e partilhada por mensagem): no primeiro acesso o CRM pede uma nova.
alter table public.profiles add column if not exists deve_trocar_senha boolean not null default false;

-- A pessoa não edita o próprio perfil (RLS: só o admin); isto só desliga o aviso, depois de trocar a senha.
create or replace function public.senha_trocada()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles set deve_trocar_senha = false where id = auth.uid() and deve_trocar_senha;
$$;

revoke all on function public.senha_trocada() from public;
grant execute on function public.senha_trocada() to authenticated;

alter table public.eventos_acesso drop constraint if exists eventos_acesso_alteracao_check;
alter table public.eventos_acesso
  add constraint eventos_acesso_alteracao_check
  check (alteracao in ('acesso_dado', 'acesso_retirado', 'tornado_admin', 'tornado_mediador', 'nome_alterado', 'convidado', 'excluido', 'grupo_alterado', 'conta_criada', 'senha_definida'));

commit;

notify pgrst, 'reload schema';
