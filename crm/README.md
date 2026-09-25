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

5. A partir daí, o admin convida as contas seguintes no ecrã **Utilizadores** do CRM
   (botão "Convidar utilizador"), que passa pela função `api/utilizadores.js`. Precisa de
   `SUPABASE_SERVICE_ROLE_KEY` no `.env.local` (local) e nas variáveis da Vercel
   (produção). A base de dados impede que se fique sem nenhum admin ativo.

## Publicar (Vercel)

Projecto Vercel próprio, separado do site institucional, com **Root Directory =
`crm`**. A partir daí:

```bash
vercel
```

Define as variáveis de ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e,
para os convites, `SUPABASE_SERVICE_ROLE_KEY`) no dashboard do Vercel → Project
Settings → Environment Variables. A service-role key **nunca** leva prefixo `VITE_`:
só a função em `api/` a lê. O `vercel.json` define `"framework": "vite"` e deixa
`/api/*` fora do rewrite para o `index.html`. Em `npm run dev`, o mesmo handler corre
através de `server/local-api.js`.

## Importar a carteira

Em **Administração → Importar** (só admin): primeiro os clientes, depois as apólices
(ligam-se ao cliente pelo NIF). Cada ecrã tem "Descarregar modelo" com as colunas
certas. Aceita o CSV do Excel em PT (`;`, acentos, `dd/mm/aaaa`, `1.234,56`); para
`.xlsx`, guardar antes como **CSV UTF-8**. Linhas com problemas não entram e ficam num
relatório descarregável.

## Aviso por email de leads do site (opcional)

Sem isto, os pedidos do site já aparecem com contador no menu **Leads**. Para receber
também um email:

1. Conta [Brevo](https://www.brevo.com) com o remetente validado; na Vercel, definir
   `BREVO_API_KEY`, `BREVO_REMETENTE`, `CRM_SITE_URL` e `AVISO_LEAD_SEGREDO` (um texto
   longo inventado por si).
2. Supabase → Database → Webhooks → Create: tabela `public.leads`, evento **Insert**,
   tipo HTTP Request, `POST https://<endereço do CRM>/api/aviso-lead`, header
   `x-aviso-segredo: <o mesmo AVISO_LEAD_SEGREDO>`.
3. Enviar um pedido pelo site e confirmar em Webhooks → Logs que a resposta é 200.

## Por decidir

Ver [`../documento.md`](../documento.md) secção 4 — ramos de seguro definitivos,
integração WhatsApp, perfis/permissões e o projecto Supabase real a ligar.
