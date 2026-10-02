-- BV Seguros · CRM: quem abriu o link do convite mas nunca definiu senha não entra no CRM.
-- Correr uma vez no SQL Editor do Supabase, depois de 2026-09-30_formularios_site.sql.
-- O schema.sql já inclui isto para projetos novos.
begin;

-- Até 01/10, abrir o link do convite iniciava sessão sem pedir senha e a conta ficava
-- dada como aceite. Só o Auth sabe se há senha: esta função diz quem não tem, para a
-- função da Vercel /api/utilizadores (convite pendente, reenviar). Só a service role.
create or replace function public.contas_sem_senha()
returns setof uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select u.id from auth.users u
  where u.invited_at is not null and coalesce(u.encrypted_password, '') = '';
$$;

revoke all on function public.contas_sem_senha() from public, anon, authenticated;
grant execute on function public.contas_sem_senha() to service_role;

-- Convites já enviados: no próximo acesso o CRM pede a senha antes de mostrar o resto.
update public.profiles set deve_trocar_senha = true
where id in (select public.contas_sem_senha()) and not deve_trocar_senha;

commit;

notify pgrst, 'reload schema';
