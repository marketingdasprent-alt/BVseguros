# Refinamento UX/UI do CRM: diagnóstico (fase 1)

> **Estado (01/10/2026): fase 2 aplicada.** Os 11 itens, sem tocar nos ficheiros em
> curso; títulos ficam em Inter; botão "Ler com IA" escondido. Ver "Estado da
> implementação" no fim.

Mesma passagem feita ao site (`../docs/refinamento-ux-ui.md`), agora no CRM. Feita a
01/10/2026, só diagnóstico: nenhum ficheiro do CRM foi alterado. Base: auditoria do
sistema de design (`design:design-system`), do microtexto (`design:ux-copy`) e da
acessibilidade (`design:accessibility-review`) sobre o código. O interior do CRM não
foi visto no browser (precisa de sessão iniciada).

O CRM está em melhor estado do que o tamanho do `index.css` sugere: todos os modais
usam o `Modal`, os estados têm cores coerentes (`lib/tone.ts`), não há CSS morto, o
AO90 é seguido e as confirmações de apagar têm um bom padrão. Os problemas são de
**fonte única**: a mesma cor existe em quatro sítios com valores diferentes, a mesma
peça (input, aviso de erro, filtro segmentado) está copiada à mão, e a mesma ação
tem nomes diferentes.

**Ficheiros com trabalho em curso por commitar** (login, convite sem senha):
`App.tsx`, `hooks/useAuth.tsx`, `lib/supabase.ts`, `lib/acesso.ts`,
`pages/Login.tsx`, `pages/DefinirSenha.tsx`, `pages/Acesso.tsx`, `api/utilizadores.js`,
`supabase/emails/*`. Os achados nesses ficheiros estão listados à parte (secção F).

---

## A. Sistema de cor (crítico)

- Quatro definições que não batem: `tailwind.config.js` (ink `#18283B`, border
  `#DFE5ED`, muted `#667085`), `:root` do `index.css` (ink `#1a2a3d`, border
  `#e1e7ee`, muted `#647184`), e os dois `STYLING-PROMPT`. O `body` usa `var(--ink)` e
  `text-ink` gera outra cor: há dois "pretos" e dois cinzentos de borda.
- 77 hex no `index.css` (56 distintos, só 8 em `:root`), com grupos quase iguais: 6
  navies escuros, 6 cinzentos secundários, 7 tons claros, 4 bordas fortes, 4 bases de
  sombra. Mais 4 hex soltos em `.tsx` (`text-[#72839a]` x3, `hover:bg-[#d92d20]`).
- **Proposta:** `:root` como fonte única; `tailwind.config.js` passa a ler `var(--…)`;
  cada grupo quase igual vira um token (`--navy-ink`, `--muted`, `--tint`,
  `--border-strong`, `--shadow-color`). Corrigir os valores nos `STYLING-PROMPT`.

## B. Tipografia, espaço, raio, sombra (moderado)

- Títulos em **Inter**: decisão do redesign (`STYLING-PROMPT-NOVAS-FUNCIONALIDADES.md`:
  "tudo Inter"), mas o `AGENTS.md` da raiz e o `STYLING-PROMPT.md` dizem Plus Jakarta
  Sans. **Decisão pendente** (ver fim).
- 17 tamanhos de letra no `index.css` e 4 arbitrários nos `.tsx`, contra 6 papéis
  pedidos. Proposta: cerca de 7 tokens (`--fs-meta`, `--fs-body`, …).
- 80 de 184 espaçamentos fora da grelha de 4 px; 13 raios; 6 sombras sem token.
  Proposta: `--radius-sm/md/lg/xl`, `--shadow-1/2/3`, espaçamentos a múltiplos de 4.

## C. Componentes copiados à mão (moderado, mecânico)

| Peça | Situação | Proposta |
|---|---|---|
| Input | classe copiada 18 vezes apesar de `CLASSE_INPUT`; 2 labels com asterisco sem `aria-hidden` | usar `Campo`/`CLASSE_INPUT` |
| Erro de carregamento | o mesmo `<p role="alert" …bg-danger-bg…>` em 8 páginas, 6 sem "Tentar novamente" | `<ErroCarregar entidade erro onRetry />` |
| Aviso | `Notice` só tem `neutral/info/danger`; avisos de sucesso e alerta feitos à mão | juntar `success` e `warning` |
| Filtro segmentado | padrão repetido 7 vezes; `GrupoModal` usa `aria-pressed` em botões de ação | `ui/Segmented` |
| Botão | `ErrorBoundary` recria o primário à mão | usar `Button` |
| Pill | `Sinistros.tsx:104` ad hoc | `Badge` |

## D. Acessibilidade (moderado)

| Critério | Onde | Correção |
|---|---|---|
| 2.4.7 / 1.4.11 Foco visível | Menu de ações das linhas: foco só com `--surface-soft` (1.05:1); inputs com `ring-navy/30` (≈1.7:1) | Um token `--focus` (navy, 3:1+) e outline de 2 px em todo o lado |
| Consistência do foco | 3 anéis diferentes (`#3570b3`, `ring-navy`, `#b6d9ff`) | O mesmo token |
| 1.4.3 Contraste | `--muted` sobre a coluna do Kanban: 4.37:1 | Escurecer `--muted` meio tom |
| Asteriscos obrigatórios | `text-danger` (3.76:1) | `text-danger-text` |
| Alvos de toque | `card-actions` 28 px, `.segmented` 32 px | 44 px em ponteiro grosso, como no site |

## E. Microtexto (`design:ux-copy`)

**Erros técnicos em bruto (o mais grave):** 15 ecrãs mostram `error.message` do
Supabase ou da rede ("Failed to fetch", "JWT expired"). Proposta: passar por
`mensagemErro()` e mostrar "Não foi possível carregar os X. Verifique a ligação e
tente novamente." com "Tentar novamente" (junta com o `ErroCarregar` de C).

**Glossário do CRM** (alinhado com o do site):

| Conceito | Termo | Deixa de se usar |
|---|---|---|
| Remover | **Apagar** | Excluir (6, soa a PT-BR) |
| Criar registo / editar | **Criar X** / **Guardar alterações** | "Guardar cliente", "Guardar apólice", "Adicionar" |
| Novo utilizador | **Novo utilizador** | Adicionar utilizador |
| Proposta | **Proposta** | Simulação ("Simulações e propostas", "nova simulação") |
| Pessoa atribuída / perfil | **Responsável** / **mediador** | |
| Pedidos que vêm do site | **Pedidos de proposta do site** / **Pedidos de sinistro do site** | "Pedidos do site" para as duas coisas |
| Renovação contactada | **Contactada** (estado, botão e toast) | Contactado |
| Ramo "outros" | **Outros seguros** (como no site) | Outro |
| Campo do ramo | **Ramo** | Seguro (no pedido de sinistro) |
| Título de erro | **Não foi possível X** | Erro ao X (cerca de 25) |
| Toast de sucesso | **Cliente criado** | "… com sucesso" (6) |

Outras reescritas: "Erro inesperado." passa a "Ocorreu um erro. Tente novamente.";
"Este registo já existe (valor duplicado)." passa a "Já existe um registo com estes
dados."; o estado vazio de Clientes ("Clientes convertidos de leads aparecem aqui",
incorreto) passa a "Crie um cliente em Novo cliente ou importe a carteira."; Apólices
vazias ganham a ação; "Guardar" genérico em Atribuir/Mudar grupo passa a "Atribuir" /
"Mudar grupo"; "Cancelar" na importação (que recomeça) passa a "Recomeçar"; títulos
de renovar alinhados em "Marcar como renovada".

**Travessão (proibido no projeto):** cerca de 20 células vazias mostram o travessão longo (U+2014), e há 2
frases com ele (`ErrorBoundary`, `erros.ts`). Proposta: uma constante partilhada
para célula vazia ("Sem dados") e reescrever as duas frases.

## F. Ficheiros em curso (só registo)

- `Login.tsx`: "Palavra-passe" ao lado de "Esqueci a senha" (o CRM usa "senha" em 145
  sítios); "Voltar ao login"; "Bem-vindo de volta" assume o masculino; erros do
  Supabase em inglês; toggle de senha duplicado do `CampoSenha`.
- `DefinirSenha.tsx` / `Acesso.tsx`: cartão diferente do `.auth-form`; "Nova senha"
  vs "senha nova"; link-botão duplicado.
- `App.tsx`: `profileError` em bruto.
- Emails: "Foi convidado" assume o masculino; "senha nova"/"nova senha" alternados.

## Nota solta

`Importar.tsx:132` ainda mostra o botão "Ler com IA". A integração com IA foi posta de
lado a 01/10 (o Thiago não a achou útil).

---

## Lista priorizada (para aprovação)

| # | Alteração | Tipo | Esforço |
|---|---|---|---|
| 1 | Erros de carregamento: mensagem em PT + "Tentar novamente" (`ErroCarregar`) | rápido | P |
| 2 | Glossário E aplicado (Apagar, Criar/Guardar alterações, Proposta, Pedidos de … do site, Contactada, Outros seguros, Não foi possível X, sem "com sucesso") | rápido | M |
| 3 | Reescritas de mensagens, estados vazios e botões genéricos | rápido | P |
| 4 | Travessão fora da interface (constante de célula vazia + 2 frases) | rápido | P |
| 5 | Foco visível: token `--focus` único, menu de linha e inputs a 3:1 | rápido | P |
| 6 | Contraste do `--muted` e dos asteriscos | rápido | P |
| 7 | Fonte única de cor (`:root` → `tailwind.config.js`), fundir os quase iguais | estrutural | M |
| 8 | `Notice` com `success`/`warning`; `ui/Segmented`; `CLASSE_INPUT` nas 18 cópias; `Badge` e `Button` nos dois casos ad hoc | estrutural | M |
| 9 | Escalas de tamanho de letra, raio e sombra em tokens; espaçamentos à grelha de 4 px | estrutural | G |
| 10 | Alvos de toque de 44 px em ponteiro grosso | rápido | P |
| 11 | Atualizar `STYLING-PROMPT*.md` e o `AGENTS.md` da raiz para os valores reais | rápido | P |

## Decisões pendentes

1. **Ficheiros em curso** (login, convite): mexer já neles ou esperar que esse
   trabalho seja commitado.
2. **Tipografia dos títulos:** manter Inter (decisão do redesign, corrigir a
   documentação) ou passar para Plus Jakarta Sans como o site.
3. **Botão "Ler com IA"** na importação: esconder ou manter.

---

## Estado da implementação (fase 2, 01/10/2026)

| # | Estado | Nota |
|---|---|---|
| 1 | ✅ | `ui/ErroCarregar` em 15 ecrãs: texto em PT, "Tentar novamente" em todos, erro técnico só na consola |
| 2 | ✅ | Apagar, Criar/Guardar alterações, Novo utilizador, Proposta, pedidos de proposta/sinistro do site, Contactada, Outros seguros, Ramo; 29 títulos "Não foi possível X"; 6 toasts sem "com sucesso" |
| 3 | ✅ | `erros.ts`, estados vazios de Clientes e Apólices, botões Atribuir / Mudar grupo / Marcar renovada / Editar / Converter em cliente / Recomeçar |
| 4 | ✅ | `SEM_VALOR` (`lib/format.ts`, traço curto) nas células vazias; 2 frases e 3 comentários sem travessão |
| 5 | ✅ | `--focus` único (navy, 10:1); inputs com borda + anel navy; menu de linha com outline de 2 px |
| 6 | ✅ | `--muted` passa a `#5f6b7e` (4.8:1 sobre o Kanban); asteriscos em `danger-text` com `aria-hidden`; botão `danger` passa a `danger-text` de fundo (o vermelho anterior dava 3.8:1 com texto branco) |
| 7 | ✅ | Todas as cores no `:root`; `tailwind.config.js` lê as variáveis; zero hex fora do `:root` |
| 8 | ✅ | `Notice` com `success`/`warning`; `ui/Segmented` em 7 sítios (o grupo de ações rápidas deixou de ter `aria-pressed`); `CLASSE_INPUT` nas 15 cópias; `Badge` e `Button` nos dois casos ad hoc |
| 9 | ✅ parcial | Tokens `--fs-*`, `--radius-*`, `--shadow-*` e `text-meta/small/body/panel`; juntos só valores a 1 px uns dos outros. Os espaçamentos de 10/14/18/22 px ficam: são a referência documentada do redesign. A barra lateral não foi mexida (está medida para caber sem scroll) |
| 10 | ✅ | 44 px em ponteiro grosso (icon-button, segmentados, ações de cartão, menu de linha) |
| 11 | ✅ | `STYLING-PROMPT-NOVAS-FUNCIONALIDADES.md` com os valores reais; `STYLING-PROMPT.md` marcado como histórico; `AGENTS.md` da raiz corrigido (Inter no CRM) |

**Verificado no browser (01/10/2026, com sessão iniciada, só leitura):** Dashboard,
Leads, Clientes, Apólices, Propostas, Renovações, Sinistros e pedidos do site,
Utilizadores, Grupos, Seguradoras e Importar, em desktop e a 375 px; sem erros na
consola e sem scroll horizontal. Foco confirmado com teclado: anel navy de 2 px nos
campos, contorno de 2 px no menu das linhas; 44 px em ecrã tátil. Corrigido na
revisão: coluna "Seguro" na tabela de pedidos passa a "Ramo"; o nome na coluna fixa de
Utilizadores partia-se a meio da palavra (`overflow-wrap: anywhere` passa a
`break-word`); o foco dos campos ficava só com 1 px (a regra base do input ganhava em
especificidade) e passa a anel de 2 px; a descrição da Importação deixou de falar em
PDF e imagem.

**Fica para os ficheiros em curso** (secção F): `Login.tsx`, `DefinirSenha.tsx`,
`Acesso.tsx`, `App.tsx`, `api/utilizadores.js` e emails. Em particular, as mensagens de
`api/utilizadores.js` ainda dizem "excluir"/"excluída"; alinhar com "apagar" quando esse
trabalho for commitado. Na importação, a leitura com IA está desligada por completo
(`IA_ATIVA = false` em `pages/Importar.tsx`): só se aceitam CSV no modelo. O código da IA
fica; voltar a `true` reativa PDF, imagem e texto.
