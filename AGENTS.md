# AGENTS.md: BV Seguros (monorepo)

Fonte de verdade para developers humanos e agentes IA (Claude, Codex, Cursor, etc.).
Regra do AGENTS.md: **o ficheiro mais próximo do que estás a editar prevalece.**

Este repositório tem dois projectos independentes, cada um com o seu deploy:

| Pasta | O quê | Stack | Regras | Porta de dev |
| --- | --- | --- | --- | --- |
| `/` (raiz) | Site institucional público | React + TS + Vite + Tailwind v4, sobre o Web Blueprint | [`BLUEPRINT.md`](BLUEPRINT.md) + [`docs/`](docs/) | 5190 |
| `crm/` | CRM interno (leads, clientes, apólices) | React 18 + TS + Vite + Tailwind + Supabase | [`crm/AGENTS.md`](crm/AGENTS.md) | 5183 |

Ver [`documento.md`](documento.md) para a visão geral do projecto, o que está por
confirmar com o cliente e o estado actual.

---

## Regras gerais (aplicam-se aos dois projectos)

1. **Não misturar os projectos.** Uma alteração no site não mexe em `crm/`, e
   vice-versa, salvo pedido explícito. São deploys Vercel separados.
2. **Não inventar dados reais da empresa** (morada, telefone, texto institucional,
   ramos de seguro vendidos): usar o que já está marcado como placeholder
   (`PorConfirmar` / `.placeholder-note` no site, `[por confirmar]` nas páginas
   legais) até o cliente confirmar. Ver `documento.md` secção 4.
3. **PT-PT** em todo o texto visível e nomes de variáveis/domínio.
4. Comentário curto, só o "porquê". Nunca bloco de texto tipo relatório.
5. Antes de remover algo, confirmar. Não eliminar funcionalidades sem aprovação
   explícita.

---

## Site institucional (raiz)

Construído sobre o [Web Blueprint](BLUEPRINT.md): design tokens, `Container`/
`Section`, componentes com contrato de estados (`Button`, `Card`, `Input`, `Header`,
`Footer`, `CookieConsent`), CSS em camadas, router mínimo próprio.

**Antes de mexer no site, ler por esta ordem:**

1. [`BLUEPRINT.md`](BLUEPRINT.md): o contrato estrutural (Container/Section, os
   quatro níveis, regra de permanência).
2. [`docs/design-system.md`](docs/design-system.md): tokens e contrato de cada
   componente.
3. [`docs/anti-ai.md`](docs/anti-ai.md): antes de adicionar qualquer padrão visual
   novo.
4. [`docs/content-style.md`](docs/content-style.md): antes de escrever ou editar
   copy (travessão é proibido; ver a tabela de substituições).
5. [`docs/agent-protocol.md`](docs/agent-protocol.md): o checklist antes/durante/
   depois de qualquer alteração.
6. [`MASTER-PROMPT.md`](MASTER-PROMPT.md): o brief da BV Seguros (stack, cores,
   tipografia, personalidade desejada).
7. [`DECISIONS.md`](DECISIONS.md): decisões estruturais e overrides, incluindo as
   específicas da BV Seguros (cor de marca, tipografia, `.placeholder-note`) perto do
   fim do ficheiro.

**Regras específicas da BV Seguros** (Level 2, ver `DECISIONS.md`):

- Cor de marca: `#184070` (navy do logótipo). `--color-secondary`/`--color-accent`
  são derivações sistemáticas dela e do neutro, não cores inventadas.
- Tipografia: Plus Jakarta Sans (display) + Inter (body), via Google Fonts. A mesma
  do CRM, para as duas partes lerem como a mesma marca.
- Conteúdo por confirmar fica marcado com o componente local `PorConfirmar` (em
  `src/pages/Home.tsx`) ou o bracket `[…]` nas páginas legais. Nunca publicar com o
  bracket ainda por preencher.

### Antes de declarar tarefa concluída (agentes IA)

Checklist completo em `docs/agent-protocol.md`. Resumo:

1. `npm run check` (lint + typecheck + build) passa.
2. `grep -rn "—" src *.md docs` devolve zero resultados fora dos exemplos do próprio
   `docs/content-style.md`.
3. Testar no browser: os 3 estados relevantes, responsivo (mobile + desktop),
   teclado/foco visível em qualquer coisa interactiva.
4. Sem `console.log` esquecido, sem dados reais inventados.

---

_Última actualização: 2026-09-21 · BV Seguros_
