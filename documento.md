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
- Propostas, Clientes, Apólices, Renovações, Sinistros e Actividades
- Utilizadores (só admins): dar/retirar acesso e tornar administrador/mediador
- RLS em todas as tabelas desde a primeira migration

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
- [ ] Perfis e permissões no CRM (o mediador vê só a sua carteira ou tudo?)
- [ ] Integração WhatsApp no CRM agora ou na fase 2
- [ ] Seguradoras parceiras (integração ou só registo manual)

## 6. Próximos passos

1. Ligar o projecto `bvseguros-crm` ao GitHub na Vercel e criar o projecto do site.
2. Correr `crm/supabase/migrations/2026-09-24_gestao_utilizadores.sql` no Supabase
   (protege o ecrã **Utilizadores** do CRM: nunca ficar sem admin ativo). Convidar
   contas directamente pelo CRM fica para depois (precisa de função serverless com a
   service-role key); por agora convida-se no painel do Supabase.
3. Preencher os placeholders do site assim que o cliente enviar os dados.

---

_Última actualização: 2026-09-24._
