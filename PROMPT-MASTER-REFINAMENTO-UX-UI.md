# Prompt master: refinamento de UX/UI, direção de design e posicionamento

Prompt para o agente que vai fazer uma passagem de refinamento ao site institucional
(raiz do repositório). Mexe **só no site**. Não mexe em `crm/` nem na base de dados;
o CRM entra apenas como referência de coerência de marca (leitura). Copiar a partir de
"Papel".

Origem: pedido de 01/10/2026 para usar as skills de design instaladas
(`design:design-critique`, `design:accessibility-review`, `design:design-system`,
`design:ux-copy`, `design:design-handoff`) e fechar a direção visual e o
posicionamento do site antes do lançamento.

Estado: **fases 1 e 2 feitas (01/10/2026).** Diagnóstico e estado item a item em
`docs/refinamento-ux-ui.md`; decisão em `DECISIONS.md` (2026-10-01). A mesma
passagem foi depois aplicada ao CRM, a pedido (`crm/REFINAMENTO-UX-UI.md`). Ficam por
fazer as decisões do cliente (secção G) e a fase 3 (handoff).

---

## Papel

És o designer de produto e developer front-end da BV Seguros. O site já está
completo em estrutura: reestruturação inspirada na Fidelidade, fotos a rolar nos
heros, pedidos de proposta por passos, participação de sinistros, páginas legais.
Cresceu por rondas de pedidos do cliente, e cada ronda resolveu o seu problema. Falta
uma passagem de conjunto: que o site inteiro leia como **uma corretora
independente**, com uma hierarquia clara e um sistema visual coerente de ponta a
ponta, e que nenhuma página pareça vinda de outro projeto.

O teu trabalho é diagnosticar, propor, e só depois de aprovado, refinar. Refinar
quer dizer apertar o que existe, sem redesenhar nem acrescentar funcionalidades.

## Leitura obrigatória

Por esta ordem, antes de abrir qualquer skill:

1. `AGENTS.md` da raiz, `BLUEPRINT.md`, `MASTER-PROMPT.md` (o brief: personalidade
   "confiável, próxima, clara", navy `#184070`, Plus Jakarta Sans + Inter).
2. `docs/design-system.md` (tokens, `Container`/`Section`, `CardGrid`, centragem
   global, secção "BV Seguros: navigation and page components").
3. `docs/anti-ai.md` (o teste de decisão de design) e `docs/content-style.md`
   (travessão proibido, sem "não é X, é Y", sem tríades de enchimento).
4. `docs/accessibility.md`, `docs/responsive.md`, `docs/agent-protocol.md`,
   `docs/lessons-learned.md`.
5. `DECISIONS.md`: as entradas específicas da BV Seguros (perto do fim). Cada
   override que lá está foi decidido; não o desfazes sem o propor explicitamente.
6. `documento.md` secção 5 (o que está por confirmar com o cliente).
7. Os prompts anteriores, para saber o que já foi pedido e porquê:
   `PROMPT-MASTER-REESTRUTURACAO.md`, `PROMPT-MASTER-AJUSTES-V2.md`,
   `PROMPT-MASTER-SINISTROS.md`, `PROMPT-MASTER-FORMULARIOS-FIDELIDADE.md`.
8. Código: `src/styles/tokens.css`, `src/styles/components.css` (cerca de 3200
   linhas: é aqui que a deriva se acumula), `src/pages/*`, `src/sections/*`,
   `src/components/**`, `src/data/seguros.ts`, `src/data/navigation.ts`.

## Regras que se mantêm

- Nada de dados inventados: morada, telefone, estatísticas, anos de experiência,
  testemunhos, prémios, parceiros. O que falta continua `PorConfirmar` /
  `[por confirmar]`. Uma frase de posicionamento que dependa de um facto não
  confirmado ("há 20 anos", "mais de N clientes") não entra.
- PT-PT em todo o texto visível. Zero travessões (U+2014) em `src`, `docs` e `*.md`.
- Tokens antes de valores soltos. Componentes consomem só tokens semânticos.
- `CardGrid` para qualquer conjunto de caixas; centragem global como está documentada.
- Não remover funcionalidades, secções ou páginas sem aprovação explícita.
- Não introduzir dependências novas. Não mexer em `api/` nem na lógica dos formulários
  (validações, envio, Turnstile), só na apresentação.
- Commits só quando o utilizador escrever "mande pro git".

---

## A. Posicionamento (a base de todas as decisões)

Antes de olhar para pixels, fixa a frase que o site inteiro tem de provar. Parte do
que já está escrito no hero e no "Sobre" e não acrescentes factos novos.

**O que a BV é:** corretora de seguros independente. Compara seguradoras pelo
cliente, ajuda a escolher, e acompanha quando é preciso usar a apólice (sinistros).

**O risco atual:** a estrutura foi inspirada na Fidelidade, que é uma seguradora.
Uma corretora que se apresenta com a linguagem visual e a arquitetura de uma
seguradora apaga o seu próprio diferencial. Verifica em cada página se o leitor
percebe, sem ler tudo, que:

1. a BV **não vende um produto próprio**, trabalha com várias seguradoras
   (`SeguradorasFaixa`, `data/seguradoras.ts`);
2. há **uma pessoa** do outro lado, antes e depois de contratar;
3. o próximo passo é **pedir uma proposta** (o objetivo do site é gerar pedidos
   para o CRM, não vender online).

**Entregável A:** uma tabela de mensagens, curta, com 1 promessa principal e 3 provas
de apoio, cada prova ligada ao sítio do site onde já aparece (ou onde falta). Para
cada página: qual é o seu papel nesta narrativa e qual é a única ação principal.
Se uma prova só existir como placeholder, fica assinalada como tal.

## B. Diagnóstico por página (`design:design-critique`)

Com `npm run dev` a correr (porta 5190), percorre cada rota no browser em 375, 768,
1024, 1280 e 1440 px. Rotas: `/`, `/seguros`, cada página de ramo
(`SeguroPagina`), cada página de pedido (`PaginaPedido`, modos proposta e
sinistro), `/sinistros`, `/privacy`, `/terms`, `/cookies` e uma rota inexistente
(404). Tira screenshots (`npm run qa:layout -- --shots=<pasta no scratchpad>`).

Corre a skill `design:design-critique` por página, com este contexto fixo:
"Site de uma corretora de seguros em Portugal; público: famílias e pequenas
empresas; fase: refinamento final antes do lançamento; objetivo: pedido de proposta."

Para além do enquadramento da skill (primeira impressão, usabilidade, hierarquia,
consistência, acessibilidade), responde a estas perguntas específicas:

- O que o olho vê primeiro em cada hero? É a promessa ou é a foto?
- O CTA principal é o mesmo em todo o site, com o mesmo texto e o mesmo peso?
  Há páginas com dois CTAs primários a competir?
- As secções repetem a mesma estrutura (rótulo, título, lede, grelha de 3) página
  após página? (`docs/anti-ai.md`, "layouts estruturalmente idênticos")
- O ritmo vertical entre secções é previsível (variantes de `Section`) ou há
  margens soltas?
- O header, o mega menu e o `PageSubnav` dizem a mesma coisa da mesma maneira?
- O caminho "tenho um sinistro" é encontrável em menos de dois cliques a partir
  de qualquer página?
- A página de ramo e a página de pedido do mesmo ramo parecem o mesmo site?

**Entregável B:** um relatório por página no formato da skill, com severidade
(crítico / moderado / menor). No fim, uma lista única priorizada de no máximo
15 alterações, cada uma com: problema, porquê (princípio ou objetivo violado),
proposta concreta, ficheiros afetados, esforço (P/M/G).

## C. Auditoria do sistema (`design:design-system`)

Corre `design:design-system` em modo auditoria sobre `src/styles` e
`src/components`. Procura:

- valores soltos fora dos tokens (cores hex, px de espaçamento, raios, sombras,
  `z-index`) em `components.css` e nos `style={{ ... }}` dos `.tsx` (há cerca de
  65; alguns são legítimos, como `gridColumn`, mas margens com `var(--space-*)`
  repetidas em todo o lado são sinal de que falta uma utilidade ou uma variante);
- classes duplicadas ou quase iguais criadas em rondas diferentes (o mesmo cartão,
  o mesmo bloco de hero, a mesma faixa com nomes diferentes);
- componentes com o mesmo papel e aspeto diferente (botões, chips de escolha,
  `.choice-group`, cartões de ramo, ícones `LineIcon` vs `RamoIcon`);
- escala tipográfica: quantos tamanhos estão realmente em uso e se cada um tem papel;
- uso de `--color-accent` e `--color-secondary`: são derivações da marca, confirma
  que não aparecem como decoração sem função.

**Entregável C:** inventário de inconsistências com proposta de consolidação. Para
cada consolidação: o que se funde, o que desaparece, e prova de que nenhuma página
muda de comportamento. Novos tokens ou variantes só com justificação para
`DECISIONS.md`.

## D. Acessibilidade (`design:accessibility-review`)

Auditoria WCAG 2.1 AA com a skill, por cima do que `docs/accessibility.md` já
exige. Atenção especial a:

- contraste do texto sobre as fotos dos heros (`hero-dark hero-fotos`), em todos
  os slides e no pior momento da transição, não só no primeiro;
- controlos do carrossel de fotos: pausa, `prefers-reduced-motion`, foco, nome
  acessível;
- foco visível e ordem de tabulação no header, mega menu, `PageSubnav`,
  `SegmentTabs`, `Accordion`, `CookieConsent`, formulários por passos;
- alvos de toque de pelo menos 44 x 44 px em mobile (chips, links do footer,
  caixas da matrícula);
- erros dos formulários anunciados (`aria-live`, `aria-describedby`) e
  compreensíveis sem cor.

**Entregável D:** tabela critério WCAG / onde / estado / correção.

## E. Texto de interface (`design:ux-copy`)

Revê com `design:ux-copy` todo o microtexto: CTAs, rótulos, ajudas de campo,
mensagens de erro, estados vazios e de sucesso, banner de cookies, 404, títulos de
passos dos formulários. Critérios:

- o mesmo conceito tem sempre o mesmo nome (ex.: "pedir proposta" vs "simular" vs
  "pedir orçamento"; "participar sinistro" vs "comunicar sinistro"). Escolhe um e
  lista os sítios a alinhar;
- erros dizem o que aconteceu e como resolver, no tom da marca (próximo, claro,
  sem culpar a pessoa);
- nada de jargão de seguradora sem explicação na primeira ocorrência;
- tudo cumpre `docs/content-style.md`: corre o `grep` do travessão no fim.

Copy institucional (Sobre, diferenciais) continua a aguardar o cliente: podes
propor reescrita de forma, nunca de factos.

**Entregável E:** tabela atual / proposta / porquê, agrupada por página, mais um
mini glossário de termos fixos para o site (que o CRM deve poder reutilizar).

## F. Coerência com o CRM (só leitura)

Abre `crm/src` e o CRM em dev (porta 5183) apenas para comparar: tokens de cor,
tipografia, logótipo, tom dos textos que o cliente final vê (emails em
`crm/supabase/emails/`). Lista as divergências que fazem as duas partes parecerem
marcas diferentes. **Não alteras nada em `crm/`**: as propostas ficam no relatório
para uma tarefa separada (o CRM está em pausa por decisão de 30/09).

---

## Fase 1: diagnóstico (sem código)

Produz A a F num único ficheiro `docs/refinamento-ux-ui.md` (ou um artifact, se o
utilizador preferir partilhar com o cliente), com os screenshots relevantes
referenciados. Termina com:

1. a lista priorizada (máximo 15 itens), marcada como **rápido** (só CSS/copy,
   uma página) ou **estrutural** (vários componentes ou páginas);
2. as decisões que precisam do cliente (ver secção G);
3. a pergunta: "Aprovas a lista, ou queres cortar/reordenar?"

Pára aqui e espera resposta.

## Fase 2: implementação (depois de aprovado)

- Uma alteração aprovada de cada vez, pela ordem aprovada. Não juntes itens.
- Consolidações do sistema (C) primeiro, porque reduzem o trabalho das seguintes.
- Cada decisão visual nova passa pelo teste de `docs/anti-ai.md` e, se for um
  override, fica registada em `DECISIONS.md` com data e porquê.
- Atualiza `docs/design-system.md` sempre que um componente ou token mudar de
  contrato.
- Depois de cada item: `npm run check`, `npm run qa`, `npm run qa:layout`, e ver no
  browser os estados relevantes em mobile e desktop, com teclado.

## Fase 3: fecho (`design:design-handoff`)

Com tudo aplicado, usa `design:design-handoff` para gerar a especificação final do
sistema tal como ficou (tokens, componentes com estados, breakpoints, movimento) e
integra-a em `docs/design-system.md`. Não cries um documento paralelo: a fonte de
verdade continua a ser esse ficheiro. Acrescenta em `docs/lessons-learned.md` o que
esta passagem ensinou sobre a deriva entre rondas de pedidos.

Se o Figma estiver ligado (o conector precisa de autorização nas definições), podes
opcionalmente exportar as páginas principais para lá com `figma:figma-generate-design`,
mas só se o utilizador pedir. O código é a fonte de verdade.

---

## G. Por confirmar com o cliente (não decides sozinho)

- Frase de posicionamento final e o diferencial principal (independência,
  acompanhamento no sinistro, proximidade local?).
- Se as fotos dos heros ficam em todas as páginas ou só na home e nos ramos.
- Termo único para o pedido: "proposta", "simulação" ou "orçamento".
- Logótipo em SVG (pedido em aberto, ver `documento.md` secção 1).
- Qualquer prova social (número de clientes, seguradoras parceiras, anos): só
  entra com dados reais fornecidos por ele.

## Antes de declarar concluído

```
[ ] Fase 1 entregue e aprovada; só itens aprovados implementados
[ ] npm run check passa
[ ] npm run qa passa (zero travessões)
[ ] npm run qa:layout passa nas 5 larguras
[ ] Testado no browser: mobile e desktop, teclado e foco, reduced motion
[ ] Contraste AA confirmado sobre todas as fotos de hero
[ ] Nenhum dado inventado; placeholders continuam visíveis
[ ] docs/design-system.md e DECISIONS.md atualizados
[ ] Nada alterado em crm/ nem em api/
```
