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
- Renovações: editar estado (pendente/contactado/não renovada) e notas
- Ficha do cliente (`/clientes/:id`): resumo, apólices, propostas, sinistros, atividades
  e histórico de alterações
- Pesquisa e filtros em todas as listas (sem acentos/maiúsculas, filtros na URL);
  listas completas acima de 1000 registos
- Importação de clientes e apólices por CSV (Administração → Importar)
- Aviso de pedidos do site por tratar (contador no menu Leads; email opcional)
- Histórico de alterações de leads, clientes, apólices, propostas, sinistros e renovações
- Seguradoras como lista (Administração → Seguradoras), com nomes normalizados
- Login com "Esqueci a senha"; CRM fora dos motores de busca
- Utilizadores (só admins): convidar por email ou criar já com senha (troca obrigatória no primeiro acesso), definir a senha de uma conta, reenviar convite, ver convites pendentes e último
  acesso, e excluir contas pelo CRM (`crm/api/utilizadores.js`),
  editar nome, dar/retirar acesso, tornar administrador/mediador e histórico de quem
  alterou o quê. Excluir não apaga dados: o que era da pessoa fica sem responsável.
- Responsável por lead e por cliente, com filtro "Os meus" / "Sem responsável"
- RLS em todas as tabelas desde a primeira migration

Permissões: **grupos configuráveis no próprio CRM** (Administração → Grupos). Cada
utilizador pertence a um grupo; o administrador tem sempre acesso a tudo e é quem gere
contas, grupos, seguradoras e importação.

Por grupo escolhe-se:

| O quê | Opções |
| --- | --- |
| Cada módulo (Dashboard, Leads, Propostas, Clientes, Apólices, Renovações, Sinistros, Tarefas) | Sem acesso / Ver / Ver e editar |
| Extras de quem edita | Pode apagar; em Leads e Clientes, pode passar a outro responsável |
| Carteira | Toda a carteira, ou só a sua (os leads/clientes de que é responsável e os sem responsável; apólices, propostas, renovações, sinistros e tarefas seguem o cliente) |

As regras valem na base de dados (RLS + `public.pode()`), não só no ecrã. Os mediadores
que existiam antes passaram para o grupo **Mediador**, com as permissões de antes (tudo
exceto apagar e atribuir, carteira toda).

Quem cria um lead ou cliente fica responsável; o cliente herda o responsável do lead
de origem; os leads do site entram sem responsável. Converter um lead exige editar Leads
e Clientes.

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
| CRM | `bvseguros-crm` na conta **`bvseguros`** | Em `https://crm.bvseguros.pt` (e `bvseguros-crm.vercel.app`). |
| Site | `bvseguros-site` na conta **`bvseguros`** | Em `https://bvseguros.pt` (`www` redireciona para aqui). `noindex` até ao lançamento. |

DNS no cPanel (registos A e CNAME a apontar para a Vercel); os domínios estão associados
aos dois projectos. **Sem ligação ao GitHub, por decisão (30/09): o deploy é sempre
manual**, com a CLI autenticada na conta `bvseguros`: `npx vercel --prod` na raiz para o
site e dentro de `crm/` para o CRM. Fazer o deploy a partir de uma cópia limpa do `main`
(`git worktree add`), para não enviar alterações locais por commitar.

**Lançamento do site:** apagar a segunda regra de `headers` do `vercel.json` da raiz (a que
não tem `missing`). A primeira mantém o `noindex` nos endereços `vercel.app`.

Supabase: o CRM e o formulário do site usam o mesmo projecto. Num projecto novo corre-se
`crm/supabase/schema.sql`; num projecto existente, as migrações de
`crm/supabase/migrations/` pela ordem que cada cabeçalho indica ("depois de …"), não a
alfabética. `npm run test:db` (em `crm/`) mostra a ordem e testa-as antes de as correr.

**Pedidos de sinistro do site (30/09):** a migração
`crm/supabase/migrations/2026-09-30_pedidos_sinistro.sql` tem de ser corrida no SQL Editor
**antes** de publicar o site e o CRM com esta funcionalidade; sem ela o formulário de
sinistro do site falha. Fluxo: o visitante participa em `/sinistros`; o pedido entra no CRM
em Sinistros → Pedidos do site (separado dos leads); a equipa liga-o ao cliente e à apólice e
cria o sinistro. Os pedidos ficam todos guardados (decisão do cliente).

## 5. Por decidir / por confirmar com o cliente

Tudo o que depende do cliente está num só documento para enviar, com uma proposta em
cada ponto: [`docs/questionario-cliente.md`](docs/questionario-cliente.md) (02/10). O
`npm run qa` lista o que ainda falta e falha se o site sair do `noindex` assim.

- [ ] Denominação social, NIPC, morada, telefone, WhatsApp, nº de registo na ASF e
      comarca reais (num só sítio: `src/data/empresa.ts`)
- [ ] Texto institucional real (sobre, diferenciais)
- [ ] Ramos de seguro definitivos e vocabulário de domínio (ver `crm/AGENTS.md`
      secção 3)
- [ ] Nome de domínio definitivo (o site assume `bvseguros.pt`)
- [ ] IDs reais de GA4 e Meta Pixel (`index.html`)
- [ ] Política de privacidade: indicar que os pedidos de contacto e de sinistro ficam
      guardados no CRM (Supabase, subcontratante), e por quanto tempo (por agora, sem prazo)
- [ ] Linhas de assistência 24 horas das seguradoras parceiras (página `/sinistros`)
- [ ] Que grupos criar (ex.: comercial com carteira própria, backoffice só a ver) e quem
      trata os pedidos do site. Já se configura no CRM, em Administração → Grupos.
- [ ] Integração WhatsApp no CRM agora ou na fase 2
- [ ] Seguradoras parceiras (integração ou só registo manual)

## 6. Próximos passos

O plano completo de entrega está em [`crm/PROMPT-ENTREGA.md`](crm/PROMPT-ENTREGA.md)
(fases 1 e 2 feitas em 25/09/2026). Falta:

1. Fase 3 do plano (configuração de produção): Site URL/Redirect URLs, SMTP e templates
   em PT, backups, Vercel ligada ao GitHub, domínio, e (opcional) aviso por email dos
   leads do site (ver `crm/README.md`).
2. Fase 4 (RGPD) com o cliente; preencher os placeholders do site quando chegarem os dados.

---

_Última actualização: 2026-09-30._
