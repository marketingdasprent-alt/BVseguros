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

## Alterar a base de dados

Cada alteração vai numa migração nova em [`supabase/migrations/`](supabase/migrations/)
**e** no `schema.sql`. O cabeçalho de cada migração diz depois de qual corre
("depois de 2026-09-25_seguradoras.sql"); é essa a ordem, não a alfabética (há várias no
mesmo dia). Antes de correr no Supabase:

```bash
npm run test:db
```

Testa num Postgres local (PGlite), sem tocar no Supabase: projeto novo só com o
`schema.sql` e produção de 23/09 ([`supabase/tests/base-2026-09-23.sql`](supabase/tests/base-2026-09-23.sql))
com todas as migrações. Os dois têm de dar a mesma estrutura, e as regras de acesso
(site, conta inativa, mediador, admin) são verificadas em ambos.

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

Em **Administração → Importar** (só admin): escolher Clientes ou Apólices (primeiro os
clientes; as apólices ligam-se pelo NIF), descarregar o **modelo em Excel** e carregar o
ficheiro. Aceita `.xlsx`, CSV do Excel em PT (`;`, acentos, `dd/mm/aaaa`, `1.234,56`) e o
**PDF gerado a partir do modelo** (Excel → Guardar como PDF), lido no browser pela posição
do texto (`lib/tabelaPdf.ts`), sem IA; um PDF digitalizado ou de outro sistema não serve.
Linhas com problemas não entram e ficam num relatório em Excel.

## Dados pessoais (RGPD)

Só administradores. Precisa da migração `supabase/migrations/2026-10-06_rgpd.sql`.

- **Ficha do cliente → Dados pessoais (RGPD) → Exportar dados:** descarrega um Excel (uma
  folha por tipo de registo) e um JSON com tudo o que o CRM tem sobre a pessoa, para
  responder a um pedido de acesso. Fica registado no histórico.
- **Anonimizar:** para um pedido de apagamento. Pede o nome escrito por extenso; apaga os
  dados pessoais do cliente, do lead de origem, dos pedidos de sinistro do site, do texto
  livre e do histórico, e mantém apólices e valores para estatística. Irreversível.
- **Administração → Revisão de dados:** leads perdidos, pedidos do site sem resposta e
  pedidos de sinistro arquivados há mais do que o prazo (`PRAZO_REVISAO_MESES` em
  `src/lib/rgpd.ts`, 12 meses por agora). Nada é apagado sozinho.

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

## Emails de autenticação em PT

Os modelos estão em [`supabase/emails/`](supabase/emails/); o assunto está na primeira
linha de cada ficheiro. Em Supabase → Authentication → Emails → Templates, colar o
assunto e o HTML:

| Template no Supabase | Ficheiro |
| --- | --- |
| Invite user | `convite.html` |
| Reset password | `recuperar-senha.html` |
| Change email address | `alterar-email.html` |
| Confirm signup | `confirmar-registo.html` |

Antes, configurar o SMTP próprio (Authentication → Emails → SMTP Settings): o servidor
de email de origem do Supabase só envia uns poucos emails por hora.

Os links dos templates abrem `/acesso?token_hash=...&type=...` no CRM (Site URL da
Supabase = endereço do CRM). Abrir o link não gasta o token nem inicia sessão: isso
só acontece quando a pessoa define a senha (ou confirma o email), e a sessão de quem
já estava no browser não muda sem aviso. Não usar `{{ .ConfirmationURL }}`: inicia
sessão logo no clique.

## Por decidir

Ver [`../documento.md`](../documento.md) secção 4 — ramos de seguro definitivos,
integração WhatsApp, perfis/permissões e o projecto Supabase real a ligar.
