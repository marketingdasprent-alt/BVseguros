# CRM BV Seguros: prompt de preparação para entrega

> Especificação executável de tudo o que falta para entregar o CRM ao cliente, saída da
> análise de ponta a ponta de 25/09/2026. Cada ponto tem: porquê, o que fazer, onde, e
> como se sabe que está feito. Seguir por fases; dentro de cada fase, pela ordem.
>
> Regras de sempre: `crm/AGENTS.md` (camadas, hooks como único acesso a dados, RLS,
> PT-PT com "você"), `STYLING-PROMPT-NOVAS-FUNCIONALIDADES.md` (padrão visual). Toda a
> alteração de base de dados vai numa migração nova em `supabase/migrations/` **e** no
> `schema.sql`, testada no Postgres local (PGlite) nos dois cenários: produção atual +
> migrações, e projeto novo só com `schema.sql`.

> **Estado (25/09/2026):** fases 1 e 2 feitas (1.1 a 2.7), com migrações testadas nos dois
> cenários do PGlite. Falta correr as migrações no Supabase e as fases 3 a 5.

Legenda de dono: **[dev]** faz-se no código · **[tu]** configuração tua (painéis
Supabase/Vercel) · **[cliente]** depende de decisão ou dados do cliente.

---

## Fase 1: bloqueadores rápidos [dev]

### 1.1 "Esqueci a senha"
- **Porquê:** hoje quem esquece a senha fica bloqueado; e a API já manda usar um
  "Esqueci a senha" que não existe.
- **Fazer:** no `Login.tsx`, link "Esqueci a senha" por baixo do campo da palavra-passe →
  vista no mesmo cartão com o campo email e "Enviar link" →
  `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })`.
  O link do email volta ao CRM com `type=recovery`, que o `DefinirSenha.tsx` já trata.
- **Privacidade:** a resposta é sempre a mesma ("Se existir uma conta com este email,
  vai receber um link"), exista ou não a conta. Erros de limite do Supabase traduzidos.
- **Acesso por hook:** a chamada vive em `hooks/useAuth.tsx` (ou `lib/auth.ts`), não na página.
- **Feito quando:** o link aparece, envia, mostra a mensagem neutra, "Voltar ao login"
  funciona, e o fluxo recovery abre o `DefinirSenha`.

### 1.2 O CRM não aparece no Google
- `vercel.json`: header `X-Robots-Tag: noindex, nofollow` em todas as rotas;
  `index.html`: `<meta name="robots" content="noindex, nofollow">`;
  `public/robots.txt` com `Disallow: /`.
- Headers de segurança no `vercel.json`: `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`,
  `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- **Feito quando:** `curl -I` à produção mostra os headers.

### 1.3 "Hoje" na hora local
- `toISOString().slice(0, 10)` dá a data UTC: entre as 00:00 e a 01:00 em Portugal (verão)
  o dia fica errado. Criar `hojeLocal()` e `somarDias()` em `lib/format.ts` (com teste) e
  usar em `AtividadesTable`, `NovoSinistroModal` e `useRenovacoes`.

### 1.4 Limpeza dos dados de teste [dev escreve · tu corres]
- Script `supabase/limpeza/2026-09-25_remover-dados-teste.sql` (fora de `migrations/`,
  porque não é para projetos novos): apaga, **por id ou nome exato listado**, os leads
  "TESTE Integração Site" e "Maria Silva", o cliente "João Pereira" (as apólices,
  propostas, sinistros, renovações e atividades vão em cascata) e mostra antes um
  `select` do que vai apagar. Tudo numa transação; nunca `delete` sem `where`.
- Contas: não apaga nenhuma. Lembrar de mudar o nome "Nome Verdadeiro" no ecrã.

---

## Fase 2: antes de entregar [dev]

### 2.1 Listas completas: paginação e aviso de limite
- **Porquê:** o Supabase devolve no máximo 1000 linhas; acima disso as listas ficam
  incompletas sem aviso.
- **Fazer:** `useSupabaseTable` passa a ler em páginas de 1000 até esgotar
  (`.range()`), com um tecto de segurança (ex.: 20 000) e `count: 'exact'`. Se o tecto
  for atingido, a página mostra `.notice--neutral` "A mostrar os primeiros N de M".
  Os Kanbans e tabelas não mudam de aspeto.
- **Feito quando:** teste unitário do ciclo de páginas com cliente simulado.

### 2.2 Pesquisa e filtros em todas as listas
- Componente único `components/crm/BarraPesquisa.tsx` (input com ícone `Search`,
  mesmo estilo do de Clientes) + lógica pura `lib/pesquisa.ts` (normaliza acentos e
  maiúsculas: "joao" encontra "João"), com teste.
- Leads: nome, telefone, email · Propostas: lead/cliente, seguradora ·
  Apólices: nº, cliente, seguradora + filtros ramo e estado ·
  Sinistros: nº, apólice, descrição · Atividades: título, associado + filtro
  "Só pendentes" · Renovações: nº, cliente.
- Filtros na URL (`useSearchParams`), como o de responsável, para se poderem partilhar.
- Estado vazio próprio: "Nenhum resultado para «x»" com botão "Limpar pesquisa".

### 2.3 Ficha do cliente (vista 360°)
- **Porquê:** é a primeira coisa que um corretor procura; hoje a informação de um
  cliente está espalhada por 6 páginas.
- **Rota:** `/clientes/:id` (página `ClienteFicha.tsx`, só compõe).
- **Hook:** `useFichaCliente(id)`: cliente + apólices + propostas + sinistros (das
  apólices) + renovações + atividades, numa ida (queries em paralelo).
- **Layout:** cabeçalho com nome, NIF, contactos, responsável (Pessoa) e ações
  (Editar, Nova apólice, Nova atividade, Apagar se admin). Faixa de métricas
  (`.metrics-strip`): apólices ativas, prémio anual total, sinistros em aberto,
  próxima renovação. Por baixo, secções em `.panel`: Apólices, Propostas, Sinistros,
  Atividades (cronologia com `.activity-row`). Estados vazios por secção.
- Na tabela de Clientes, o nome passa a link para a ficha; o mesmo nos nomes de
  cliente em Apólices, Renovações e Propostas.
- **Feito quando:** abrir, editar e voltar funcionam; `id` inexistente mostra
  "Cliente não encontrado" com link para a lista.

### 2.4 Importação da carteira (CSV)
- **Porquê:** sem isto a BV não consegue começar a usar o CRM com os clientes que já tem.
- **Onde:** página `/importar` (só admin, em "Administração"), 3 passos:
  1. Escolher o tipo (Clientes ou Apólices) e o ficheiro; botão "Descarregar modelo CSV"
     com os cabeçalhos certos.
  2. Pré-visualização: tabela com as primeiras linhas, contagem de válidas/erros, e lista
     de erros por linha ("Linha 14: NIF inválido").
  3. Importar as válidas; resultado final com totais.
- **Lógica pura** `lib/importacao.ts` (com testes): ler CSV com `;` ou `,` e aspas
  (Excel PT exporta com `;`), UTF-8 com ou sem BOM, datas `dd/mm/aaaa` e `aaaa-mm-dd`,
  valores `1.234,56` e `1234.56`, ramos por rótulo ("Automóvel") ou valor ("auto"),
  NIF de 9 dígitos com **dígito de controlo**, telefone limpo.
- **Apólices** ligam ao cliente por NIF (se não existir, erro na linha).
- **Base de dados:** função `importar_clientes(jsonb)` e `importar_apolices(jsonb)`,
  `security invoker`, só admin, tudo ou nada por lote de 500, e que devolve o que
  inseriu e o que saltou por já existir (NIF ou nº de apólice repetido).
- **Feito quando:** um CSV de 200 linhas com 5 erros importa 195 e mostra os 5.

### 2.5 Aviso de lead novo vindo do site
- **Porquê:** um pedido do site pode ficar dias sem ninguém ver.
- **Fazer:** notificação dentro do CRM (sempre) + email (se configurado):
  - Dentro do CRM: contador na navegação "Leads" com os leads do site em "Novo" e sem
    responsável; atualiza por Supabase Realtime (canal em `leads`, filtro
    `origem=eq.site`) ou, se o realtime não estiver ativo, a cada 60 s.
  - Email: função `api/aviso-lead.js` chamada por um **Database Webhook** do Supabase
    em `insert` de `leads` com `origem = 'site'`; envia para os admins ativos via
    Brevo (padrão da Razão Dinâmica), só se `BREVO_API_KEY` existir. Protegida por
    segredo partilhado (`AVISO_LEAD_SEGREDO`) no header.
- **Feito quando:** um lead de teste pelo site faz aparecer o contador em menos de 60 s
  e, com a chave configurada, chega o email.

### 2.6 Histórico de alterações dos registos
- Tabela `historico_registos` (tabela, registo_id, ação insert/update/delete, campos
  alterados `jsonb` com antes/depois, quem, quando), escrita por um trigger genérico
  `security definer` em leads, clientes, apólices, propostas, sinistros e renovações.
  Leitura: admin vê tudo; quem tem acesso ao registo vê o dele.
- Na ficha do cliente e nos modais de edição: secção "Histórico" colapsável
  ("Maria mudou o prémio de 500 € para 550 € · Ontem, 18:02").
- Não guardar no histórico campos sem valor de auditoria (`atualizado_em`).

### 2.7 Seguradoras como lista
- Tabela `seguradoras (id, nome unique, ativa)`, preenchida pela migração com os valores
  distintos que já existem em apólices e propostas (sem inventar nenhuma).
- Gestão em "Administração → Seguradoras" (admin: adicionar, renomear, desativar).
- Formulários de apólice e proposta: `select` com as ativas + "Outra…" que abre um input
  (e cria a seguradora se for admin). As colunas `seguradora` passam a guardar o nome
  normalizado da lista; não mudar para chave estrangeira nesta fase (menos risco).

---

## Fase 3: configuração de produção [tu]

- [ ] Supabase → Authentication → URL Configuration: Site URL e Redirect URLs do CRM.
- [ ] Supabase → SMTP próprio (email da BV ou Brevo) e templates em PT (convite, recuperar senha).
- [ ] Supabase → confirmar plano e **cópias de segurança** (no gratuito não há backups recuperáveis).
- [ ] Vercel → ligar `bvseguros-crm` ao GitHub (`main`) e domínio `crm.<domínio>` [cliente: domínio].
- [ ] Vercel → `BREVO_API_KEY` e `AVISO_LEAD_SEGREDO` (para 2.5) e Database Webhook no Supabase.
- [ ] Correr as migrações novas e o script de limpeza (1.4).

---

## Fase 4: RGPD [cliente + dev]

- **[cliente]** Prazos de retenção: leads perdidos (ex.: 12 meses), ex-clientes (prazos
  legais do setor), pedidos do site sem resposta.
- **[dev]** Na ficha do cliente (admin): "Exportar dados" (JSON/CSV com tudo o que o
  CRM tem sobre a pessoa, para pedidos de acesso) e "Anonimizar" (substitui nome,
  contactos, NIF e morada por marcas neutras, mantém apólices para estatística).
- **[dev]** Leads perdidos há mais do que o prazo: listagem para o admin rever e apagar
  (nunca apagar automaticamente sem decisão do cliente).
- **[cliente]** Política de privacidade do site: mencionar que os pedidos ficam no CRM
  (Supabase como subcontratante). Não guardar dados de saúde no CRM.

---

## Fase 5: segunda fase (fora da entrega)

Documentos anexos (Supabase Storage com RLS), comissões, agenda e lembretes de
atividades, WhatsApp, exportação Excel e relatórios, monitorização de erros (Sentry),
testes ponta a ponta (Playwright) em CI. Alinhar o `crm/AGENTS.md` com o código
(react-hook-form/zod e tipos gerados não foram adotados) ou adotá-los.

---

## Critérios de entrega (tudo verdade)

- [ ] Fases 1 e 2 feitas, com `npm run typecheck`, `npm test` e `npm run build` a passar.
- [ ] Todas as migrações testadas nos dois cenários do PGlite.
- [ ] Percurso completo no browser, desktop e telemóvel: login → recuperar senha →
      importar CSV → ficha de cliente → criar/editar/converter/apagar → convite.
- [ ] Base de produção sem dados de teste; contas com nomes reais.
- [ ] Fase 3 feita por ti; decisões da fase 4 registadas no `documento.md`.
