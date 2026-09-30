# Prompt master: reestruturação do site com base na experiência Fidelidade

Prompt para entregar a um agente IA (ou a um developer) que vai fazer a
reestruturação completa do site institucional (raiz do repositório). Copiar
tudo a partir de "Papel" para o agente. Não se aplica a `crm/`.

## Estado (2026-09-29)

Já implementado: mega-menu e menu móvel, rodapé em 4 colunas, `/sinistros`,
acessos rápidos, "Quero pedir proposta para", separadores
Particulares/Empresas, "Dúvidas? Nós ajudamos" com canais, níveis de
proteção com tabela (Automóvel, Saúde, Multirriscos), destaque por ramo
(Automóvel, Vida), subnavegação com secção ativa, meta description por
página. Ver `DECISIONS.md` 2026-09-29.

Falta: testemunhos (só com testemunhos reais), seguradoras parceiras
(`src/data/seguradoras.ts`, vazio), e os conteúdos por confirmar listados
no fim deste ficheiro.

---

## Papel

És o developer front-end sénior responsável pelo site da BV Seguros, uma
corretora de seguros independente em Portugal. Vais reestruturar a
arquitetura de informação e a experiência do site tomando como referência
os padrões de navegação e de página do site da Fidelidade
(https://www.fidelidade.pt), adaptados a uma corretora: a BV não vende um
produto próprio, compara propostas de várias seguradoras e acompanha o
cliente do orçamento ao sinistro.

## Leitura obrigatória antes de escrever código

Por esta ordem, sem saltar nenhum: `AGENTS.md`, `BLUEPRINT.md`,
`docs/design-system.md`, `docs/anti-ai.md`, `docs/content-style.md`,
`docs/agent-protocol.md`, `MASTER-PROMPT.md`, `DECISIONS.md`,
`documento.md` (secção 4, o que está por confirmar).

Depois lê o código atual: `src/App.tsx`, `src/app/router.ts`,
`src/data/navigation.ts`, `src/data/seguros.ts`, `src/pages/Home.tsx`,
`src/pages/Seguros.tsx`, `src/pages/SeguroPagina.tsx`,
`src/sections/ContactoSecao.tsx`, `src/sections/ContactoForm.tsx`,
`src/styles/components.css`.

O que já existe e deves reaproveitar, não refazer:

- `src/data/seguros.ts`: fonte única dos 6 ramos (slug, textos, coberturas,
  perguntas, ramo do CRM). Estende este ficheiro; não cries uma segunda lista.
- `/seguros` (hub) e `/seguros/<slug>` (página de ramo) com hero, breadcrumb,
  subnavegação fixa, coberturas, "como funciona", FAQ, outros seguros e
  contacto com o ramo já escolhido.
- `ContactoForm` grava leads no CRM (`src/utils/enviarContacto.ts`). Não
  alterar o contrato de envio (campos, valores de `ramo`, consentimento).

## Regras que não se negoceiam

1. **Replicar padrões, não a marca.** Copia estruturas (ordem de secções,
   tipos de componente, fluxos de navegação), nunca textos, imagens,
   ícones, logótipos, cores, nomes de produtos ("Auto 1|2|3|4", "We Care",
   "MyFidelidade") ou o aspeto visual da Fidelidade. A identidade é a da
   BV: navy `#184070`, Plus Jakarta Sans + Inter, tokens de
   `src/styles/tokens.css`.
2. **Não inventar factos.** Nada de estatísticas, número de agentes,
   testemunhos, prémios, preços, telefones, WhatsApp, horários ou
   seguradoras parceiras. O que faltar fica marcado com `PorConfirmar` e
   listado no relatório final. Uma secção que só existe com dados reais
   (testemunhos, parceiros) é construída com dados de exemplo claramente
   marcados, ou fica atrás de um array vazio que não renderiza nada.
3. **Informação de mercado, não de produto.** Coberturas e perguntas
   descrevem o que o mercado português costuma oferecer. Quando algo
   depende da lei (seguro obrigatório, prazos), escreve só o que tens a
   certeza de estar correto; na dúvida, remete para "fale connosco".
4. **Copy**: PT-PT, tratamento por "você" consistente, sem travessão
   (U+2014), sem as construções proibidas de `docs/content-style.md`.
5. **Blueprint**: `Container`/`Section` para layout, só tokens existentes
   (um token novo passa por `DECISIONS.md`), componentes com os seus
   estados (hover, focus-visible, active, disabled, loading), CSS nas
   camadas certas.
6. **Acessibilidade**: tudo operável por teclado, foco visível, menus com
   `aria-expanded`/`aria-controls`, Escape fecha, `aria-current` na página
   atual, contraste AA, `prefers-reduced-motion` respeitado.
7. **Sem dependências novas** sem justificar primeiro. O router mínimo de
   `src/app/router.ts` chega para rotas estáticas e `/seguros/<slug>`.
8. **Não remover** secções, rotas ou funcionalidades existentes sem
   aprovação. Mudar de sítio é permitido; apagar, não.

## O que observar na Fidelidade (padrões a adaptar)

Página inicial:

- Hero com mensagem principal e uma faixa de acessos rápidos logo abaixo
  (simular, área de cliente, participar sinistro, encontrar agente, falar
  connosco).
- Bloco "Quero fazer uma simulação para..." com escolha do ramo.
- Grelha de categorias com um CTA por categoria.
- "Dúvidas? Nós ajudamos" com FAQ em acordeão.
- "Escolha o seu canal preferido": cartões de canal (assistente, WhatsApp,
  contactos).

Hub de categoria (ex.: `/particulares/mobilidade/proteger`):

- Hero com CTA principal repetido ao longo da página.
- "3 razões para confiar": três pilares curtos.
- "Dê o primeiro passo": lista de produtos da categoria, cada um com
  descrição curta e link para a página própria.
- FAQ da categoria e canais de apoio no fim.

Página de produto (ex.: `/particulares/mobilidade/proteger/auto-1-2-3-4`):

- Hero com subnavegação fixa por âncoras (Coberturas, Testemunhos,
  Vantagens, Suporte).
- Opções em cartões (quatro níveis de proteção lado a lado).
- Tabela comparativa por cobertura com "Incluído", "Opcional" e
  "Não incluído".
- Destaque temático (ex.: coberturas para elétricos), testemunhos,
  vantagens, FAQ, canais de apoio.

## Adaptação à BV (o que construir)

### 1. Navegação

- Header: `Início`, `Seguros`, CTA `Pedir contacto` (já existe). `Seguros`
  passa a abrir um mega-menu em desktop, agrupado em **Particulares**
  (Automóvel, Vida, Saúde, Multirriscos habitação, Outros) e **Empresas**
  (Acidentes de trabalho, Saúde de grupo, Multirriscos empresarial,
  Responsabilidade civil), com link "Ver todos os seguros" para `/seguros`.
  Em mobile, o mesmo conteúdo em acordeão dentro do painel do menu.
  Clicar em `Seguros` sem o menu (teclado, toque) continua a levar a
  `/seguros`.
- Os grupos vêm de um campo novo em `src/data/seguros.ts`
  (`segmentos: ("particulares" | "empresas")[]`), não de uma lista à parte.
- Página nova `/sinistros` na faixa de acessos rápidos e no rodapé: o que
  fazer em caso de sinistro, por ramo, e como a BV ajuda. Contactos de
  urgência das seguradoras ficam `PorConfirmar`.

### 2. Página inicial

Ordem proposta (justifica no plano se mudares):

1. Hero atual, com a faixa de acessos rápidos por baixo: Pedir proposta,
   Participar sinistro (`/sinistros`), Falar connosco (`#contacto`),
   Ver seguros (`/seguros`).
2. "Quero pedir proposta para...": seletor de ramo (botões ou `select`)
   que leva a `/seguros/<slug>#contacto` com o ramo escolhido.
3. Grelha de ramos (já existe), agora com separador Particulares/Empresas.
4. "Três coisas que fazemos sempre" (já existe, equivale às "3 razões").
5. "Três passos, sem burocracia" (já existe).
6. Seguradoras com quem trabalhamos: faixa de nomes (texto, não logótipos
   de terceiros sem autorização), vinda de `src/data/seguradoras.ts`.
   Array vazio até o cliente confirmar, e a secção não renderiza.
7. FAQ geral em acordeão (corretora vs seguradora, custos do serviço,
   mudança de seguradora, apoio no sinistro).
8. Canais de contacto em cartões (telefone, email, WhatsApp, morada), todos
   com `PorConfirmar` exceto o email já confirmado.
9. Formulário de contacto (já existe).

### 3. Hub `/seguros`

Hero, separador Particulares/Empresas, grelha de ramos, "3 razões" da BV,
FAQ geral, canais de contacto, formulário.

### 4. Página de ramo `/seguros/<slug>`

Mantém a estrutura atual e acrescenta:

- **Níveis de proteção** (só nos ramos onde faz sentido: Automóvel,
  Multirriscos habitação, Saúde): três cartões Essencial, Intermédio e
  Completo, e por baixo uma tabela comparativa com "Incluído", "Opcional"
  e "Não incluído" por cobertura. Texto obrigatório junto à tabela: são
  níveis ilustrativos para orientar a conversa, a proposta real depende
  da seguradora. Dados em `src/data/seguros.ts` (campo opcional
  `niveis`). A tabela é uma `<table>` real com `<th scope>`, e em mobile
  passa a cartões por nível ou a scroll horizontal com a primeira coluna
  fixa.
- **Destaque temático** opcional por ramo (ex.: Automóvel: carros
  elétricos; Vida: crédito à habitação), com conteúdo de mercado.
- **Testemunhos**: componente pronto, alimentado por um array vazio até
  existirem testemunhos reais autorizados. Nunca inventar.
- **Canais de apoio** antes do formulário (reutiliza o componente da Home).
- Subnavegação: Coberturas, Níveis (se existir), Como funciona,
  Perguntas, Pedir proposta. A âncora ativa fica marcada ao fazer scroll
  (`IntersectionObserver`), com `aria-current="true"`.
- Cada página com `<title>` e `meta description` próprios (título já é
  feito por `useDocumentTitle`; acrescentar a descrição).

### 5. Rodapé

Colunas: Seguros para particulares, Seguros para empresas, Apoio
(Sinistros, Perguntas frequentes, Contacto), Empresa (Sobre, Porquê a BV).
Mantém a linha legal e o nº ASF `PorConfirmar`.

### 6. Componentes novos esperados

`MegaMenu`, `QuickActions`, `RamoSelector`, `SegmentTabs` (tabs ARIA com
setas), `Accordion` (sobre `<details>` ou com o padrão ARIA completo),
`ComparisonTable`, `ChannelCards`, `Testimonials`. Cada um documentado em
`docs/design-system.md` com o seu contrato de estados. Antes de criar,
verifica se um existente serve (`Card`, `media-card`, `spotlight-card`,
`faq`, `related-link`).

## Plano de execução (com pontos de aprovação)

1. **Plano**: lista de rotas, mapa de navegação, ordem das secções por
   página, componentes novos e alterações a `src/data/seguros.ts`.
   Pára e pede aprovação antes de escrever código.
2. **Navegação**: mega-menu, menu mobile, rodapé, `/sinistros`.
   Verificação no browser (desktop e 375px, teclado). Pára para revisão.
3. **Página inicial**.
4. **Hub e páginas de ramo**, incluindo níveis e tabela comparativa.
5. **Limpeza**: `DECISIONS.md` (decisões estruturais novas, com o porquê),
   `docs/design-system.md` (contratos), `public/sitemap.xml` (rotas novas),
   `CHANGELOG.md`.

## Critérios de aceitação

- `npm run check` e `npm run qa` passam.
- Todas as páginas testadas em 375px, 768px, 1024px e 1440px, sem scroll
  horizontal.
- Navegação completa só com teclado: mega-menu, acordeões, tabs, tabela.
- Nenhum texto, imagem ou nome de produto da Fidelidade no código.
- Nenhum dado da empresa inventado; tudo o que falta com `PorConfirmar`.
- O formulário continua a criar leads no CRM com o ramo certo em todas as
  páginas.
- Relatório final com: o que mudou por página, componentes criados, e a
  lista de conteúdos por confirmar com o cliente (seguradoras parceiras,
  contactos, testemunhos, níveis de proteção reais, contactos de
  urgência).
