# Prompt master: mensagem do pedido de proposta (texto e apresentação no CRM)

Prompt para o agente que vai melhorar a mensagem que o formulário de pedido de proposta
do site envia para o CRM, e a forma como o CRM a mostra. Mexe no site (montagem do
texto) e no CRM (apresentação e email de aviso), a pedido explícito. Não muda o schema
da base de dados. Copiar a partir de "Papel".

Origem: pedido de 02/10/2026, com uma captura do modal "Editar lead" de um pedido real
de seguro automóvel. O texto chega legível, mas com cara de exportação técnica.

Estado: **fases 1 e 2 feitas (02/10/2026).** Diagnóstico e decisões em
`docs/mensagem-pedido.md`; decisão em `DECISIONS.md` (2026-10-02). Decidido: formato B,
bloco "Quem pede", o ecrã "Confirme o pedido" mantém os títulos do formulário, sem coluna
nova, e os níveis do automóvel passam a usar os nomes da página do ramo.

---

## Papel

És o developer front-end e o redator de interface da BV Seguros. O site já recolhe os
pedidos de proposta por passos, e as respostas de cada ramo seguem para o CRM dentro
do campo `mensagem` do lead (opção A de `DECISIONS.md`, 2026-09-30: sem coluna nova).
O mediador lê esse texto em três sítios para decidir que propostas pedir às
seguradoras. O teu trabalho é que ele perceba o pedido em 5 segundos: o que é, o
essencial em cima, cada bloco com um título claro, rótulos em forma de afirmação e
valores fáceis de copiar.

## Leitura obrigatória

- `AGENTS.md` da raiz e `crm/AGENTS.md` (regra 1: só se mexe nos dois projetos porque
  o pedido o diz), `docs/content-style.md` (sem travessão, sem "não é X, é Y"),
  `docs/refinamento-ux-ui.md` secção E e `crm/REFINAMENTO-UX-UI.md` secção E
  (glossário comum: "Pedir proposta", "pessoa segura", "Outros seguros", …).
- `DECISIONS.md`: entradas de 2026-09-30 (formulário dinâmico por ramo, opção A,
  prefixo `d_`) e de 2026-10-01 (formulários por passos, refinamento UX/UI).
- Site: `src/utils/montarMensagem.ts` (`blocosDosPassos`, `montarMensagem`,
  `MAX_MENSAGEM = 2000`), `src/data/formularios.ts` (passos `nome` e campos `rotulo`),
  `src/sections/ContactoForm.tsx` (`enviarProposta`), `src/pages/PaginaPedido.tsx`
  (o `contexto` com o nível), `src/components/forms/ResumoPedido.tsx` (o ecrã
  "Confirme o pedido", que usa os mesmos blocos), `tests/`.
- CRM: `src/components/crm/LeadCard.tsx` (pré-visualização de 3 linhas),
  `src/components/crm/NovoLeadModal.tsx` (aviso "Mensagem enviada pelo site"),
  `api/aviso-lead.js` (`montarEmail`, email aos admins), `src/lib/pedidosSinistro.ts`
  (`ROTULOS_DETALHES`, o padrão já usado nos pedidos de sinistro),
  `supabase/schema.sql` (`criar_lead_site`, limite de `p_mensagem`).

## Regras que se mantêm

- Sem coluna nova nem migração: o texto continua em `leads.mensagem`, com o limite de
  2000 caracteres. Uma coluna `detalhes jsonb` (como em `pedidos_sinistro`) fica como
  opção B, só se for aprovada (ver G).
- **Leads antigos continuam a ler-se bem.** O CRM tem de apresentar tanto o formato
  novo como o atual (`[Passo]` + `Rótulo: valor`), porque há leads reais guardados
  assim.
- O conteúdo vem de um formulário público: nunca entra em HTML sem ser escapado (no
  CRM, só texto do React; no email, `escaparHtml`).
- Não muda o que se pergunta no formulário nem as validações, só como a resposta é
  escrita e mostrada. Os rótulos do formulário (perguntas) ficam; criam-se rótulos de
  resumo à parte.
- Commits só quando o utilizador escrever "mande pro git".

---

## A. Diagnóstico (pedido real, automóvel)

O que chega hoje:

```
[A matrícula]
Matrícula: BT-84-HL
[O veículo]
Tipo de veículo: Ligeiro
Uso do veículo: Particular
Veículo importado?: Não
Leva atrelado ou reboque (bicicletas, pranchas, animais, mota)?: Não
[O condutor]
Data de nascimento do condutor habitual: 04/04/2001
Data da carta de condução: 04/04/2020
O seguro fica em nome do condutor habitual?: Sim
[A proteção]
Nível de proteção: Só o obrigatório
[Contacto]
NIF: 338437517
Código postal: 2410-232 (Pousos, Leiria)
```

Problemas a confirmar e a completar no diagnóstico:

1. **Rótulo = pergunta do formulário.** Dá `?:` ("Veículo importado?: Não") e rótulos
   longos com exemplos entre parênteses. No resumo quer-se a afirmação curta:
   "Importado: Não", "Atrelado ou reboque: Não".
2. **Títulos de passo com artigo** ("A matrícula", "O veículo", "A proteção") servem
   o tom do formulário, não um registo. Num resumo: "Veículo", "Condutor habitual",
   "Proteção".
3. **Blocos de uma linha só** ("[A matrícula]" + "Matrícula: …") repetem a
   informação. A matrícula pertence ao bloco do veículo.
4. **O essencial não está em cima.** O mediador quer ver logo ramo, matrícula (ou
   modelo) e nível; hoje o nível está quase no fim. A pré-visualização do cartão do
   Kanban (3 linhas, entre aspas) mostra "[A matrícula] Matrícula: BT-84-HL [O
   veículo]…", o que não diz nada.
5. **Repetição do rótulo dentro do bloco:** "Tipo de veículo" dentro de "Veículo",
   "Data de nascimento do condutor habitual" dentro de "Condutor".
6. **"Contacto" com NIF e código postal:** nome, telefone e email já estão nos campos
   do lead, por isso o bloco mistura identificação fiscal com morada. Título melhor:
   "Tomador" ou "Dados para a proposta".
7. **Apresentação no CRM:** texto corrido com `whitespace-pre-line` dentro de um
   `Notice`, sem hierarquia, sem alinhamento rótulo/valor, sem forma de copiar a
   matrícula ou o NIF.
8. **Email de aviso** (`api/aviso-lead.js`): o mesmo texto num `<p>` com
   `pre-line`; e o mapa `RAMOS` ainda diz "Outro" (o glossário diz "Outros seguros").

Faz o mesmo exercício para **todos os ramos** de `src/data/formularios.ts` (vida,
saúde, multirriscos, acidentes de trabalho, outros) e para o pedido sem ramo fixo, e
lista os rótulos que precisam de versão de resumo.

## B. Formato novo da mensagem (proposta a aprovar)

Texto simples, legível sozinho (é o que fica guardado e o que vai no email em texto),
mas com uma estrutura fixa que o CRM consegue interpretar:

```
Automóvel · BT-84-HL · Só o obrigatório

[Veículo]
Matrícula: BT-84-HL
Tipo: Ligeiro
Uso: Particular
Importado: Não
Atrelado ou reboque: Não

[Condutor habitual]
Data de nascimento: 04/04/2001
Carta de condução desde: 04/04/2020
Seguro em nome do condutor: Sim

[Proteção]
Nível: Só o obrigatório

[Tomador]
NIF: 338437517
Código postal: 2410-232 Pousos, Leiria

Mensagem:
(texto livre, se houver)
```

Regras do formato:

- **Linha de resumo** no topo: ramo · identificador principal do ramo (matrícula ou
  marca e modelo no automóvel; capital no vida; nº de pessoas na saúde; código postal
  na habitação; nº de trabalhadores nos acidentes de trabalho) · nível, se houver. É o
  que o cartão do Kanban mostra.
- Títulos sem artigo; uma linha em branco entre blocos; rótulos curtos, sem `?`, sem
  parênteses explicativos; valores sem parênteses desnecessários.
- Respostas Sim/Não ficam "Sim"/"Não"; datas `dd/mm/aaaa`; listas (extras) separadas
  por vírgula.
- O `contexto` da página (nível vindo de `?nivel=`) deixa de ser uma linha solta: entra
  no bloco Proteção e na linha de resumo, sem duplicar.
- Continua a caber em 2000 caracteres: se faltar espaço, corta-se a mensagem livre,
  nunca as respostas (regra atual de `montarMensagem`).
- Compatível com o formato antigo: `[Título]` e `Rótulo: valor` mantêm-se, por isso o
  mesmo leitor do CRM serve para os dois.

## C. Site (montagem do texto)

- Em `src/data/formularios.ts`: campo opcional `resumo` (rótulo curto) por campo e
  `titulo`/`resumo` por passo; sem ele usa-se o rótulo atual sem `?` final. Passos que
  só repetem outro bloco (ex.: matrícula) declaram em que bloco entram.
- Em `src/utils/montarMensagem.ts`: gerar a linha de resumo, juntar os blocos pela
  ordem acima, tratar o nível do `contexto`, manter o corte a 2000.
- O ecrã "Confirme o pedido" (`ResumoPedido`) pode continuar com os títulos do
  formulário (é o visitante que lê) ou passar a usar os de resumo: decidir na fase 1.
- Testes em `tests/`: um caso por ramo (texto exato esperado), o corte a 2000, o nível
  vindo do contexto, um campo sem `resumo` (cai no rótulo sem `?`).

## D. CRM (apresentação)

- `src/lib/mensagemSite.ts` (lógica pura, com testes): `lerMensagemSite(texto)` devolve
  `{ resumo?, blocos: { titulo, linhas: { rotulo, valor }[] }[], livre? }`. Aceita o
  formato novo e o antigo (sem linha de resumo, títulos com artigo, rótulos com `?`:
  limpa o `?` na leitura). Texto que não segue o padrão (leads criados à mão) volta
  como `livre`.
- `src/components/crm/MensagemSite.tsx`: blocos com título pequeno em maiúsculas
  (o estilo dos cabeçalhos de tabela), linhas como lista de definição em duas colunas
  (rótulo `text-muted`, valor `text-ink` com `tabular-nums` nas datas e números), e a
  mensagem livre à parte. Matrícula, NIF e código postal com botão de copiar
  (`aria-label` "Copiar matrícula", toast "Copiado"). Usa só tokens do `:root`
  (`crm/STYLING-PROMPT-NOVAS-FUNCIONALIDADES.md` secção 2).
- `NovoLeadModal`: troca o `<p whitespace-pre-line>` pelo `MensagemSite`; título "Pedido
  feito no site".
- `LeadCard`: mostra só a linha de resumo (ou, nos leads antigos, as 2 primeiras
  respostas) em vez das 3 linhas de texto cru entre aspas.
- Pesquisa em `Leads.tsx` continua a procurar no texto completo.
- Usar `design:ux-copy` para os rótulos de resumo e `design:accessibility-review` no
  componente (lista de definição semântica, foco no botão de copiar, contraste).

## E. Email de aviso (`crm/api/aviso-lead.js`)

- HTML: a linha de resumo como subtítulo e os blocos como tabelas pequenas (rótulo à
  esquerda em cinzento, valor à direita), mesma paleta do CRM, tudo escapado.
- Texto simples: a mensagem tal como está guardada (já fica legível com o formato B).
- `RAMOS.outro` passa a "Outros seguros". Atualizar `server/aviso-lead.test.js` (ou o
  teste equivalente).
- A lógica de leitura é a mesma do CRM: partilhar ou duplicar com teste (o `api/` não
  importa de `src/`); decidir na fase 1, preferindo a solução mais simples.

## F. Fora de âmbito

- Pedidos de sinistro: já têm colunas próprias e `detalhes` (`pedidosSinistro.ts`).
  Só alinhar rótulos se o diagnóstico mostrar o mesmo problema.
- Mudar perguntas, passos ou validações do formulário.

## G. Decisões para o utilizador na fase 1

1. Formato B como proposto, ou outra ordem de blocos.
2. Título do bloco com NIF e código postal: "Tomador" ou "Dados para a proposta".
3. O ecrã "Confirme o pedido" do site passa a usar os títulos curtos, ou mantém os do
   formulário.
4. Opção B (coluna `detalhes jsonb` nos leads, como nos sinistros) agora ou nunca:
   mais robusta, mas pede migração e muda `criar_lead_site`.

---

## Fase 1: diagnóstico e proposta (sem código)

Entrega: a lista de rótulos de resumo por ramo (tabela atual / resumo), o exemplo B
para cada ramo, a decisão sobre o leitor partilhado, e as 4 perguntas de G. Pára e
espera resposta.

## Fase 2: implementação (depois de aprovado)

Site (C) e testes; CRM (D) e testes; email (E) e teste. Um projeto de cada vez, com as
verificações de cada um a passar antes do seguinte.

## Antes de declarar concluído

```
[ ] Site: npm run check, npm test, npm run qa, npm run qa:layout
[ ] CRM: npx tsc --noEmit, npx vitest run, npm run build
[ ] Testes com o texto exato por ramo e com um lead no formato antigo
[ ] Testado no browser: um pedido de teste por ramo no site (dev) e a sua leitura
    no CRM (modal, cartão do Kanban), em desktop e 375 px, com teclado
[ ] Lead antigo continua legível no CRM
[ ] Email de aviso revisto em HTML e em texto
[ ] Mensagem nunca passa de 2000 caracteres; respostas nunca são cortadas
[ ] Zero travessões; glossário comum respeitado
[ ] DECISIONS.md com a entrada do formato da mensagem
```
