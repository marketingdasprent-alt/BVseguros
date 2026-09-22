# BV Seguros — Documento do Projecto

> **Estado:** scaffold inicial feito. Site institucional (raiz, sobre o Web
> Blueprint) e CRM (`crm/`) têm ambos um esqueleto funcional, com conteúdo/dados
> ainda por confirmar com o cliente.

## 1. O que é a BV Seguros

Corretora de seguros — "**BV Seguros · Seguros e Soluções**". Logótipo em
[`brand/logo-bv-seguros.png`](brand/logo-bv-seguros.png): escudo azul-marinho
(`#184070`) com check e casa, comunicando protecção patrimonial/residencial. Fundo do
PNG é opaco (cinza-claro `#F7F7F7`, sem transparência): pedir ao cliente uma versão
com fundo transparente/SVG quando possível.

Ainda por confirmar com o cliente:

- Ramos de seguro que a corretora efectivamente vende (auto, vida, saúde,
  multirriscos habitação, acidentes de trabalho, ...)
- Morada, NIF, telefone e email oficiais (o site tem estes campos como placeholder,
  marcados `PorConfirmar` / `[por confirmar]`)
- Nome de domínio (o site assume `bvseguros.pt` como exemplo, não confirmado)
- Texto institucional real (história, missão, diferencial): o que está no site é
  genérico, escrito para não bloquear o desenvolvimento
- Seguradoras parceiras (para eventual integração ou apenas registo manual)

## 2. Estrutura do repositório

Um repositório, dois projectos independentes, cada um com o seu deploy Vercel:

```
BVseguros/
├── AGENTS.md, documento.md      ← governação (regras + visão geral)
├── brand/                        ← logótipo, fonte de verdade da marca
├── BLUEPRINT.md, MASTER-PROMPT.md,
│   DECISIONS.md, CHANGELOG.md,   ← governação herdada do Web Blueprint
│   docs/
├── src/, public/                  ← site institucional (React/Vite)
├── package.json, vite.config.ts, ...
└── crm/                            ← CRM — projecto Vite/React à parte
    ├── src/, public/, supabase/
    ├── package.json, vite.config.ts, ...
    ├── AGENTS.md                   ← regras específicas do CRM
    └── README.md
```

Até 2026-09-21 existiam duas versões do site (uma estática em HTML/CSS/JS puro, e
esta, sobre o Web Blueprint) lado a lado para comparação. O cliente escolheu ficar só
com a versão Web Blueprint; a versão estática foi removida (ver
[`DECISIONS.md`](DECISIONS.md), entrada de 2026-09-21, para o histórico completo).

### Site institucional (raiz)

React + TypeScript + Vite + Tailwind CSS v4, construído sobre o
[Web Blueprint](BLUEPRINT.md): design tokens, `Container`/`Section`, componentes com
contrato de estados (`Button`, `Card`, `Input`, `Header`, `Footer`), CookieConsent +
Google Consent Mode v2, e páginas legais RGPD (`/privacy`, `/terms`, `/cookies`). Ver
[`AGENTS.md`](AGENTS.md) para a ordem de leitura da documentação antes de mexer.
Porta de dev: **5190**.

Conteúdo actual é placeholder (ver secção 1): página única com secções Sobre,
Seguros, Porquê a BV, Contacto (formulário via `mailto:`).

### CRM (`crm/`)

React 18 + TypeScript + Vite + Tailwind + Supabase + React Router. Ver
[`crm/README.md`](crm/README.md) para correr localmente e configurar o Supabase, e
[`crm/AGENTS.md`](crm/AGENTS.md) para as convenções de arquitectura. Porta de dev:
**5183**.

Funcionalidades já implementadas (scaffold, sem dados reais):

- Auth com Supabase (login, perfil `ativo`/`is_admin`)
- Leads: pipeline Kanban com drag-and-drop
- Clientes e Apólices: listagem + criação
- Dashboard com KPIs básicos
- `crm/supabase/schema.sql`: tabelas + RLS desde a primeira migration

## 3. Stack tecnológico

| Projecto | Stack | Porquê |
| --- | --- | --- |
| Site (raiz) | React + TypeScript + Vite + Tailwind CSS v4, sobre o Web Blueprint | Design system com tokens, componentes com estados reais e RGPD (CookieConsent, páginas legais) já resolvidos |
| CRM (`crm/`) | React 18 + TypeScript + Vite + Tailwind + Supabase + React Router | Mesmo padrão do `razao-dinamica/crm` |

**Não** inclui TanStack Query nem Capacitor no CRM: esses vêm de um exemplo de
`agents.md` de outro projecto (WeGest), com stack diferente. Ver
[`crm/AGENTS.md`](crm/AGENTS.md) secção 0.

## 4. Por decidir antes de dar conteúdo final

- [ ] Ramos de seguro e vocabulário de domínio definitivos (ver `crm/AGENTS.md`
      secção 3)
- [ ] Morada, telefone, email, NIF reais da BV Seguros
- [ ] Nome de domínio definitivo
- [ ] Texto institucional real (sobre, diferenciais)
- [ ] Se há integração WhatsApp no CRM desde já ou fica para fase 2
- [ ] Perfis de utilizador e permissões no CRM (admin, mediador, ...)
- [ ] Projecto Supabase real a ligar (o CRM só foi testado com credenciais placeholder)

## 5. Próximos passos

1. Preencher os placeholders do site (contactos, morada, texto institucional).
2. Criar o projecto Supabase real e correr `crm/supabase/schema.sql`.
3. Configurar dois projectos Vercel (site: Root Directory `.`; CRM: Root Directory
   `crm`) e o domínio.

---

_Última actualização: 2026-09-21._
