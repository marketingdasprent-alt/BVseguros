# CRM BV Seguros — Prompt de Estilização (nível 10/10)

> Documento de referência para a passagem de estilo completa do CRM
> (`crm/`), antes do próximo commit/PR. Não é um pedido de "deixar bonito";
> é uma especificação executável — cada secção tem valores concretos, não
> adjetivos. Quem for implementar (eu, noutra sessão, ou outro agente) segue
> isto directamente, sem ter de inventar decisões de design pelo caminho.

---

## 0. O que significa "10/10" aqui

Referência de nível: **Linear, Attio, Height, Stripe Dashboard, Notion**.
Não é "colorido" ou "moderno" — é um produto que um mediador de seguros usa
8h/dia. 10/10 significa:

- **Denso mas não apertado.** Mais informação por ecrã do que o site
  institucional (que é decorativo), mas com respiração suficiente para não
  cansar em uso prolongado.
- **Rápido de escanear.** Estado de um registo (lead, apólice, sinistro)
  reconhecível pela cor/forma antes de ler o texto.
- **Sem ruído.** Zero elementos decorativos gratuitos. Cada sombra, cada
  borda, cada cor tem uma função (hierarquia, estado, ou interatividade).
- **Consistente ao milímetro.** O mesmo espaçamento, o mesmo raio de borda,
  a mesma duração de transição, em todo o lado. Inconsistência de 2px é o
  que separa 6/10 de 10/10.
- **Estados sempre desenhados.** Loading, empty, error e populated têm de
  ter o mesmo cuidado visual — não só o "caminho feliz".

O que **não** é: não precisa de dark mode, não precisa de animações
elaboradas, não precisa de ilustrações custom. Polimento vem de disciplina
de sistema, não de mais elementos.

---

## 1. Fundação de marca (herdada, não negociável)

Já definido em `tailwind.config.js` — manter, não recriar:

```
navy       #184070   — marca, ações primárias, texto de destaque
navy-dark  #0F2C4E   — hover/active de navy, texto sobre navy claro
sand       #F5F6F8   — fundo da aplicação
ink        #101828   — texto
```

Tipografia já configurada: `font-display` = Plus Jakarta Sans (títulos),
`font-sans`/default = Inter (corpo). Ambas já usadas — manter.

Estas cores vêm do site institucional (`../src/styles/tokens.css`, marca
BV Seguros). O CRM é uma ferramenta interna, não precisa da mesma
personalidade "cara ao cliente", mas a cor de marca (navy) tem de ser
reconhecível entre os dois produtos.

---

## 2. Sistema de cor — expandir para semântica de estado

O problema atual: 4 cores não chegam para um CRM com 8 entidades e ~30
valores de `estado` distintos. Adicionar ao `tailwind.config.js`:

```js
colors: {
  navy: '#184070',
  'navy-dark': '#0F2C4E',
  sand: '#F5F6F8',
  ink: '#101828',

  // NOVO — escala neutra formal (hoje é tudo ink/5, ink/10... ad hoc)
  border: '#E4E7EC',      // bordas de card, input, tabela
  'border-strong': '#D0D5DD', // bordas com mais contraste (hover, focus adjacente)
  muted: '#667085',       // texto secundário (hoje é ink/50 — trocar por token nomeado)

  // NOVO — semântica de estado (usar para TODOS os badges/pills)
  success: { DEFAULT: '#12B76A', bg: '#ECFDF3', text: '#027A48' },
  warning: { DEFAULT: '#F79009', bg: '#FFFAEB', text: '#B54708' },
  danger:  { DEFAULT: '#F04438', bg: '#FEF3F2', text: '#B42318' },
  info:    { DEFAULT: '#2E90FA', bg: '#EFF8FF', text: '#175CD3' },
}
```

### Mapeamento estado → cor (obrigatório, usar em TODOS os badges)

| Domínio | Estado | Cor |
|---|---|---|
| Leads | novo | `info` |
| Leads | contactado | `warning` |
| Leads | proposta_enviada | `warning` |
| Leads | convertido | `success` |
| Leads | perdido | `danger` |
| Propostas | rascunho | neutro (`border`/`muted`) |
| Propostas | enviada | `info` |
| Propostas | aceite | `success` |
| Propostas | rejeitada | `danger` |
| Apólices | ativa | `success` |
| Apólices | pendente | `warning` |
| Apólices | cancelada / expirada | `danger` |
| Renovações | pendente | neutro |
| Renovações | contactado | `warning` |
| Renovações | renovada | `success` |
| Renovações | não renovada | `danger` |
| Sinistros | participado | `info` |
| Sinistros | em_analise | `warning` |
| Sinistros | aprovado / pago | `success` |
| Sinistros | recusado | `danger` |
| Atividades | tarefa atrasada | `danger` (só o texto da data, não o card todo) |

Urgência de renovação (já implementado com `text-red-600`/`text-amber-600`
em `RenovacoesTable.tsx`) passa a usar `danger`/`warning` dos tokens acima
— consolidar, não inventar um terceiro sistema de vermelho/âmbar.

---

## 3. Tipografia — escala fechada

Parar de usar `text-sm`/`text-xs`/`text-2xl` soltos sem critério. Escala
fixa (Tailwind já suporta, só disciplinar o uso):

| Uso | Classe | Peso |
|---|---|---|
| Título de página (h1) | `text-2xl font-display font-bold` | 700 |
| Título de secção/card (h2) | `text-base font-display font-semibold` | 600 |
| Label de campo/coluna | `text-xs font-medium uppercase tracking-wide text-muted` | 500 |
| Corpo | `text-sm` | 400 |
| Valor de KPI | `text-3xl font-display font-bold` | 700 (hoje é `text-2xl` — subir) |
| Caption/meta (datas, contagens) | `text-xs text-muted` | 400 |

Regra: nunca dois tamanhos de fonte na mesma linha de informação sem
motivo semântico (ex.: label pequeno + valor grande é ok; dois valores
irmãos com tamanhos diferentes não é).

---

## 4. Espaçamento e grid — unidade base 4px

Tailwind já usa isto nativamente; a disciplina é **nunca usar valores
fora da escala** (`p-[13px]` nunca, `p-3`/`p-4` sempre).

- Padding interno de card: `p-5` (hoje varia entre `p-3`, `p-4`, `p-5`, `p-6`
  — fixar `p-5` para cards de conteúdo, `p-6` só para modais).
- Gap entre cards/KPIs: `gap-4`.
- Gap entre secções verticais de página: `space-y-6` (já usado — manter).
- Padding da área de conteúdo (`<main>` em `Layout.tsx`): manter `p-8`.
- Colunas Kanban: `min-w-[260px]` (hoje `220px` — um pouco apertado para
  cards com badge + valor).

---

## 5. Elevação, bordas, raio

```
Cards de conteúdo:   rounded-xl (12px), shadow-sm, border border-border
Inputs/selects:      rounded-lg (8px), border border-border
Botões:               rounded-lg (8px)
Badges/pills:         rounded-full
Modais:                rounded-2xl (16px), shadow-lg
Kanban cards:          rounded-lg (8px), shadow-sm, border border-border
```

Regra nova: **cards de conteúdo passam a ter `border border-border` além
da sombra** (hoje só têm `shadow-sm`, o que fica frágil sobre o fundo
`sand` claro — a borda dá definição sem escurecer a sombra).

Hover em elementos clicáveis (linhas de tabela, kanban cards, botões
secundários): `transition-shadow duration-150` + subir para `shadow-md`
ou `border-border-strong`. Nunca instantâneo, nunca > 200ms.

---

## 6. Iconografia — introduzir `lucide-react`

O `AGENTS.md` do CRM já pressupõe isto (o exemplo de código na secção 4
usa `Loader2` de `lucide-react`), mas a dependência nunca foi instalada —
hoje há um `Spinner.tsx` feito à mão e **zero ícones em qualquer lado**
(nav sem ícones, botões sem ícones, badges sem ícones). Isto é o maior
gap entre "funcional" e "10/10": SaaS de referência nunca tem nav de texto
puro.

```bash
npm install lucide-react
```

Uso obrigatório:
- **Sidebar nav** (`Layout.tsx`): ícone antes de cada label — `LayoutDashboard`,
  `Users` (Leads), `FileText` (Propostas), `Contact` (Clientes), `Shield`
  (Apólices), `RefreshCw` (Renovações), `AlertTriangle` (Sinistros),
  `CheckSquare` (Atividades).
- **Botões primários de criação** (`+ Novo lead`, `+ Nova proposta`, etc.):
  ícone `Plus` antes do texto, substituir o `+` literal.
- **KPIs do Dashboard**: ícone pequeno (20px, `text-muted`) no canto
  superior de cada `CartaoKpi`, coerente com o que representa.
  (`TrendingUp` conversão, `Users` leads, `Shield` apólices, etc.)
- **Empty states**: ícone grande (40px, `text-border-strong`) acima do
  texto — hoje `EmptyState.tsx` é só texto centrado.
  (`Inbox`, `FileX`, `CheckCircle2` conforme o contexto.)
  ícone grande (40–48px), `stroke-width={1.5}`, cor `text-border-strong`.
- **Botões de ação em tabelas** (Renovações: "Marcar contactado"/"Marcar
  renovada"): ícone `Phone`/`RefreshCw` antes do texto em telas ≥ sm.
- **Toast**: ícone `CheckCircle2` (sucesso) / `AlertCircle` (erro) à
  esquerda do texto.

---

## 7. Componentes — especificação por peça

### 7.1 Botão (`Button` — criar componente novo em `components/ui/Button.tsx`)

Hoje cada página reimplementa `<button className="rounded-lg bg-navy...">`
à mão (duplicação real, viola a regra "reutilização antes de criação" do
próprio `AGENTS.md`). Criar um componente único com variantes:

```
variant: 'primary' | 'secondary' | 'ghost' | 'destructive'
size: 'sm' | 'md'
```

- `primary`: `bg-navy text-white hover:bg-navy-dark`
- `secondary`: `border border-border text-ink hover:border-border-strong`
- `ghost`: sem borda/fundo, `text-muted hover:text-ink hover:bg-ink/[0.03]`
- `destructive`: `border border-danger/30 text-danger hover:bg-danger-bg`
- Todos: `disabled:opacity-50 disabled:pointer-events-none`,
  `transition-colors duration-150`, suporte a `icon` (prefix) e
  estado `loading` (troca o ícone/texto por spinner inline, mantém a
  largura do botão estável — nunca "salta" ao carregar).

Migrar **todos** os botões existentes (Leads, Clientes, Apólices,
Propostas, Sinistros, Renovações, Atividades, Login, DefinirSenha) para
este componente. É a maior fonte de inconsistência hoje.

### 7.2 Badge/Pill (`components/ui/Badge.tsx` — novo)

```tsx
<Badge tone="success" | "warning" | "danger" | "info" | "neutral">Ativa</Badge>
```
`px-2.5 py-0.5 rounded-full text-xs font-medium`, fundo = `{tone}-bg`,
texto = `{tone}-text`. Usar a tabela da secção 2 em todo o lado onde hoje
há texto solto a representar um `estado` (tabelas, kanban cards, KPIs).

### 7.3 Card de conteúdo (`components/ui/Card.tsx` — novo)

Wrapper para o padrão repetido `bg-white rounded-xl p-5 shadow-sm border
border-border` que hoje está inline em quase toda página. Um componente,
zero divergência de padding entre páginas.

### 7.4 KPI card (`CartaoKpi` em `Dashboard.tsx`)

Redesenhar:
```
┌─────────────────────────┐
│ [ícone 20px, text-muted] │
│                           │
│ Leads em carteira         │  ← text-xs text-muted
│ 24                         │  ← text-3xl font-display font-bold text-ink
└─────────────────────────┘
```
Adicionar borda (`border border-border`) hoje ausente. Grid do dashboard
passa de `grid-cols-2 md:grid-cols-4` (8 cards em 2 linhas apertadas) para
`grid-cols-2 md:grid-cols-4` mantido, mas considerar `xl:grid-cols-4` fixo
com `gap-4` (não `gap-4` genérico solto — confirmar consistente com §4).

### 7.5 Sidebar (`Layout.tsx`)

- Adicionar ícones (§6).
- Largura: manter `w-60`.
- Item ativo: hoje `bg-white/15` — subir contraste para `bg-white/10`
  + barra vertical de destaque de 3px à esquerda em `bg-white` (padrão
  Linear/Attio de indicar seção ativa sem depender só de opacidade).
- Hover em item inativo: `hover:bg-white/5` (hoje `hover:bg-white/10` —
  reduzir para não competir com o estado ativo).
- Separador visual antes do rodapé (perfil + logout): `border-t
  border-white/10` já existe — manter, mas subir padding para `py-5`.
- **Responsivo**: em `< 768px`, sidebar colapsa para ícones apenas
  (`w-16`, sem labels, `title` attribute para tooltip nativo) — hoje não
  existe nenhum tratamento mobile, a sidebar de `w-60` fixa quebra em
  ecrã pequeno.

### 7.6 Tabelas (`ClientesTable`, `ApolicesTable`, `RenovacoesTable`,
`AtividadesTable`)

- Header: manter `bg-ink/[0.03] text-ink/50` mas trocar `text-ink/50` por
  `text-muted` (token nomeado) e subir para `text-xs font-semibold
  uppercase tracking-wide` (hoje é `font-medium` sem uppercase — headers
  de tabela em produtos de referência são quase sempre uppercase+tracking).
- Linhas: `hover:bg-ink/[0.02]` (hoje sem hover nenhum — tabela estática
  não convida a interação).
- Border entre linhas: manter `border-t border-ink/5`, mas ok trocar para
  `border-border` (token).
- Badges de estado (Apólices, Renovações): usar `Badge` (§7.2) em vez de
  texto solto — **hoje `ApolicesTable` mostra o estado como texto puro
  sem nenhuma cor**, é a maior perda de "escaneabilidade rápida" no CRM
  atual.
- Coluna de ações (Renovações): botões via `Button size="sm"` (§7.1).

### 7.7 Kanban (`KanbanBoard`, `KanbanColumn`, `KanbanCard`, `LeadCard`,
`PropostaCard`, `SinistroCard`)

- Header de coluna: hoje `text-sm font-medium text-ink/70` + contagem em
  `text-xs text-ink/40` solta à direita — trocar a contagem por um badge
  neutro pequeno (`Badge tone="neutral"`) em vez de texto solto, fica
  mais "componente de produto" e menos "número esquecido".
- Barra de destaque no topo de cada coluna, 3px, cor = tom semântico do
  estado daquela coluna (usar a tabela da §2) — ajuda a reconhecer a
  coluna sem ler o header, especialmente em ecrãs largos com 5 colunas
  (Sinistros).
- Card: adicionar `Badge` de ramo/estado onde hoje é `<span>` inline
  manual (`bg-navy/10 text-navy rounded-full px-2 py-0.5` já existe em
  `LeadCard`/`PropostaCard` — está correto na forma, só falta usar o
  componente `Badge` para não duplicar a classe 3x).
- Drag state: hoje `opacity-50` — adicionar também `rotate-1 shadow-lg`
  no card a ser arrastado (o "levantar do papel" que faz drag-and-drop
  parecer físico — padrão Trello/Linear).
- Coluna com `isOver` (drop target ativo): hoje `ring-2 ring-navy/30` —
  manter, mas adicionar `bg-navy/[0.02]` para reforçar visualmente.

### 7.8 Modais (`NovoLeadModal`, `NovaPropostaModal`, `NovoSinistroModal`,
`MarcarRenovadaModal`)

- Overlay: `bg-ink/40` → subir para `bg-ink/50 backdrop-blur-sm` (blur
  sutil no fundo é o que separa modal "10/10" de modal "básico").
- Container: `rounded-2xl` (hoje `rounded-xl` — modais merecem raio maior
  que cards por serem elementos de maior destaque hierárquico).
- Entrada: transição simples `animate-in fade-in zoom-in-95 duration-150`
  (usar utilitário `tailwindcss-animate` se instalado, ou keyframes CSS
  mínimos — não instalar biblioteca de animação pesada para isto).
- Botão de fechar (X) no canto superior direito — **hoje nenhum modal
  tem X, só o botão "Cancelar" no rodapé**. Adicionar, com `Ghost` button
  pequeno.

### 7.9 Toasts (`useToast.tsx`)

- Adicionar ícone (§6) à esquerda do texto.
- Entrada/saída animada (`translate-x` + fade), hoje aparecem/desaparecem
  sem transição.
- Empilhamento: quando há mais de 1, o mais antigo devia encolher/esmaecer
  ligeiramente (`opacity-80 scale-[0.98]`) para dar profundidade — hoje
  são blocos iguais empilhados sem hierarquia.

### 7.10 Login / DefinirSenha

- Já têm boa estrutura de card centrado. Elevar: `shadow-lg` (hoje
  `shadow-sm`), fundo da página com gradiente muito sutil
  (`bg-gradient-to-b from-sand to-white`) em vez de `bg-sand` plano.
- Botão de submit: migrar para `Button variant="primary"` com estado
  `loading` nativo do componente.

### 7.11 Empty states (`EmptyState.tsx`)

- Adicionar ícone (§6), `size` grande, `text-border-strong`.
- Considerar CTA opcional (prop `action?: ReactNode`) para os casos onde
  faz sentido (ex.: "Sem leads ainda" podia ter um botão "+ Novo lead"
  embutido no próprio empty state, não só na topbar da página).

---

## 8. Motion — tokens de transição

```
duration-150   — hover de botão, link, linha de tabela
duration-200   — abrir/fechar modal, toast
transition-colors / transition-shadow / transition-transform
  (nunca `transition-all` — é caro e impreciso)
ease padrão do Tailwind (cubic-bezier default) — não customizar easing
```

---

## 9. Acessibilidade — mínimos não negociáveis

- Contraste texto/fundo ≥ 4.5:1 em todo o texto de corpo (os tons
  semânticos da §2 já foram escolhidos para bater isto sobre `bg`/branco).
- `focus-visible:ring-2 focus-visible:ring-navy/40
  focus-visible:ring-offset-2` em **todo** elemento interativo (botões,
  inputs, links de nav, kanban cards) — hoje só inputs têm
  `focus:ring-2`.
- Kanban: `@dnd-kit` já suporta `KeyboardSensor` — configurar em
  `KanbanBoard.tsx` (`sensors: useSensors(useSensor(PointerSensor),
  useSensor(KeyboardSensor))`) para que mover um lead/proposta/sinistro
  entre colunas não dependa só de rato.

---

## 10. Responsividade

Hoje o CRM assume desktop (`w-60` sidebar fixa, grids `md:grid-cols-4`
sem tratamento `<md`). Nível 10/10 mínimo:

- Sidebar colapsável em `<768px` (§7.5).
- Tabelas: `overflow-x-auto` no wrapper (algumas já têm via `Card`,
  confirmar todas) para não quebrar layout em ecrã estreito.
- Kanban: já tem `overflow-x-auto` no board — manter, é o padrão correto
  para Kanban em mobile (scroll horizontal, não colapsar colunas).
- Modais: `max-w-sm` atual funciona em mobile por ser já estreito —
  confirmar `mx-4` de respiro lateral em ecrãs < 400px.

---

## 11. Ordem de execução sugerida

Não faz parte do "prompt" em si, mas evita retrabalho:

1. **Tokens primeiro**: `tailwind.config.js` (cores §2, confirmar
   tipografia §3) — tudo o resto depende disto.
2. **Primitivos de UI**: `Button`, `Badge`, `Card` (§7.1–7.3) — usados por
   todas as páginas a seguir.
3. **Instalar `lucide-react`** e substituir `Spinner.tsx` custom por
   `Loader2` do lucide onde fizer sentido (ou manter Spinner mas com
   ícone — decisão menor).
4. **Layout/Sidebar** (§7.5) — visível em toda navegação, alto impacto.
5. **Dashboard** (§7.4) — primeira coisa que se vê ao entrar.
6. **Tabelas** (§7.6) — Clientes, Apólices, Renovações, Atividades.
7. **Kanban** (§7.7) — Leads, Propostas, Sinistros.
8. **Modais + formulários** (§7.8) — todos os `Novo*Modal`/`Novo*Form`.
9. **Toasts, empty states, Login/DefinirSenha** (§7.9–7.11) — polimento
   final.
10. `npm run typecheck` + `npm run build` + percurso manual completo no
    browser (todas as 8 páginas, todos os estados: loading fictício,
    empty real, populated com dados de teste) antes de considerar
    concluído.

---

_Documento de trabalho — não é DECISIONS.md, não precisa de aprovação
formal para ser editado à medida que a implementação avança._
