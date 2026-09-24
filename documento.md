# BV Seguros: Documento do Projecto

> **Estado (2026-09-24):** site institucional completo em estrutura, com conteúdo
> ainda por confirmar com o cliente. CRM funcional com todos os módulos principais,
> ligado ao Supabase real e publicado na Vercel. O formulário de contacto do site já
> cria leads no CRM.

## 1. O que é a BV Seguros

Corretora de seguros: "**BV Seguros · Seguros e Soluções**". Logótipo original em
[`brand/logo-bv-seguros.png`](brand/logo-bv-seguros.png): escudo azul-marinho
(`#184070`) com check e casa, comunicando protecção patrimonial/residencial. O PNG
original tem fundo opaco; as versões com fundo transparente em uso estão em
`public/images/logo-icon-bv-seguros.png` (site) e `crm/public/brand/logo-icon.png` /
`logo-icon-branco.png` (CRM, esta última para fundos escuros). Continua a valer a pena
pedir ao cliente o logótipo em SVG.

## 2. Estrutura do repositório

Um repositório, dois projectos independentes, cada um com o seu deploy Vercel:

```
BVseguros/
├── AGENTS.md, documento.md      ← governação (regras + visão geral)
├── brand/                        ← logótipo, fonte de verdade da marca
├── BLUEPRINT.md, MASTER-PROMPT.md,
│   DECISIONS.md, CHANGELOG.md,   ← governação herdada do Web Blueprint
│   docs/
├── src/, public/, vercel.json    ← site institucional (React/Vite)
└── crm/                          ← CRM, projecto Vite/React à parte
    ├── src/, public/, vercel.json
    ├── supabase/schema.sql       ← schema completo (projecto novo)
    ├── supabase/migrations/      ← alterações a aplicar a um projecto já existente
    ├── AGENTS.md                 ← regras específicas do CRM
    └── README.md
```

### Site institucional (raiz)

React + TypeScript + Vite + Tailwind CSS v4, sobre o [Web Blueprint](BLUEPRINT.md).
Porta de dev: **5190**. Ver [`AGENTS.md`](AGENTS.md) para a ordem de leitura da
documentação antes de mexer.

Já implementado:

- Página única com Hero, Porquê a BV, Sobre, Seguros (ramos), Como funciona e Contacto
- Páginas legais RGPD (`/privacy`, `/terms`, `/cookies`) e página 404
- CookieConsent + Google Consent Mode v2, GA4 e Meta Pixel (com IDs placeholder)
- SEO, imagem de partilha para redes sociais e dados estruturados (JSON-LD)
- **Formulário de contacto ligado ao CRM**: grava na tabela `leads` do Supabase via a
  função pública `criar_lead_site` (validação, anti-spam, consentimento RGPD). Precisa
  de `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (ver `.env.example`).

### CRM (`crm/`)

React 18 + TypeScript + Vite + Tailwind + Supabase + React Router. Porta de dev:
**5183**. Ver [`crm/README.md`](crm/README.md) e [`crm/AGENTS.md`](crm/AGENTS.md).

Já implementado:

- Auth com Supabase (login, definir senha por convite/recuperação, perfil
  `ativo`/`is_admin`)
- Dashboard com KPIs, pipeline, prioridades e actividade recente
- Leads (Kanban com drag-and-drop; leads vindos do site com selo "Site" e mensagem)
- Propostas, Clientes, Apólices, Renovações, Sinistros e Actividades, todos com
  criar, editar e (só admin) apagar com confirmação
- Conversão de lead em cliente (uma transação: cria o cliente ligado ao lead, passa-lhe
  propostas e actividades, marca o lead como convertido)
- Utilizadores (só admins): convidar e excluir contas pelo CRM (`crm/api/utilizadores.js`),
  editar nome, dar/retirar acesso, tornar administrador/mediador e histórico de quem
  alterou o quê. Excluir não apaga dados: o que era da pessoa fica sem responsável.
- Responsável por lead e por cliente, com filtro "Os meus" / "Sem responsável"
- RLS em todas as tabelas desde a primeira migration

Permissões actuais (modelo da Razão Dinâmica, sem o isolamento por carteira):

| Acção | Mediador | Admin |
| --- | --- | --- |
| Ver e editar leads, clientes, apólices, etc. | Tudo (carteira partilhada) | Tudo |
| Apagar registos | Não | Sim |
| Converter lead em cliente | Sim | Sim |
| Convidar e excluir contas | Não | Sim |
| Assumir um lead/cliente sem responsável | Sim | Sim |
| Atribuir ou passar a outro responsável | Não | Sim |
| Gerir contas e ver o histórico de acessos | Não | Sim |

Quem cria um lead ou cliente fica responsável; o cliente herda o responsável do lead
de origem; os leads do site entram sem responsável. Se o cliente escolher carteiras
separadas, basta trocar as políticas `_ler`/`_editar` para filtrar por
`responsavel_id`: a coluna e as regras de atribuição já existem.

## 3. Stack tecnológico

| Projecto | Stack | Porquê |
| --- | --- | --- |
| Site (raiz) | React + TypeScript + Vite + Tailwind CSS v4, sobre o Web Blueprint | Design system com tokens, componentes com estados reais e RGPD (CookieConsent, páginas legais) já resolvidos |
| CRM (`crm/`) | React 18 + TypeScript + Vite + Tailwind + Supabase + React Router | Mesmo padrão do `razao-dinamica/crm` |

**Não** inclui TanStack Query nem Capacitor no CRM. Ver
[`crm/AGENTS.md`](crm/AGENTS.md) secção 0.

## 4. Deploy

| Projecto | Vercel | Estado |
| --- | --- | --- |
| CRM | `bvseguros-crm` (Root Directory `crm`) | Publicado em `bvseguros-crm.vercel.app`. **Não está ligado ao GitHub**: cada deploy é manual (`npx vercel --prod` dentro de `crm/`) até se ligar o repositório em Settings → Git. |
| Site | Ainda sem projecto nesta conta Vercel | Criar com Root Directory `.`, ligar ao GitHub e definir `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`. O `vercel.json` da raiz já trata do rewrite das rotas (`/privacy`, `/cookies`, ...). |

Supabase: o CRM e o formulário do site usam o mesmo projecto. Num projecto novo corre-se
`crm/supabase/schema.sql`; num projecto existente, as migrações de
`crm/supabase/migrations/` por ordem de data.

## 5. Por decidir / por confirmar com o cliente

- [ ] Morada, telefone, NIF, nº de registo na ASF e comarca reais (marcados
      `PorConfirmar` no site e nas páginas legais)
- [ ] Texto institucional real (sobre, diferenciais)
- [ ] Ramos de seguro definitivos e vocabulário de domínio (ver `crm/AGENTS.md`
      secção 3)
- [ ] Nome de domínio definitivo (o site assume `bvseguros.pt`)
- [ ] IDs reais de GA4 e Meta Pixel (`index.html`)
- [ ] Política de privacidade: indicar que os pedidos de contacto ficam guardados no CRM
      (Supabase, subcontratante)
- [ ] Carteira partilhada ou própria (o mediador vê só os seus clientes ou tudo?),
      ações só para admin (apagar, cancelar, mexer em valores) e quem trata os
      pedidos do site. Ver a tabela de permissões na secção 2.
- [ ] Integração WhatsApp no CRM agora ou na fase 2
- [ ] Seguradoras parceiras (integração ou só registo manual)

## 6. Próximos passos

1. Ligar o projecto `bvseguros-crm` ao GitHub na Vercel e criar o projecto do site.
2. Correr `crm/supabase/migrations/2026-09-24_excluir_utilizador.sql` no Supabase (as
   anteriores já foram aplicadas) e pôr `SUPABASE_SERVICE_ROLE_KEY` nas variáveis do
   projecto `bvseguros-crm` na Vercel, para convidar e excluir contas funcionarem.
3. Preencher os placeholders do site assim que o cliente enviar os dados.

---

_Última actualização: 2026-09-24._
