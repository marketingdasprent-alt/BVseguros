# AGENTS.md — Guia de Arquitectura e Convenções (CRM)

> **BV Seguros** · CRM de gestão de leads, clientes e apólices

> Stack: React 18 + TypeScript + Vite + Supabase + Tailwind + React Router

> **Âmbito:** este ficheiro rege só a pasta `crm/` (regra do AGENTS.md: o ficheiro
> mais próximo do que estás a editar prevalece). Para o site institucional na raiz
> do repositório, ver o [`AGENTS.md`](../AGENTS.md) da raiz — stack e convenções
> diferentes (HTML/CSS/JS estático, sem build).

Fonte de verdade para developers humanos e agentes IA (Claude, Codex, Cursor, etc.). Em
caso de conflito com o que já existe no código, este documento prevalece — se o código
divergir, é o código que deve ser corrigido para o cumprir, não o contrário.

> Este ficheiro nasceu **antes** do primeiro pedido de "criar o CRM". O stack e as
> convenções abaixo seguem o padrão já usado noutros CRMs da equipa (ver
> `razao-dinamica/crm`), adaptado ao domínio de seguros. Secção 0 lista o que ainda é
> suposição e deve ser confirmado antes de se tornar difícil de mudar.

---

## 0. Premissas assumidas (confirmar antes de crescer)

- **Stack** replicado de `razao-dinamica/crm` por ser o padrão mais recente e testado
  da equipa. Se o projecto tiver requisitos diferentes (app mobile, volume de dados,
  equipa técnica), reavaliar antes de escrever muito código.
- **Sem TanStack Query** — segue o padrão real do `razao-dinamica/crm` (hooks próprios
  + `@supabase/supabase-js` directo), não o exemplo enviado pelo João (que é de outro
  projecto, o WeGest, com stack mais pesada). Adicionar React Query só se a gestão de
  cache manual começar a doer.
- **Vocabulário do domínio** (seguros) ainda não validado com o cliente — ver secção 3.
- **Funcionalidades do CRM** (pipeline de leads, apólices, sinistros, WhatsApp) são
  inferidas do que a equipa já construiu para outros clientes, não de um requisito
  confirmado da BV Seguros.

---

## Índice

1. [Arquitectura em camadas](#1-arquitectura-em-camadas)
2. [Estrutura de ficheiros](#2-estrutura-de-ficheiros)
3. [Nomenclatura e vocabulário do domínio](#3-nomenclatura-e-vocabulário-do-domínio)
4. [Padrão de páginas e componentes](#4-padrão-de-páginas-e-componentes)
5. [Acesso a dados (Supabase)](#5-acesso-a-dados-supabase)
6. [Estado: local vs global vs servidor](#6-estado-local-vs-global-vs-servidor)
7. [Validação de formulários](#7-validação-de-formulários)
8. [Error handling](#8-error-handling)
9. [Tipos TypeScript](#9-tipos-typescript)
10. [UX patterns (3 estados + feedback)](#10-ux-patterns-3-estados--feedback)
11. [Segurança (RLS + variáveis)](#11-segurança-rls--variáveis)
12. [Anti-patterns](#12-anti-patterns)
13. [Tooling](#13-tooling)
14. [Checklist antes de commit](#14-checklist-antes-de-commit)
15. [Regras para agentes IA (Claude, Codex, Cursor, etc.)](#15-regras-para-agentes-ia-claude-codex-cursor-etc)

---

## 1. Arquitectura em camadas

Cada camada só comunica com a imediatamente abaixo.

```
Page (src/pages/*.tsx)              ← compõe layout + componentes + hooks
  └─ Component (src/components/**)  ← UI, props in/out
      └─ Hook (src/hooks/use*.ts)   ← acesso a dados, mutations
          └─ src/lib/supabase.ts    ← cliente Supabase
              └─ Supabase + RLS     ← segurança real
```

**Regras invioláveis:**

- **Páginas** compõem. **Não** fazem queries directas ao Supabase. Indicativo: até
  ~150 linhas.
- **Componentes** recebem dados via props. Acima de ~150 linhas, dividir.
- **Hooks** são o **único** ponto de acesso a dados. Cada domínio tem o seu
  (`useLeads`, `useApolices`, `useClientes`).
- Lógica de negócio (cálculo de comissão, regras de pipeline) vive em `src/lib/`, não
  espalhada por componentes.

---

## 2. Estrutura de ficheiros

```
src/
├── App.tsx, main.tsx
├── pages/                   ← Dashboard, Leads, Clientes, Apolices, Login, ...
├── components/
│   ├── ui/                  ← primitivos reutilizáveis — não específicos do CRM
│   └── crm/                 ← KanbanBoard, LeadSheet, ClienteCard, ApoliceBadge, ...
├── hooks/                   ← useLeads.ts, useAuth.tsx, useToast.tsx, ...
├── lib/
│   ├── supabase.ts          ← cliente Supabase (única instância)
│   ├── types.ts             ← tipos de domínio
│   └── leadActions.ts       ← lógica de negócio pura (transições de estado, etc.)
└── assets/                  ← logo, imagens estáticas
```

### Onde colocar código novo

| Tipo                    | Localização                                     |
| ------------------------ | ------------------------------------------------ |
| Nova página              | `src/pages/NomeDaPagina.tsx` (flat, sem subpastas) |
| Componente de feature    | `src/components/crm/NomeDoComponente.tsx`        |
| Hook de domínio          | `src/hooks/useNomeDoDominio.ts`                  |
| Tipo de domínio          | `src/lib/types.ts`                               |
| Lógica de negócio pura   | `src/lib/nomeDaLogica.ts`                        |
| Lógica Supabase nova     | Hook em `src/hooks/` — **nunca** em page/component |

---

## 3. Nomenclatura e vocabulário do domínio

| Artefacto            | Convenção          | Exemplo               |
| --------------------- | ------------------- | ----------------------- |
| Componente / página   | `PascalCase.tsx`    | `LeadCard.tsx`          |
| Hook de domínio       | `camelCase.ts`      | `useLeads.ts`           |
| Variáveis / funções   | `camelCase`         | `leadAtivo`             |
| Constantes            | `SCREAMING_SNAKE_CASE` | `MAX_TENTATIVAS`     |
| Tipos / interfaces    | `PascalCase`        | `LeadInsert`             |
| Boolean                | `is/has/should/can` | `isLoading`, `hasErro`  |
| Event handlers         | `handle<Evento>`    | `handleSubmit`          |
| Props de handlers      | `on<Evento>`        | `onSubmit`               |

### Vocabulário PT-PT (seguros) — **a confirmar com o cliente**

Termos de domínio propostos, a validar antes de nomear tabelas/colunas em definitivo:

- **lead** — contacto ainda não convertido em cliente
- **cliente** — pessoa singular ou colectiva com pelo menos uma apólice
- **apólice** — contrato de seguro activo
- **proposta** — pedido de simulação/emissão ainda não aceite
- **seguradora** — companhia que emite a apólice (não confundir com a corretora)
- **ramo** — tipo de seguro: `auto`, `vida`, `saude`, `multirriscos`, `acidentes_trabalho`, ...
- **sinistro** — participação de ocorrência sobre uma apólice
- **renovação** — evento de fim de vigência de uma apólice
- **mediador/corretor** — utilizador interno que gere a carteira

**Não misturar** inglês e português para o mesmo conceito (ex.: `policy`/`apólice` no
mesmo ficheiro).

---

## 4. Padrão de páginas e componentes

### Página (compõe, não faz)

```tsx
export default function LeadsPage() {
  const [apenasAbertos, setApenasAbertos] = useState(true);
  const { data, isLoading, error } = useLeads({ apenasAbertos });

  return (
    <Layout>
      <LeadsFiltros apenasAbertos={apenasAbertos} onChange={setApenasAbertos} />
      <KanbanBoard leads={data ?? []} isLoading={isLoading} error={error} />
    </Layout>
  );
}
```

### Componente (3 estados explícitos)

```tsx
interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  onDelete: (id: string) => Promise<void>;
}

export const LeadsTable: React.FC<LeadsTableProps> = ({ leads, isLoading, onDelete }) => {
  if (isLoading) return <Loader2 className="animate-spin" />;
  if (leads.length === 0) return <p>Sem leads registados.</p>;
  return <div>{/* tabela */}</div>;
};
```

**Convenções de código:**

- Path alias `@/*` → `src/*`. **Nunca** `../../../`.
- Named exports preferidos (`export const Foo`). Excepção: páginas podem usar default
  para lazy loading.
- Props sempre tipadas com `interface` explícita.
- Aspas simples (Prettier). JSX attributes com aspas duplas.

**Ordem de imports:** 1) React, 2) externos, 3) `@/*` internos, 4) relativos, 5) tipos.

---

## 5. Acesso a dados (Supabase)

Todo acesso a dados passa por um hook em `src/hooks/`. Sem TanStack Query neste
projecto (ver secção 0) — hooks gerem o próprio `useState`/`useEffect` ou usam
subscrições realtime do Supabase quando fizer sentido (ex.: chat, notificações).

### Hook de leitura

```typescript
export function useLeads(options: { apenasAbertos?: boolean } = {}) {
  const [data, setData] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelado = false;
    setIsLoading(true);
    let q = supabase.from('leads').select('*').order('criado_em', { ascending: false });
    if (options.apenasAbertos) q = q.eq('estado', 'aberto');

    q.then(({ data, error }) => {
      if (cancelado) return;
      if (error) setError(error);
      else setData(data as Lead[]);
      setIsLoading(false);
    });

    return () => {
      cancelado = true;
    };
  }, [options.apenasAbertos]);

  return { data, isLoading, error };
}
```

### Hook de mutation

```typescript
export async function criarLead(lead: LeadInsert) {
  const { data, error } = await supabase.from('leads').insert(lead).select().single();
  if (error) throw error;
  return data;
}
```

**Convenções:**

- `queryFn`/chamada Supabase faz `throw` no erro — o chamador decide o feedback.
- Componentes/páginas invocam a mutation e tratam loading/erro localmente (ver
  secção 10).
- Se o volume de invalidação manual começar a ficar complexo, é sinal para adoptar
  TanStack Query — discutir antes de o fazer, não introduzir a meio de uma feature.

---

## 6. Estado: local vs global vs servidor

| Tipo             | Ferramenta                | Exemplos                        |
| ----------------- | -------------------------- | ---------------------------------- |
| Servidor          | Hooks próprios + Supabase | Leads, clientes, apólices          |
| UI local           | `useState`/`useReducer`   | Modal aberto, tab activa           |
| Formulário         | `react-hook-form` + Zod   | Formulários                        |
| Global (raro)      | Context                   | Auth (`useAuth`)                   |
| URL                | `useSearchParams`         | Filtros partilháveis                |

**Regras:**

- Evitar Contexts novos. Antes de criar, perguntar: "isto pode viver num hook?"
- Form state nunca em Context — `react-hook-form` local.

---

## 7. Validação de formulários

```typescript
export const leadSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').optional(),
  telefone: z.string().min(9, 'Telefone inválido'),
  ramo_interesse: z.enum(['auto', 'vida', 'saude', 'multirriscos', 'acidentes_trabalho']),
});

export type LeadInput = z.infer<typeof leadSchema>;
```

- Schema é fonte de verdade do tipo — derivar com `z.infer`, nunca duplicar.
- Mensagens em PT-PT.
- Validação no client é UX — **não substitui** validação no Supabase (CHECK
  constraints + RLS).

---

## 8. Error handling

```tsx
const handleSubmit = async (dados: LeadInput) => {
  try {
    await criarLead(dados);
    toast({ title: 'Lead criado com sucesso' });
  } catch (error: unknown) {
    const mensagem = error instanceof Error ? error.message : 'Erro inesperado';
    toast({ title: 'Erro', description: mensagem, variant: 'destructive' });
  }
};
```

- **Nunca** silenciar com `catch {}`.
- Reduzir `unknown` → `string` com `error instanceof Error ? error.message : 'fallback'`.

---

## 9. Tipos TypeScript

```typescript
import type { Database } from '@/lib/database.types';

type Lead = Database['public']['Tables']['leads']['Row'];
type LeadInsert = Database['public']['Tables']['leads']['Insert'];
```

- Usar tipos auto-gerados (`supabase gen types typescript`) assim que o schema
  existir. **Nunca editar `database.types.ts` manualmente** — regenerar.
- Composições de domínio → `src/lib/types.ts`.
- Preferir **union literals** a enums TypeScript.

---

## 10. UX patterns (3 estados + feedback)

Componentes que mostram dados tratam **3 estados explicitamente**: loading, empty,
populated (+ error quando aplicável).

```tsx
if (isLoading) return <Loader2 className="animate-spin" />;
if (error) return <div className="text-destructive">Erro: {error.message}</div>;
if (data.length === 0) return <EmptyState />;
return <Lista data={data} />;
```

| Acção                 | Feedback                                              |
| ----------------------- | -------------------------------------------------------- |
| Sucesso                 | Toast (título apenas)                                    |
| Erro                    | Toast `variant: destructive` + descrição                 |
| Loading                 | Botão `disabled` + spinner                                |
| Após criar/editar       | Refrescar dados + toast + navegar (se aplicável)          |
| Após eliminar           | `AlertDialog` de confirmação + refrescar + toast          |

---

## 11. Segurança (RLS + variáveis)

> **Princípio:** frontend é hostil. Segurança real vive no Supabase via RLS.

- **Todas as tabelas com dados de cliente/apólice** têm RLS activa desde a primeira
  migration — não deixar para depois.
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — públicos, bundled no client.
- `SUPABASE_SERVICE_ROLE_KEY` — **nunca** prefixar com `VITE_`. Só em funções
  serverless/edge.
- `.env.local` git-ignored.
- Dados sensíveis (NIF, dados de sinistro, dados de saúde eventualmente) exigem
  atenção redobrada a RLS — este é um CRM de seguros, não um site institucional.

### O que NUNCA fazer

```typescript
// ❌ Confiar em check de role só no frontend
if (user.role === 'admin') return <DeleteAllButton />;

// ❌ Expor service-role key no client
const supabase = createClient(url, SERVICE_ROLE_KEY);
```

---

## 12. Anti-patterns

| Anti-pattern                                | Em vez disso                                   |
| --------------------------------------------- | ------------------------------------------------ |
| Query Supabase em página/componente           | Hook `useFeature()`                              |
| `any` por preguiça                            | Tipo auto-gerado ou custom                        |
| Componente 300+ linhas                        | Dividir em sub-componentes                        |
| Context para server state                     | Hook próprio                                      |
| `console.log` em código merged                | Remover, ou `console.warn`/`error` com contexto    |
| `import { foo } from '../../../lib/foo'`      | `import { foo } from '@/lib/foo'`                 |
| Validação só no client                        | Validar TAMBÉM no Supabase (constraints + RLS)     |
| Service-role key no client                    | Função serverless com service-role                |
| `catch {}` vazio                              | Log + toast, ou propagar                           |
| Tipo duplicado à mão                          | `z.infer<typeof schema>` ou `Pick`/`Omit`          |
| Bloco de comentário gigante/tipo relatório    | 1-3 linhas, só o "porquê"                          |

---

## 13. Tooling

```bash
npm run dev        # Vite dev server
npm run build       # Build produção
npm run preview     # Preview do build
```

**Package manager:** npm (consistente com `razao-dinamica/crm`).

- **Prettier:** `singleQuote: true`, `semi: true`.
- Deploy: Vercel, `framework: vite`. Confirmar `vercel.json` antes do primeiro deploy
  (ver `.vercelignore` — evitar que um `server.js` de dev seja interpretado como
  função serverless, como documentado no README de `AbreuEPereira`).

---

## 14. Checklist antes de commit

```
[ ] npm run build          → build passa
[ ] Sem erros TypeScript
[ ] Sem console.log soltos
[ ] Sem credenciais/secrets no código
[ ] Service-role nunca no client
[ ] 3 estados explícitos (loading/empty/populated/error)
[ ] Página apenas compõe — sem queries directas
[ ] Path aliases @/
[ ] PT-PT consistente no vocabulário de domínio (secção 3)
[ ] RLS verificada para tabelas afectadas
```

### Commits (Conventional Commits)

```bash
git commit -m "feat: adicionar pipeline de leads"
git commit -m "fix: corrigir cálculo de comissão em apólices multi-ramo"
```

---

## 15. Regras para agentes IA (Claude, Codex, Cursor, etc.)

Estas regras têm prioridade sobre qualquer implementação sugerida pelo agente.

### Antes de escrever código

1. Analisar a arquitectura relevante da funcionalidade.
2. Identificar que partes do sistema podem ser impactadas.
3. Verificar ficheiros, funções e dependências reais do projecto — **nunca assumir**
   que algo existe sem confirmar.
4. Se a alteração afectar múltiplos módulos, explicar o plano e aguardar aprovação
   antes de mexer em código.

### Escopo

- Nunca modificar ficheiros fora do escopo da tarefa sem justificar primeiro (o quê,
  porquê, impacto esperado).

### Reutilização antes de criação

Procurar componentes, hooks, utilitários e tipos existentes antes de criar novos.
Evitar duplicação de lógica.

### Comentários

Curto, explica o "porquê", não o "o quê". 1-3 linhas. Nunca blocos tipo relatório.

### Qualidade

Assumir que o projecto vai para produção com dados reais de clientes e apólices —
não é um protótipo descartável. Código legível, modular, tipado, fácil de testar e
debugar.

### Simplicidade acima de complexidade

Escolher a solução mais simples e fácil de manter. Evitar abstracções prematuras e
overengineering — sobretudo antes de o schema de dados estar estável.

### Protecção contra regressões

Nunca eliminar funcionalidades, hooks, páginas ou regras de negócio sem aprovação
explícita. Se uma remoção parecer necessária, pedir confirmação primeiro.

### Revisão obrigatória após alterações

Depois de cada implementação, verificar: erros TypeScript, imports/exports quebrados,
dependências em falta, inconsistências de tipos, regressões óbvias.

### Fluxo obrigatório de execução

1. Analisar arquitectura existente.
2. Identificar impacto da alteração.
3. Procurar reutilização.
4. Implementar apenas o necessário.
5. Rever possíveis regressões.
6. Executar `npm run build` (e lint/type-check quando existirem).
7. Só depois declarar a tarefa concluída.

---

_Última actualização: 2026-09-18 · BV Seguros_
