# BV Seguros — Documento do Projecto

> **Estado:** scaffold inicial feito. Site institucional (raiz) e CRM (`crm/`) têm
> ambos um esqueleto funcional, com conteúdo/dados ainda por confirmar com o cliente.

## 1. O que é a BV Seguros

Corretora de seguros — "**BV Seguros · Seguros e Soluções**". Logótipo em
[`brand/logo-bv-seguros.png`](brand/logo-bv-seguros.png): escudo azul-marinho
(`#184070`) com check e casa, comunicando protecção patrimonial/residencial. Fundo do
PNG é opaco (cinza-claro `#F7F7F7`, sem transparência) — pedir ao cliente uma versão
com fundo transparente/SVG quando possível.

Ainda por confirmar com o cliente:

- Ramos de seguro que a corretora efectivamente vende (auto, vida, saúde,
  multirriscos habitação, acidentes de trabalho, ...)
- Morada, NIF, telefone e email oficiais (o site tem estes campos como placeholder,
  marcados `[por preencher]`)
- Nome de domínio (o site assume `bvseguros.pt` como exemplo, não confirmado)
- Texto institucional real (história, missão, diferencial) — o que está no site é
  genérico, escrito para não bloquear o desenvolvimento
- Seguradoras parceiras (para eventual integração ou apenas registo manual)

## 2. Estrutura do repositório

Um repositório, dois projectos — mesmo padrão do `razao-dinamica`: site institucional
estático na raiz + CRM (Vite/React) em `crm/`. Cada um é o seu próprio deploy Vercel
(Root Directory diferente por projecto).

```
BVseguros/
├── AGENTS.md, documento.md     ← governação (regras + visão geral)
├── brand/                       ← logótipo, fonte de verdade da marca
├── index.html, styles.css,      ← site institucional (estático, sem build)
│   script.js, server.js
├── images/                      ← imagens do site (cópia do logo)
├── package.json                 ← só scripts de dev do site (node server.js)
├── vercel.json, .vercelignore,  ← deploy do site (Vercel + cPanel)
│   .htaccess, robots.txt
└── crm/                          ← CRM — projecto Vite/React à parte
    ├── src/, public/, supabase/
    ├── package.json, vite.config.ts, ...
    └── README.md                 ← instruções específicas do CRM
```

### Site institucional (raiz)

HTML + CSS + JS nativo, sem passo de build — mesmo padrão do `AbreuEPereira` e do
`Sentinela100Erro`. `npm start` corre `server.js` (servidor de dev, porta **8090**).
Conteúdo actual é placeholder (ver secção 1) — página única com secções Sobre,
Seguros, Porquê a BV, Contacto (formulário via `mailto:`).

### CRM (`crm/`)

React 18 + TypeScript + Vite + Tailwind + Supabase + React Router. Ver
[`crm/README.md`](crm/README.md) para correr localmente e configurar o Supabase, e
[`AGENTS.md`](AGENTS.md) para as convenções de arquitectura. Porta de dev: **5183**.

Funcionalidades já implementadas (scaffold, sem dados reais):

- Auth com Supabase (login, perfil `ativo`/`is_admin`)
- Leads: pipeline Kanban com drag-and-drop
- Clientes e Apólices: listagem + criação
- Dashboard com KPIs básicos
- `crm/supabase/schema.sql`: tabelas + RLS desde a primeira migration

## 3. Stack tecnológico

| Projecto | Stack | Porquê |
| --- | --- | --- |
| Site (raiz) | HTML + CSS + JS nativo | Mesmo padrão do `AbreuEPereira`/`Sentinela100Erro` — sem build, deploy trivial em Vercel ou cPanel |
| CRM (`crm/`) | React 18 + TypeScript + Vite + Tailwind + Supabase + React Router | Mesmo padrão do `razao-dinamica/crm` |

**Não** inclui TanStack Query nem Capacitor no CRM — esses vêm de um exemplo de
`agents.md` de outro projecto (WeGest), com stack diferente. Ver
[`AGENTS.md`](AGENTS.md) secção 0.

## 4. Por decidir antes de dar conteúdo final

- [ ] Ramos de seguro e vocabulário de domínio definitivos (ver `AGENTS.md` secção 3)
- [ ] Morada, telefone, email, NIF reais da BV Seguros
- [ ] Nome de domínio definitivo
- [ ] Texto institucional real (sobre, diferenciais)
- [ ] Se há integração WhatsApp no CRM desde já ou fica para fase 2
- [ ] Perfis de utilizador e permissões no CRM (admin, mediador, ...)
- [ ] Projecto Supabase real a ligar (o CRM só foi testado com credenciais placeholder)

## 5. Próximos passos

1. Validar o site e o CRM com o João/cliente — conteúdo do site e âmbito do CRM.
2. Preencher os placeholders do site (contactos, morada, texto institucional).
3. Criar o projecto Supabase real e correr `crm/supabase/schema.sql`.
4. Configurar dois projectos Vercel (site: Root Directory `.`; CRM: Root Directory
   `crm`) e o domínio.

---

_Última actualização: 2026-09-18._
