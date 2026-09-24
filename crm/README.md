# BV Seguros — CRM

CRM interno da BV Seguros para gestão de leads, clientes e apólices. Ver
[`../documento.md`](../documento.md) para a visão geral do projeto e
[`AGENTS.md`](AGENTS.md) para as convenções de arquitectura (humanos e agentes IA).
Este é um dos dois projectos do repositório — ver [`../README.md`](../README.md) para
o site institucional.

Stack: React 18 + TypeScript + Vite + Tailwind CSS + Supabase + React Router.

## Correr localmente

Requer [Node.js](https://nodejs.org) 18+.

```bash
npm install
cp .env.example .env.local
```

Preenche `.env.local` com o URL e a anon key do projeto Supabase (Project Settings →
API). Depois:

```bash
npm run dev
```

Abre em <http://localhost:5183>.

## Configurar o Supabase (primeira vez)

1. Cria um projeto novo em [supabase.com](https://supabase.com).
2. No SQL Editor, corre o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) —
   cria as tabelas `profiles`, `leads`, `clientes`, `apolices`, RLS e um trigger que
   cria automaticamente um `profile` (inativo) quando alguém se regista.
3. Cria a primeira conta (via `supabase.auth.signUp` na app, ou em Authentication →
   Users no dashboard).
4. Essa conta nasce **inativa e sem ser admin** (por segurança — RLS bloqueia tudo até
   isto). No SQL Editor, torna-a admin e ativa-a:

   ```sql
   update public.profiles
   set is_admin = true, ativo = true
   where email = 'o-teu-email@bvseguros.pt';
   ```

5. A partir daí, as contas seguintes convidam-se em Authentication → Users → Invite
   user, e o admin dá-lhes acesso no ecrã **Utilizadores** do CRM (só visível para
   admins). A base de dados impede que se fique sem nenhum admin ativo.

## Publicar (Vercel)

Projecto Vercel próprio, separado do site institucional, com **Root Directory =
`crm`**. A partir daí:

```bash
vercel
```

Define as variáveis de ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) no
dashboard do Vercel → Project Settings → Environment Variables. O `vercel.json` já
define `"framework": "vite"`.

## Por decidir

Ver [`../documento.md`](../documento.md) secção 4 — ramos de seguro definitivos,
integração WhatsApp, perfis/permissões e o projecto Supabase real a ligar.
