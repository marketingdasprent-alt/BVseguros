# Refinamento UX/UI: diagnóstico (fase 1)

> **Estado (01/10/2026): fase 2 aplicada.** Lista aprovada, incluindo a remoção de
> CSS morto; os pontos que dependem do cliente ficaram de fora. Ver "Estado da
> implementação" no fim e `DECISIONS.md` (2026-10-01, refinamento UX/UI).

Resultado da fase 1 do [`PROMPT-MASTER-REFINAMENTO-UX-UI.md`](../PROMPT-MASTER-REFINAMENTO-UX-UI.md),
feita a 01/10/2026 sobre a branch `site-hero-fotos`. Só diagnóstico: nenhum ficheiro do
site foi alterado. Base: crítica visual no browser (todas as rotas, 375 a 1440 px),
`npm run qa:layout` (15 páginas x 5 larguras, **sem problemas**), auditoria do sistema
de design e auditoria de microtexto ao código.

O site está sólido: os tokens são respeitados (zero hex, zero `z-index` e zero
`font-size` literais fora de `tokens.css`), a grelha e a centragem passam no QA, os
placeholders estão todos visíveis e os erros de validação dos formulários são
específicos. Os problemas são de **coerência**: a mesma ação tem nomes diferentes, a
mesma peça tem estilos diferentes, e a história de corretora independente perde-se
no meio da linguagem de seguradora.

---

## A. Posicionamento

**Promessa principal** (já escrita no rodapé, `Footer.tsx:42-44`):
"Corretora independente: comparamos propostas de várias seguradoras e acompanhamos o
cliente do pedido de proposta ao sinistro."

| Prova | Onde já está | O que falta |
|---|---|---|
| 1. Trabalha com várias seguradoras | Hero, "Sobre", FAQ "corretora vs seguradora", rodapé | Nenhuma seguradora nomeada: `SEGURADORAS = []`, a faixa está escondida. A prova é só uma afirmação. **Depende do cliente.** |
| 2. Uma pessoa acompanha antes e depois | "alguém do outro lado" (hero), "Um mediador da BV fala consigo" (pedido), `/sinistros` | Telefone, WhatsApp e morada por confirmar; nenhuma pessoa ou equipa nomeada. |
| 3. O próximo passo é pedir proposta | Hero, atalhos por ramo, `ContactoSecao` em todas as páginas | Enfraquecido por 5 rótulos diferentes para a mesma ação (ver E) e pelo "Simular", que promete um preço que o site não dá. |

**Texto que soa a seguradora** (a BV não segura, ajuda a escolher quem segura):

- "Um seguro para cada fase da vida." (`Home.tsx:198`): slogan de seguradora.
- "Simular" (`SegurosGrid.tsx:70`, `SeguroPagina.tsx:80`): vocabulário de cotação imediata.
- Coberturas descritas como se a BV as garantisse (`seguros.ts:96, 134, 179, 230`:
  "repara o seu carro", "Garante um capital").
- Níveis "Essencial / Intermédio / Completo": parecem planos próprios; o aviso de que
  são ilustrativos só aparece por baixo da tabela.

| Página | Papel na narrativa | Ação principal única |
|---|---|---|
| `/` | Quem é a BV e porque é diferente de uma seguradora | Pedir proposta |
| `/seguros` | Que ramos a BV trata | Pedir proposta (por ramo) |
| `/seguros/<ramo>` | O que importa neste ramo e como a BV ajuda a escolher | Pedir proposta deste ramo |
| `/sinistros` | A BV continua presente depois de contratar | Participar sinistro |
| Pedidos | Recolher o pedido com o mínimo de esforço | Próximo / Enviar pedido |

## B. Crítica por página (`design:design-critique`)

### Global

| Problema | Severidade | Recomendação |
|---|---|---|
| CTA do header diz "Pedir contacto" mas abre o pedido de proposta (`App.tsx:44`) | 🔴 Crítico | "Pedir proposta" |
| A mesma ação com 5 rótulos: "Pedir uma proposta", "Pedir proposta", "Simular", "Pedir contacto", "orçamento" | 🔴 Crítico | "Pedir proposta" em todo o lado |
| Linhas decorativas (`section-decor`) atravessam títulos, FAQ e texto em quase todas as secções | 🟡 Moderado | Limitar a 1 ou 2 secções por página e nunca por trás de texto corrido |
| Rodapé em `neutral-950` (quase preto, `rgb(2,6,23)`), fora da família navy da marca | 🟡 Moderado | Usar uma derivação do navy (`--color-primary-active` ou um token `--color-surface-inverse`) |
| Banner de cookies cobre o botão "Próximo" no primeiro passo dos pedidos (desktop e mobile) | 🟡 Moderado | Banner em barra no fundo, ou não sobrepor a zona da ação nas páginas de pedido |
| `/privacy` e a 404 usam o título genérico do site | 🟢 Menor | Título próprio por página |

### Home

- **Primeiro olhar:** o título "Proteção a sério" e o botão verde. Correto, mas a
  frase promete proteção, que é o papel da seguradora.
- "Comparamos por si" aparece duas vezes na mesma página (diferenciais e passo 2), e
  as mesmas três ideias repetem-se em Home, nas páginas de ramo e nos passos.
- No primeiro ecrã competem: header "Pedir contacto", hero "Pedir uma proposta", o
  cartão de foto "Pedir proposta" e o seletor de ramos, mais 6 botões primários
  "Simular" logo abaixo.
- "Três coisas que fazemos sempre": o cartão do meio está preenchido a navy e os
  outros dois a branco, sem diferença de importância que o justifique.
- Passos: números grandes a `--color-accent` feitos em `style` inline, diferentes
  dos passos das páginas de ramo.

### Páginas de ramo

- No mesmo ecrã há "Pedir proposta" no hero e "Simular" no `PageSubnav`.
- Numeração `01 / 02 / 03` nas razões, que não tem função estrutural (`docs/anti-ai.md`).
- A tabela de níveis está bem resolvida; falta trazer o aviso "níveis ilustrativos"
  para junto do título.

### `/sinistros` e pedido de sinistro

- **Contradição:** `Sinistros.tsx:113` diz "participamos à seguradora consigo" e o
  formulário (`SinistroForm.tsx:65`) diz "Não substitui a participação à seguradora".
  **Depende do cliente** (quem faz a participação formal).
- Header "Pedir contacto" e hero "Participar sinistro" são dois primários a competir.

### Pedidos (proposta e sinistro)

- O fluxo por passos está limpo e focado. O ecrã de sucesso não oferece regresso ao
  site ("Voltar ao site").
- O rodapé completo aparece por baixo de um fluxo que já tirou o menu: sugere-se
  rodapé mínimo (legais apenas).

## C. Sistema de design (`design:design-system`)

| Achado | Severidade | Proposta |
|---|---|---|
| Hero copiado em 4 páginas (Home, Seguros, ramo, Sinistros), com `span 7` e 3 margens inline cada | 🔴 Estrutural | Componente `HeroFotos` (título, lede, ações, controlos); elimina cerca de 16 `style` inline |
| 21 `marginTop: var(--space-*)` e 6 `gridColumn` inline | 🟡 | Utilitários `.mt-*` / `.col-span-*` ou `.stack` |
| 13 `rgba(255,255,255,…)` e 12 usos da rampa crua (`neutral-*`), quase todos no rodapé | 🟡 | Tokens `--color-text-on-dark-secondary`, `--color-border-on-dark`, `--color-surface-inverse` |
| 5 cartões que repetem a base de `.card` (`spotlight`, `claim`, `channel`, `coverage-item`, `level-card`) | 🟡 | `.card` + `card--compact`; classes próprias só para o interior |
| 10 variantes de ícone em chip, 7 tamanhos, 3 tratamentos | 🟡 | `.icon` com `--sm/--md/--lg` (20/24/32) + `.icon--chip`; manter o círculo do `signature-panel` (pedido do cliente) |
| `LineIcon` e `RamoIcon` com o mesmo contrato e APIs diferentes; SVG avulsos em Home, SeguroPagina, useHeroFotos | 🟢 | `RamoIcon` passa a usar o mapa de paths do `LineIcon` |
| 4 estilos de número de passo | 🟢 | Unificar `steps-list__number` e o inline da Home |
| Breakpoints 639/640, 767/768, 479/480 e um 900 órfão; `max-width: 768px` sobrepõe-se a `min-width: 768px` | 🟡 | Normalizar para 480/640/768/1024, validar com `qa:layout` |
| `--font-size-caption` = `--font-size-label` (0.8125rem); `letter-spacing` sem token | 🟢 | Alias ou diferenciar; `--letter-spacing-caps` |
| 3 tintas de fundo quase iguais (7%, 7%, 5%) | 🟢 | `--color-surface-tint` |
| CSS morto: `.contact-form-card`, `.form-section-title`, `.split-section*` (cerca de 45 linhas) | 🟢 | Remover **com aprovação** |
| `--color-secondary` sem uso em componentes | 🟢 | Manter por agora (é contrato do Blueprint) |

Respeitado e a manter: botão verde do hero (`--color-cta`, DECISIONS 01/10), fotos a
rolar, círculo com gradiente do `signature-panel`.

## D. Acessibilidade (`design:accessibility-review`)

| Critério | Onde | Estado | Correção |
|---|---|---|---|
| 1.4.3 Contraste | Texto do hero sobre fotos | ✅ Passa: o véu navy é mais denso atrás do texto (DECISIONS 01/10) | Nenhuma |
| 2.2.2 Pausar | Carrossel do hero | ✅ Botão de pausa, sem rotação com `prefers-reduced-motion` | Nenhuma |
| 2.5.8 Alvo mínimo (2.2 AA, 24 px) | Pontos do carrossel 24 x 24, pausa 32 x 32 | ✅ No limite | Aumentar a área de toque para 44 px sem mudar o desenho (opcional, boa prática) |
| Boa prática 44 px | Botões `btn--sm` (36 px), links do rodapé (20 px de altura), filtros (38 px) em mobile | 🟡 | `min-height: 44px` em mobile nos botões pequenos; mais espaço entre links do rodapé |
| 4.1.2 Nome, função | Pontos do carrossel: `aria-current` no ativo, nomes "Mostrar Vida" | ✅ | Nenhuma |
| Consentimento (RGPD, boa prática UE) | "Aceitar todos" é primário e "Só os necessários" secundário | 🟡 | Dar o mesmo peso visual aos dois |
| 2.4.7 Foco visível | Focus ring repetido 10 vezes com offsets literais | ✅ Funciona | Partilhar o selector (ver C) |

Não testado nesta fase com leitor de ecrã; fica para a verificação da fase 2.

## E. Microtexto (`design:ux-copy`)

**Glossário proposto** (fixo para o site e reutilizável no CRM):

| Conceito | Termo | Deixa de se usar |
|---|---|---|
| Pedir uma cotação | **Pedir proposta** | Simular, Pedir contacto, Pedir uma proposta, orçamento |
| Comunicar uma ocorrência | **Participar sinistro** (CTA); "pedido de sinistro" (o formulário) | acionar (nos rótulos) |
| A empresa / a pessoa | **corretora** / **mediador da BV** | |
| Quem fica coberto | **pessoa segura** | pessoas a segurar |
| Ver um ramo | **Ver seguro** | Ver detalhes |
| Ver a lista | **Ver todos os seguros** | Ver seguros disponíveis, Ver seguros |
| Contacto | **Fale connosco** | Falar connosco, Fale com a BV Seguros |
| Sucesso | **Pedido recebido.** | Pedido enviado. |
| Forma de tratamento | **você** em todo o site | "Conta-nos / Preenche / liga-nos / Escolhe" (`seguros.ts:364-373`) |

**Mensagens a reescrever:**

| Atual | Proposta |
|---|---|
| "Verifique os dados do formulário e tente novamente." (`enviarContacto.ts:23`) | "Não conseguimos aceitar um dos dados. Reveja o resumo acima e envie de novo; se continuar, escreva para geral@bvseguros.pt." |
| "Obrigado pelo contacto… em breve." (`ContactoForm.tsx:107`) | "Pedido recebido. Um mediador da BV Seguros vai contactá-lo pelo telefone ou email que indicou." |
| "Matrícula desligada: indique a marca e o modelo." (`CampoMatricula.tsx:154`) | "Sem matrícula: indique a marca e o modelo abaixo." |
| "O nome não leva números." (`validacoes.ts:124`) | "Escreva o nome sem números." |
| "O texto é demasiado longo." (`mensagemNativa.ts:30`) | "Escreva no máximo {n} caracteres." |
| "Não é uma escolha final: serve para…" (`formularios.ts:352`, construção proibida) | "Serve para pedirmos as propostas certas; pode mudar depois." |
| "Um seguro para cada fase da vida." (`Home.tsx:198`) | "Os seguros que tratamos." (ou outra a validar) |

Sem travessões em `src`. `Terms.tsx:27-29, 43` ainda tem `[…]` por preencher (já
conhecido, depende do cliente).

## F. Coerência com o CRM (só leitura)

- **Tipografia diverge:** o CRM usa Inter também nos títulos (`crm/tailwind.config.js:22`);
  o site usa Plus Jakarta Sans. O `AGENTS.md` diz que é "a mesma do CRM", e não é.
  Decidir qual dos dois se alinha (tarefa separada; o CRM está em pausa).
- Navy `#184070` igual nos dois. ✅
- Os emails em `crm/supabase/emails/` não usam nenhum dos termos em conflito. ✅

---

## Lista priorizada (para aprovação)

| # | Alteração | Tipo | Esforço | Ficheiros principais |
|---|---|---|---|---|
| 1 | Rótulo único "Pedir proposta" (header, hero, cartões, subnav); "Simular" sai | rápido | P | `App.tsx`, `Home.tsx`, `SegurosGrid.tsx`, `SeguroPagina.tsx`, `PedirPropostaPara.tsx` |
| 2 | Glossário E aplicado (Ver seguro, Fale connosco, Pedido recebido, pessoa segura) e "você" nos passos | rápido | P | `seguros.ts`, `ContactoForm.tsx`, `NotFound.tsx`, `formularios.ts`, `MegaMenu.tsx` |
| 3 | Reescrever as mensagens fracas da tabela E | rápido | P | `enviarContacto.ts`, `ContactoForm.tsx`, `CampoMatricula.tsx`, `validacoes.ts`, `mensagemNativa.ts`, `formularios.ts` |
| 4 | Tirar a linguagem de seguradora: slogan da secção de seguros, verbos das coberturas ("pode cobrir"), aviso dos níveis junto ao título | rápido | M | `Home.tsx`, `seguros.ts`, `ComparacaoNiveis.tsx` |
| 5 | Home: tirar a repetição "Comparamos por si" e igualar os 3 cartões dos diferenciais | rápido | P | `Home.tsx`, `seguros.ts` |
| 6 | Componente `HeroFotos` e utilitários de margem/coluna (elimina a cópia em 4 páginas) | estrutural | M | `Home`, `Seguros`, `SeguroPagina`, `Sinistros`, nova `components/ui/HeroFotos.tsx`, `utilities.css` |
| 7 | Tokens on-dark/inverse/tint; rodapé passa para a família navy | estrutural | M | `tokens.css`, `components.css`, `DECISIONS.md` |
| 8 | Linhas decorativas: no máximo 1 ou 2 secções por página e fora do texto | rápido | P | `components.css`, páginas |
| 9 | Banner de cookies: os dois botões com o mesmo peso e sem tapar o "Próximo" nos pedidos | rápido | P | `CookieConsent.tsx`, `components.css` |
| 10 | Pedidos: "Voltar ao site" no sucesso e rodapé mínimo | rápido | P | `PaginaPedido.tsx`, `ContactoForm.tsx`, `SinistroForm.tsx`, `App.tsx` |
| 11 | Ramo: tirar a numeração 01/02/03 das razões; unificar números de passo | rápido | P | `SeguroPagina.tsx`, `Home.tsx`, `components.css` |
| 12 | Base `.card` + `card--compact` e `.icon` com 3 tamanhos | estrutural | G | `components.css`, componentes de cartão |
| 13 | Alvos de toque de 44 px em mobile (botões pequenos, rodapé) | rápido | P | `components.css` |
| 14 | Normalizar breakpoints (480/640/768/1024) | estrutural | M | `components.css`, `responsive.css` |
| 15 | Remover CSS morto (3 blocos, cerca de 45 linhas) e unificar `RamoIcon` com `LineIcon` | estrutural | P | `components.css`, `RamoIcon.tsx`, `docs/design-system.md` |

Sugestão de ordem: 1 a 5 primeiro (impacto alto, risco baixo, só copy), depois 6 e 7
(reduzem o trabalho dos restantes), depois o resto.

## Decisões que precisam do cliente

1. **Sinistros:** a BV faz a participação formal à seguradora, ou só acompanha?
   Muda o texto de `/sinistros` ou o aviso do formulário (e talvez o CTA para
   "Pedir ajuda com um sinistro").
2. **Seguradoras parceiras:** a lista real. Sem ela, a prova principal da
   independência fica só em texto.
3. **Frase do hero:** "Proteção a sério" foi pedida na ronda de 01/10; manter, ou
   passar para uma frase de corretora (ex.: "O seguro certo, escolhido consigo")?
4. **Tipografia dos títulos no CRM:** alinhar com o site (Plus Jakarta Sans) ou
   aceitar a diferença.

---

## Estado da implementação (fase 2, 01/10/2026)

| # | Estado | Nota |
|---|---|---|
| 1 | ✅ | "Pedir proposta" no header, hero, cartões e subnav |
| 2 | ✅ | Glossário aplicado; "você" nos passos |
| 3 | ✅ | Mensagens reescritas |
| 4 | ✅ | Título da secção, verbo de cobertura, 2 títulos de ramo, aviso dos níveis junto ao título. O hero "Proteção a sério" fica (decisão do cliente) |
| 5 | ✅ parcial | Repetição "Comparamos por si" resolvida (passo 2 passa a "Pedimos as propostas"). O cartão escuro do meio **fica**: tem razão documentada (quebrar a terceira grelha igual da página) |
| 6 | ✅ | `HeroFotos`; inline styles de ~35 para 7, todos legítimos |
| 7 | ✅ | Tokens de superfície escura; rodapé em navy |
| 8 | ✅ | Linhas da Home nas margens; as 5 secções decoradas mantêm-nas (pedido do cliente) |
| 9 | ✅ parcial | Botões com o mesmo peso, banner compacto em desktop, a página reserva a altura do banner. No primeiro ecrã de um pedido, com 800 px de altura, o "Próximo" ainda fica por baixo do banner até se fazer scroll |
| 10 | ✅ | Rodapé mínimo nos pedidos; "Voltar ao site" no sucesso |
| 11 | ✅ | Sem 01/02/03 nas razões; números de passo da Home iguais aos das páginas de ramo |
| 12 | ✅ | Uma regra de superfície de cartão; escala `--icon-size-*` |
| 13 | ✅ | 44 px em ponteiro grosso (botões pequenos, rodapé) |
| 14 | ✅ | Só 480/640/768/1024 |
| 15 | ✅ | 67 linhas de CSS morto removidas; `RamoIcon` sobre a base do `LineIcon` |

Por fazer (depende do cliente): as 4 decisões acima. A tipografia do CRM fica para
uma tarefa separada.
