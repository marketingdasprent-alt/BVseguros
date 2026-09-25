# CRM BV Seguros: prompt de estilização das funcionalidades novas

> Para usar numa sessão (ou agente) dedicada só a estilo, antes do próximo commit.
> Objetivo: tudo o que foi acrescentado em 24 e 25/09/2026 passa a parecer desenhado
> pela mesma pessoa que fez o resto do CRM. Não é para redesenhar o CRM: o padrão
> atual é a referência e **não muda**.
>
> O `STYLING-PROMPT.md` que existe é anterior ao redesign (fala em Plus Jakarta Sans
> e em componentes que já foram criados). A fonte de verdade é o código:
> `src/index.css` e `tailwind.config.js`. Este documento resume-os abaixo.

---

## 1. Regras de trabalho

1. **Ler primeiro** `src/index.css` inteiro e um ecrã "antigo" de referência
   (`pages/Dashboard.tsx` e `components/crm/DashboardActivity.tsx`), e só depois mexer.
2. **Só estilo e marcação.** Não mudar lógica, hooks, chamadas ao Supabase, nomes de
   props nem comportamento. Se uma melhoria visual pedir mudança de comportamento
   (ex.: menu de ações), fazer o mínimo e manter as mesmas funções `on*`.
3. **Classes do sistema antes de utilitários soltos.** Quando o mesmo conjunto de
   utilitários Tailwind aparece em 2 ou mais sítios, passa a ser uma classe em
   `@layer components` do `index.css` (é assim que o resto do CRM está feito:
   `.panel`, `.crm-table`, `.kanban-card`, `.crm-modal`, ...).
4. **Sem cores, raios ou sombras novos.** Usar só os tokens da secção 2. Se faltar
   algum, parar e justificar antes de o criar.
5. **PT-PT e um só registo** em todo o texto visível (ver secção 6).
6. No fim: `npm run typecheck`, `npm test`, `npm run build` e revisão no browser em
   desktop (1440px), tablet (768px) e telemóvel (375px), com teclado.

---

## 2. O sistema atual (referência, não mudar)

**Cor** (`:root` em `index.css` + `tailwind.config.js`)

| Token | Valor | Uso |
| --- | --- | --- |
| `--canvas` / `bg-sand` | `#f4f6f9` / `#F5F7FA` | fundo da aplicação |
| `--surface` | `#fff` | painéis, cartões, modais |
| `--surface-soft` | `#f8fafc` | cabeçalho de tabela, hover suave, inputs desativados |
| `--ink` / `text-ink` | `#1a2a3d` | texto |
| `--muted` / `text-muted` | `#647184` | texto secundário, meta |
| `--border` / `border-border` | `#e1e7ee` | todas as bordas e divisórias |
| `--navy` / `bg-navy` | `#184070` | ação primária, links, destaque |
| `--sidebar` | `#112b49` | barra lateral |
| `success/warning/danger/info` + `-bg`/`-text` | ver `tailwind.config.js` | só para estado (badges, avisos) |

**Forma**
- Painéis e tabelas: `border 1px var(--border)`, `border-radius: 12px`, sem sombra.
- Cartões de Kanban: `9px`, sombra `0 2px 4px -2px #18283b25`, sem borda.
- Modais: `14px`, sombra `0 24px 70px -20px #0b203c66`, largura máx. `460px`.
- Inputs: altura mínima `42px`, `border-radius: 8px` (`rounded-lg`).
- Botões: componente `Button` (`primary | secondary | ghost | destructive`, `sm | md`).
- Badges: componente `Badge` (`tone`), sempre `rounded-full text-xs font-medium`.

**Tipografia** (tudo Inter; hierarquia por tamanho, peso e `letter-spacing` negativo)
- h1 de página `29px/600/-.035em`; h2 de painel `15px/600/-.015em`;
  título de modal `18px/600/-.025em`; corpo de tabela `13px`;
  cabeçalho de tabela `10px`, maiúsculas, `.065em`; meta `11px text-muted`.
- Números: `font-variant-numeric: tabular-nums`.

**Espaço**
- Cabeçalho de painel `22px 24px`; cabeçalho de tabela `18px 22px`; célula `18px 22px`;
  conteúdo de modal `24px` (`20px` em telemóvel); linhas de lista `17px 24px`.
- Entre blocos de página: `space-y-6`.

**Movimento**: `150ms ease` para cor/borda, `var(--ease-out)` para entradas;
nunca `transition-all`; `prefers-reduced-motion` já é respeitado globalmente.

**Padrões de lista** a reutilizar: `.activity-row` (ícone + `strong` + `small`) e
`.priority-row` (ícone, texto, número à direita, hover `--surface-soft`).

---

## 3. Componentes novos a criar no sistema

Criar em `@layer components` (e, quando fizer sentido, um componente React fino em
`components/ui/`). Cada um substitui estilos soltos que hoje estão repetidos.

### 3.1 `.segmented` (filtro "Todos / Os meus / Sem responsável")
Hoje: utilitários soltos em `FiltroResponsavel.tsx`.
- Contentor: `inline-flex`, `padding: 3px`, `border 1px var(--border)`,
  `border-radius: 9px`, fundo `--surface`.
- Opção: `min-height: 32px`, `padding: 0 12px`, `12px/500`, `color: var(--muted)`,
  `border-radius: 7px`, transição de cor 150ms.
- Ativa (`[aria-pressed=true]`): fundo `#e8eff7`, texto `#173f6a`, `600`
  (o mesmo par de cores do item ativo da barra lateral, `.nav-item.is-active`).
  **Não** usar `bg-navy` cheio: é peso visual de botão primário.
- Em Leads, colocar o filtro **dentro** da `.kanban-toolbar`, à direita, em vez de
  numa linha própria por cima do quadro. Em Clientes, na mesma linha da pesquisa,
  com a pesquisa a ocupar o espaço que sobra.

### 3.2 `.notice` (caixas de aviso dentro de modais e páginas)
Hoje: `rounded-lg bg-sand p-3`, `bg-danger-bg p-3`, `bg-danger-bg p-4` misturados.
- Base: `display: flex; gap: 10px; padding: 12px 14px; border-radius: 10px;
  font-size: 13px; line-height: 1.6;` com ícone `lucide` de 16px à esquerda.
- Variantes: `.notice--neutral` (fundo `--surface-soft`, borda `--border`),
  `.notice--info` (`info-bg`/`info-text`), `.notice--danger` (`danger-bg`/`danger-text`).
- Usar em: mensagem do site no lead (neutral, ícone `MessageSquare`), aviso da
  conversão (info, `UserCheck`), aviso de cascata ao apagar (danger, `AlertTriangle`),
  aviso "renovação já concluída" (neutral, `CheckCircle2`), erros de carregamento
  das páginas (danger, com `role="alert"`).

### 3.3 `.card-actions` (ações no rodapé dos cartões do Kanban)
Hoje: `CLASSE_ACAO_CARTAO` com sublinhado, e um `border-t` solto.
- Rodapé: `display:flex; align-items:center; justify-content:space-between;
  gap: 8px; margin-top: 12px; padding-top: 10px; border-top: 1px solid #edf1f5;`
  (mesmo tom das divisórias de `.priority-row`).
- Ações: estilo de `.text-link` (navy, `12px/600`, sem sublinhado em repouso,
  sublinhado só em hover), área de toque mínima de `28px` de altura.
- Responsável: mini avatar com iniciais (`20px`, `border-radius: 50%`,
  fundo `#e8eff7`, texto `#173f6a`, `9px/600`) + nome em `11px text-muted`.
  "Sem responsável" sem avatar, só em `11px text-muted` (sem itálico).
- Manter `semArrasto` nos botões (não pode voltar a iniciar arrasto).

### 3.4 `RowActions` (menu de ações nas linhas das tabelas)
Hoje: Utilizadores tem até 5 botões por linha; Clientes, Apólices e Atividades têm
um "Editar" solto no fim; Renovações tem 3.
- Regra: **no máximo 1 ação visível por linha** (a mais frequente) + um botão
  `icon-button` com `MoreHorizontal` que abre um menu com as restantes.
- Menu: painel `--surface`, `border 1px var(--border)`, `border-radius: 10px`,
  sombra do modal em versão leve (`0 12px 32px -12px #0b203c40`), `padding: 4px`,
  itens `min-height: 36px`, `13px`, `padding: 0 12px`, `border-radius: 7px`,
  hover `--surface-soft`; itens destrutivos em `danger-text`, separados por uma
  divisória `--border`.
- Acessível: `button[aria-haspopup=menu][aria-expanded]`, `role="menu"`/`menuitem`,
  setas para navegar, `Esc` fecha e devolve o foco ao botão. Sem biblioteca nova se
  der para fazer em menos de ~80 linhas; se não der, discutir antes.
- Distribuição:
  - Utilizadores: visível "Reenviar convite" quando há convite pendente, senão nada;
    no menu: Editar nome, Dar/Retirar acesso, Tornar administrador/mediador,
    uma divisória, e por fim Excluir.
  - Clientes / Apólices / Atividades: visível "Editar"; menu só se houver mais ações.
  - Renovações: visível a próxima ação lógica ("Marcar contactado" se pendente,
    "Marcar renovada" se contactado); no menu: a outra + "Editar".

### 3.5 `.crm-modal--wide`
Hoje: o formulário de editar apólice e o de atividade têm 7 a 8 campos em duas
colunas dentro de 460px, o que fica apertado.
- `max-width: 640px` para formulários com mais de 5 campos (apólice, atividade,
  cliente). Os de 1 a 5 campos continuam em 460px.
- Grelha interna `grid gap-5 sm:grid-cols-2`; campos longos (notas, morada,
  descrição) ocupam as duas colunas (`sm:col-span-2`).

---

## 4. Funcionalidade a funcionalidade

### 4.1 Formulários de edição (lead, cliente, apólice, proposta, sinistro, atividade, renovação)
- **Contexto no topo**: a linha "Apólice X · Cliente" / "Lead: Maria Silva" passa a
  um bloco de contexto consistente: `12px text-muted` para o rótulo, `13px/600 text-ink`
  para o valor, separado do formulário por `border-bottom 1px var(--border)` e
  `padding-bottom: 16px`. Igual em todos os modais que têm contexto.
- **Textareas**: `min-height: 88px` (o mínimo global de 42px é para inputs), `resize: vertical`.
- **Rodapé** (`RodapeFormulario`): separar do conteúdo com `border-top 1px var(--border)`,
  `padding-top: 20px`, `margin-top: 4px`. Botões à direita; "Apagar" à esquerda como
  `ghost` com texto `danger-text` e ícone `Trash2` (hoje é `destructive` com borda,
  compete com "Guardar"). Em telemóvel: "Guardar" em largura total no topo, "Cancelar"
  por baixo, "Apagar" por último.
- **Campos obrigatórios**: manter o asterisco `text-danger`, mas o `*` fica `ml-0.5`
  e `aria-hidden`, com `required` no input (já está).
- **Botão "Converter em cliente"** dentro de "Editar lead": passar de botão
  `secondary` de largura total para uma linha de ação discreta acima do rodapé:
  `.notice--info` curta ("Este lead está pronto a passar a cliente?") com o botão
  `secondary sm` à direita.

### 4.2 Converter lead em cliente
- O aviso vai para `.notice--info` (ícone `UserCheck`).
- "Marcar só como convertido" deixa de ser um link inline no meio do texto: passa a
  `Button variant="ghost" size="sm"` no rodapé, à esquerda (onde fica o "Apagar"
  nos outros modais).
- Título "Converter em cliente" com o nome do lead como subtítulo (`13px text-muted`).

### 4.3 Apagar (confirmação)
- Título do modal no infinitivo e coerente com o botão: **"Apagar cliente"** →
  botão **"Apagar cliente"** (não só "Apagar"). Para contas: **"Excluir conta"** →
  botão **"Excluir conta"** (hoje o título diz "Apagar utilizador" e o botão da
  tabela diz "Excluir").
- Nome do registo em `600`, aviso de cascata em `.notice--danger`.
- Botão de confirmação `destructive` **cheio** (`bg-danger text-white`,
  hover `#d92d20`), único sítio onde o vermelho cheio aparece. Acrescentar essa
  variante ao `Button` como `variant="danger"` em vez de estilo inline.
- Foco inicial no **Cancelar** (evitar confirmar com Enter por engano).

### 4.4 Leads (cartão, responsável, notas)
- Aplicar `.card-actions` (3.3).
- Notas no cartão: `12px text-ink`, `line-clamp-2`, precedidas de ícone
  `StickyNote` 12px `text-muted`, para se distinguir da mensagem do site (que fica
  entre aspas, `text-muted`).
- Ordem fixa no cartão: nome → telefone → badges → mensagem do site → notas → rodapé.

### 4.5 Atribuir responsável (modal)
- Lista de pessoas em vez de `<select>`: opções como `radio` estilizado em linhas de
  `44px`, cada uma com mini avatar (3.3) + nome; a atual marcada com `Check` navy.
  Primeira opção "Sem responsável". Se a lista passar de 8 pessoas, voltar ao `<select>`.

### 4.6 Clientes (coluna Responsável)
- Mini avatar + nome (3.3). "Atribuir"/"Assumir" como `.text-link` ao lado, só em
  hover da linha em desktop (`opacity` 0 → 1 em 150ms) e sempre visível em ecrãs táteis
  (`@media (hover: none)`).

### 4.7 Renovações
- Notas por baixo do estado: `11px text-muted`, `max-width: 240px`, uma linha com
  reticências e `title` com o texto completo (já tem `title`; afinar tamanhos).
- Ações segundo 3.4.
- Modal "Editar renovação": contexto (4.1) e `.notice--neutral` quando já está renovada.

### 4.8 Utilizadores
- Ações segundo 3.4.
- Coluna **Estado**: os dois badges ("Ativa" + "Convite pendente") com `gap-1.5`, e
  "Convite pendente" com ícone `Mail` 12px dentro do badge.
- Coluna **Último acesso**: `12px tabular-nums text-muted`; "Nunca entrou" em
  `text-muted` com ícone `Clock` 12px. Datas de hoje como "Hoje, 05:49"; de ontem
  "Ontem, 18:02"; as restantes `dd/mm/aa, hh:mm` (criar `formatarUltimoAcesso` em
  `lib/format.ts` com teste).
- Linha "(a sua conta)": passar a um badge `neutral` "Você" ao lado do nome.
- Texto de ajuda por baixo do cabeçalho: vai para a `page-description` do
  `PageHeader` em vez de um parágrafo solto.
- Quando a API de contas não está configurada (sem service-role key): mostrar uma
  `.notice--neutral` discreta por cima da tabela ("Convites e último acesso
  indisponíveis: falta configurar a chave do servidor.") em vez de colunas com "—".

### 4.9 Histórico de acessos
- Usar o padrão `.activity-row` do Dashboard: ícone por tipo à esquerda (16px,
  `#72839a`), frase em `13px` com os nomes em `500`, data em `small` por baixo.
  Ícones: `UserPlus` convidou, `ShieldCheck` deu acesso, `ShieldOff` retirou,
  `Crown` tornou administrador, `User` tornou mediador, `PenLine` mudou o nome,
  `UserX` excluiu.
- Cabeçalho do painel com `.panel-heading` sem classes extra no `h2` (hoje tem
  `font-display text-base text-navy`, que foge ao padrão `15px/600 ink`), e um `p` de
  descrição: "Últimas 20 alterações de acesso."
- Datas relativas iguais às de "Último acesso".

### 4.10 Convidar utilizador (modal)
- Texto de apoio em `.notice--info` com ícone `Mail`.
- Depois de enviar: em vez de fechar logo, mostrar no próprio modal um estado de
  sucesso (ícone `MailCheck` 32px navy, "Convite enviado para x@y.pt", botões
  "Convidar outra pessoa" e "Fechar"). Mantém o toast.

### 4.11 Editar nome
- Mostrar o email como contexto (4.1). Contador discreto `11px text-muted` à direita
  do rótulo quando faltarem menos de 20 caracteres para o limite.

---

## 5. Estados (todos os ecrãs novos)

- **A carregar**: o `Spinner` atual, centrado no espaço do conteúdo que vai aparecer,
  com a mesma altura mínima do estado vazio (evita saltos).
- **Vazio**: `EmptyState` com ícone próprio (Histórico `History`, Renovações
  `CalendarClock`) e, quando houver ação óbvia, `action` (ex.: Renovações → "Ver apólices").
- **Erro**: `.notice--danger` com `role="alert"` e botão "Tentar novamente".
- **A guardar**: botão com `loading` (já existe); campos `disabled` enquanto guarda.
- **Desativado**: `opacity .5`, `cursor: not-allowed` (já global).

---

## 6. Texto (PT-PT, um só registo)

O CRM mistura "tu" e "você": "Atualiza a página" / "Cria primeiro um cliente" (tu)
e "Inicie sessão" / "Contacte o administrador" (você). **Usar sempre a forma de
cortesia (você) ou impessoal**, que é a da maioria dos ecrãs e a do login:
- "Atualiza a página e tenta novamente." → "Atualize a página e tente novamente."
- "Cria primeiro um cliente para poderes associar..." → "Crie primeiro um cliente
  para poder associar..."
- Rever também `lib/erros.ts`, `hooks/*.ts` (mensagens `CONFLITO:`) e
  `api/utilizadores.js`.

Vocabulário fixo: **Apagar** para registos (lead, cliente, apólice...), **Excluir**
para contas de utilizador, **Guardar alterações** em edição, **Criar X** em criação,
**Cancelar** para fechar sem guardar.

---

## 7. Acessibilidade (mínimos)

- Todo o elemento interativo novo com foco visível (o `:focus-visible` global já dá o
  contorno; não o esconder com `outline-none` sem pôr `ring` equivalente).
- Botões só com ícone (`RowActions`, fechar) com `aria-label`.
- Contraste ≥ 4.5:1 no texto; `text-muted` sobre `--surface-soft` passa, sobre
  `#edf1f6` (colunas do Kanban) confirmar.
- Nada comunicado só por cor: badges têm texto; o menu destrutivo tem ícone.

---

## 8. Critérios de aceitação

- [ ] Nenhum ecrã novo usa cor, raio ou sombra fora da secção 2.
- [ ] `FiltroResponsavel`, avisos, ações de cartão e ações de linha usam as classes
      da secção 3 (sem os utilitários soltos que existiam).
- [ ] Nenhuma linha de tabela tem mais de 1 botão visível + menu.
- [ ] Os 8 modais novos/alterados têm contexto, rodapé e textareas iguais entre si.
- [ ] Título do modal de confirmação = texto do botão de confirmar.
- [ ] Sem "tu" em texto visível do CRM.
- [ ] Telemóvel (375px): nenhum modal com scroll horizontal; tabelas com scroll só
      dentro do painel; menu de ações não sai do ecrã.
- [ ] Teclado: abrir/fechar todos os modais e menus, navegar no menu com setas,
      `Esc` fecha e devolve o foco.
- [ ] `npm run typecheck`, `npm test` e `npm run build` passam.

---

_Ficheiros abrangidos: `FiltroResponsavel`, `AtribuirResponsavelModal`, `LeadCard`,
`PropostaCard`, `SinistroCard`, `KanbanCard`, `NovoLeadModal`, `ConverterLeadModal`,
`ClienteFormModal`, `NovoClienteForm`, `NovoApoliceForm`, `NovaPropostaModal`,
`NovoSinistroModal`, `NovaAtividadeForm`, `EditarRenovacaoModal`, `RenovacoesTable`,
`ClientesTable`, `ApolicesTable`, `AtividadesTable`, `UtilizadoresTable`,
`HistoricoAcessos`, `ConvidarModal`, `EditarNomeModal`, `useConfirmarApagar`,
`ui/Campo` (`RodapeFormulario`), `ui/Button`, `index.css`, `lib/format.ts`,
`lib/erros.ts` e as páginas correspondentes._
