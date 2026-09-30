# Prompt master: ajustes v2 do site (revisão do cliente, 2026-09-30)

Prompt para o agente que vai implementar a segunda ronda de ajustes do site
institucional (raiz do repositório). Não mexe em `crm/`, salvo se for aprovada
a opção B da secção 4. Copiar a partir de "Papel".

**Estado (2026-09-30): implementado, opção A aprovada.** Ver
`DECISIONS.md` 2026-09-30.

---

## Papel

És o developer front-end responsável pelo site da BV Seguros. A reestruturação
inspirada na Fidelidade já está feita (ver `DECISIONS.md` 2026-09-29 e
`PROMPT-MASTER-REESTRUTURACAO.md`). O cliente reviu o resultado e pediu os
ajustes abaixo. Implementa só isto, sem mudar o que não está listado.

## Leitura obrigatória

`AGENTS.md`, `BLUEPRINT.md`, `docs/design-system.md` (secção "BV Seguros:
navigation and page components"), `docs/anti-ai.md`, `docs/content-style.md`,
`DECISIONS.md` (as duas entradas de 2026-09-29). Depois o código:
`src/pages/Home.tsx`, `src/pages/SeguroPagina.tsx`, `src/pages/Seguros.tsx`,
`src/pages/Sinistros.tsx`, `src/sections/*`, `src/data/seguros.ts`,
`src/data/apoio.ts`, `src/components/navigation/PageSubnav.tsx`,
`src/components/navigation/Header.tsx`, `src/styles/components.css`.

## Regras que se mantêm

- PT-PT, sem travessão (U+2014), sem inventar dados da empresa (morada,
  telefone, WhatsApp, nº ASF continuam `PorConfirmar`).
- Só tokens existentes. Estados completos (hover, focus-visible, active,
  disabled, loading) em tudo o que é interativo.
- `npm run check` e `npm run qa` a passar. Testar em 375px, 768px, 1024px e
  1440px, e com teclado.
- Não remover funcionalidades sem aprovação: a Home perde o formulário porque
  o cliente o pediu explicitamente (secção 5).

---

## 1. Secção "Quero pedir proposta para" (Home)

**Problema:** título e botões encostados à esquerda dentro de uma caixa larga;
metade da caixa fica vazia à direita e o bloco lê como desalinhado.

**Fazer:**
- Caixa com largura contida (`--container-narrow` ou `--measure-intro-wide`),
  centrada no `Container`.
- Título centrado por cima; botões de ramo centrados por baixo, com
  `justify-content: center` e espaçamento uniforme.
- Mesma altura para todos os botões; ícone e texto alinhados ao centro
  vertical.
- Em mobile: grelha de 2 colunas com botões da mesma largura, em vez de uma
  linha a quebrar ao acaso.

## 2. Fotografias cortadas nos cartões (grelha de seguros)

**Problema:** a foto do Automóvel corta o carro a meio (object-fit cover
numa faixa de 10rem centrada ao meio).

**Fazer:**
- Campo novo `imagemFoco` em `src/data/seguros.ts` (valor de
  `object-position`, ex.: `"center 80%"` no Automóvel), aplicado em
  `.media-card__media` e no `.hero-photo` das páginas de ramo.
- Trocar a altura fixa por `aspect-ratio: 16 / 10`, para a proporção não
  mudar com a largura do cartão.
- Rever as 6 imagens uma a uma nos 4 tamanhos de ecrã e acertar o foco de
  cada uma.

## 3. "Ver coberturas" nos cartões

**Problema:** o link fica logo a seguir ao texto, por isso cada cartão o
tem a uma altura diferente; ao longo da linha nada se alinha.

**Fazer:**
- `.media-card__body` com `flex: 1` e o botão com `margin-top: auto`: todos
  os botões da mesma linha ficam no fundo do cartão, à mesma altura.
- Títulos e descrições alinhados entre cartões da mesma linha (se possível
  com `grid-template-rows: subgrid`; senão, altura mínima no título).
- O link passa a botão: fundo navy (`--color-primary`), texto branco,
  contorno de 1px em `--color-accent`, cantos em pílula, seta à direita.
  Hover: fundo `--color-primary-hover`; focus-visible com o anel global. O
  cartão inteiro continua clicável, e o botão é só visual (sem link dentro
  de link).

## 4. Formulário próprio em cada página de seguro

**Problema:** todas as páginas de ramo mostram o mesmo formulário genérico
(nome, email, telefone, ramo, mensagem).

**Fazer:** o formulário da página de cada ramo pergunta o que a BV precisa
para pedir propostas desse ramo. O campo "Em que seguro está interessado?"
desaparece nessas páginas (o ramo é o da página). Nome, email, telefone,
consentimento e honeypot mantêm-se em todos.

| Ramo | Campos específicos (todos opcionais, exceto onde indicado) |
|---|---|
| Automóvel | Matrícula; marca e modelo; ano; data de nascimento do condutor habitual; ano da carta de condução; seguro atual (seguradora, se tiver); coberturas pretendidas (contra terceiros / com danos próprios / não sei) |
| Vida | Finalidade (crédito habitação / proteção da família / outro); capital pretendido; nº de pessoas a segurar; idade de cada pessoa; banco do crédito, se houver |
| Saúde | Para quem (só eu / família / empresa); nº de pessoas; idades; preferência (rede convencionada / reembolso / não sei). **Não perguntar doenças nem estado de saúde**: são dados de categoria especial (art. 9.º RGPD) e não pertencem a um formulário público |
| Multirriscos habitação | Tipo (apartamento / moradia); situação (proprietário / arrendatário); com crédito habitação (sim / não); código postal; área aproximada (m²); ano de construção; o que segurar (edifício / recheio / ambos) |
| Acidentes de trabalho | Nome da empresa; atividade (texto livre); nº de trabalhadores; massa salarial anual aproximada; trabalhador independente (sim / não) |
| Outros seguros | Tipo de seguro (responsabilidade civil / viagem / animais / acidentes pessoais / empresa / outro); descrição (obrigatório) |

- Definição dos campos em dados (`src/data/formularios.ts`: rótulo, tipo,
  opções, `autoComplete`, validação), não seis componentes escritos à mão. O
  `ContactoForm` passa a receber o esquema do ramo.
- Tipos certos para cada campo (`inputMode="numeric"`, `type="date"`,
  `select`, `radio` em grupo com `fieldset`/`legend`), duas colunas em
  desktop para campos curtos, uma em mobile.
- Título e texto do lado esquerdo específicos do ramo (ex.: Automóvel: "Tenha
  à mão os dados do carro e do condutor habitual").
- A página `/seguros` (hub) e `/sinistros` mantêm o formulário genérico com
  a escolha do ramo.

**Como chegam ao CRM** (decisão a aprovar, ver fim):
- **Opção A (recomendada para já):** os campos do ramo são juntos num bloco
  de texto legível e enviados no `mensagem` que já existe (ex.: "Matrícula:
  AA-00-AA / Marca e modelo: ..."), seguido da mensagem livre. Sem alterações
  no CRM. Limite de 2000 caracteres da função `criar_lead_site`: validar no
  cliente e cortar a mensagem livre primeiro.
- **Opção B:** coluna `detalhes jsonb` em `leads`, parâmetro novo
  `p_detalhes` em `criar_lead_site` (com validação de tamanho), e a ficha do
  lead no CRM a mostrar os campos. Mais limpo para filtrar e reportar, mas
  mexe no CRM (migração, RLS, ecrã) e sai deste prompt para um próprio.

## 5. Home: sem formulário, com painel de contacto e mapa

**Fazer:**
- Remover a `ContactoSecao` da Home.
- Novo bloco `id="contacto"` (o CTA "Pedir contacto" do header continua a
  apontar para ele), inspirado no layout da assinatura de email da
  BoomService (`../BoomService-main/BoomService-main/email-signature/dist/`):
  - à esquerda, fotografia de fundo (a de `/images/porque-bv.jpg` ou outra do
    mesmo banco de imagens) cortada por uma **faixa diagonal** em navy com um
    fio em `--color-accent`, feita com `clip-path`, sem imagem extra;
  - à direita, título curto, linha de subtítulo em maiúsculas pequenas e a
    lista de contactos com ícones dentro de círculos (telefone, email,
    WhatsApp, morada), com os dados de `src/data/apoio.ts`;
  - dois botões: "Pedir proposta" (leva a `/seguros`) e "Participar
    sinistro" (`/sinistros`).
  - Em mobile, a foto passa para cima com o corte diagonal na horizontal.
- Por baixo, **painel do Google Maps**:
  - `iframe` de incorporação sem chave de API
    (`https://www.google.com/maps?q=<morada>&output=embed`), com `title`,
    `loading="lazy"` e cantos arredondados;
  - **só carrega depois de o visitante aceitar**: o Maps define cookies de
    terceiros, por isso até lá aparece um cartão com a morada e o botão
    "Mostrar mapa" (e uma nota a dizer que o Google pode definir cookies). Se
    o visitante já aceitou cookies de terceiros no `CookieConsent`, carrega
    diretamente. Atualizar a política de cookies com o Google Maps;
  - **enquanto a morada estiver por confirmar**, o painel mostra o cartão com
    `PorConfirmar` e não carrega mapa nenhum (não pôr no mapa uma morada
    fictícia).

## 6. Subnavegação das páginas de ramo

**Problema:** a barra está fixa a `top: 77px`, mas a altura do header muda
com a largura do ecrã (tamanho de letra fluido no logótipo). Fica uma folga
entre o header e a barra por onde se vê o conteúdo, ou a barra fica por
baixo do header.

**Fazer:**
- O `Header` mede a própria altura (`ResizeObserver`) e publica-a como
  `--header-offset` no `:root`; a barra e o `scroll-margin-top` usam essa
  variável. Remover o valor fixo do CSS.
- Com a barra visível, a sombra do header passa para a barra (os dois leem
  como um só bloco), sem linha dupla.
- Verificar em todas as páginas de ramo, nos 4 tamanhos, parado e a meio do
  scroll, e ao clicar em cada âncora (a secção tem de ficar logo abaixo da
  barra, sem ficar tapada).

---

## Critérios de aceitação

- Os 6 pontos acima verificados no browser, com capturas em desktop e
  mobile de cada um.
- Nenhum scroll horizontal em 375px.
- Os formulários das 6 páginas de ramo criam um lead no CRM com o ramo certo
  e os campos específicos legíveis.
- O mapa não carrega nada da Google antes de consentimento.
- `DECISIONS.md` com uma entrada para os formulários por ramo, o painel de
  contacto da Home e o carregamento do mapa com consentimento.
  `docs/design-system.md` atualizado com o novo bloco e o contrato do
  formulário por esquema.
