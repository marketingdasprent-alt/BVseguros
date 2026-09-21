# BV Seguros

Repositório com dois projectos independentes:

- **Site institucional** (esta pasta): React + TypeScript + Vite + Tailwind CSS v4,
  construído sobre o [Web Blueprint](BLUEPRINT.md).
- **[`crm/`](crm/)**: CRM interno (leads, clientes, apólices), React + Vite + Supabase.

Ver [`documento.md`](documento.md) para a visão geral do projecto e o que ainda está
por confirmar com o cliente, e [`AGENTS.md`](AGENTS.md) para as convenções (regras
específicas do CRM em [`crm/AGENTS.md`](crm/AGENTS.md)).

## Site institucional

Requer [Node.js](https://nodejs.org) 18+.

```bash
npm install
npm run dev
```

Abre em <http://localhost:5190>.

```bash
npm run lint       # ESLint
npm run typecheck  # TypeScript estrito
npm run check      # lint + typecheck + build de produção
npm run build       # build de produção
npm run preview      # pré-visualizar o build
npm run qa           # auditoria estática: conteúdo, tokens, a11y, SEO, dependências
```

Conteúdo actual (morada, telefone, texto institucional) é placeholder, marcado
visivelmente no código (`.placeholder-note`, componente `PorConfirmar` em
`src/pages/Home.tsx`). Ver `documento.md` secção 4.

### Onde as coisas vivem

Ver [`BLUEPRINT.md`](BLUEPRINT.md) para o contrato estrutural completo, e
`docs/design-system.md` para o catálogo de tokens/componentes. Antes de qualquer
alteração, ler `docs/agent-protocol.md`. Decisões específicas da BV Seguros (cores,
tipografia) estão registadas em [`DECISIONS.md`](DECISIONS.md); o brief do projecto
está em [`MASTER-PROMPT.md`](MASTER-PROMPT.md).

### Publicar (Vercel)

Projecto Vercel com **Root Directory = `.`** (raiz), preset **Vite** (auto-detectado,
sem `vercel.json` necessário). Cada `git push` para `main` dispara um deploy novo.

## CRM

Ver [`crm/README.md`](crm/README.md): instalação, configuração do Supabase e deploy.

```bash
cd crm
npm install
npm run dev
```

Abre em <http://localhost:5183>.
