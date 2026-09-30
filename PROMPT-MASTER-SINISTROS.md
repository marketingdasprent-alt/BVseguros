# Prompt master: pedidos de sinistro do site para o CRM (opção B)

Prompt para o agente que vai implementar a participação de sinistros no site
e a respetiva caixa de entrada no CRM. Mexe nos **dois projetos** (site na
raiz e `crm/`) e na **base de dados**. Copiar a partir de "Papel".

Estado: **implementado** (2026-09-30). Respostas do cliente: o formulário genérico de proposta também é dinâmico; os pedidos ficam todos guardados (sem apagar ao fim de 12 meses).

---

## Papel

És o developer full-stack da BV Seguros. Hoje, o pop-up de `/sinistros` é o
formulário genérico de pedido de proposta, o que está errado: quem tem um
sinistro precisa de ajuda com um seguro que já tem. Vais criar um formulário
de sinistro próprio no site, que muda conforme o tipo de seguro, e uma lista
"Pedidos de sinistro do site" no CRM, separada dos leads, onde a equipa liga
cada pedido a um cliente e a uma apólice e cria o sinistro.

## Leitura obrigatória

- Raiz: `AGENTS.md`, `DECISIONS.md` (entradas de 2026-09-30), `docs/design-system.md`
  (ModalProposta, ContactoForm por ramo, `.card-grid`), `src/app/proposta.ts`,
  `src/components/feedback/ModalProposta.tsx`, `src/sections/ContactoForm.tsx`,
  `src/data/formularios.ts`, `src/utils/enviarContacto.ts`, `src/pages/Sinistros.tsx`.
- CRM: `crm/AGENTS.md` (todo), `crm/supabase/schema.sql` (tabela `sinistros`,
  função `criar_lead_site`, políticas RLS, `is_active_user`, permissões por
  módulo), `crm/supabase/migrations/`, `crm/supabase/tests/`,
  `crm/src/pages/Sinistros.tsx`, `crm/src/hooks/useSinistros.ts`,
  `crm/src/components/crm/NovoSinistroModal.tsx`, `crm/src/hooks/useLeadsPorTratar.ts`
  (contador no menu), `crm/src/components/crm/Navigation.tsx`, `crm/api/aviso-lead.js`.

## Como funciona o processo (contexto de negócio)

1. O cliente tem um sinistro e pede ajuda à BV pelo site.
2. A equipa identifica o cliente e a apólice, confirma o que aconteceu e
   participa à seguradora (ou ajuda o cliente a participar). Em regra, o prazo
   é de 8 dias.
3. O sinistro fica registado no CRM, ligado à apólice, e é acompanhado até ao
   fim (`participado`, `em_analise`, `aprovado`/`recusado`, `pago`).

O pedido feito no site **não é a participação oficial à seguradora**, e o
formulário tem de o dizer.

## Regras que não se negoceiam

- PT-PT, sem travessão, sem inventar dados (contactos de urgência das
  seguradoras continuam `PorConfirmar`).
- **Dados de saúde:** nunca perguntar lesões, diagnósticos ou tratamentos (art.
  9.º RGPD). Só perguntas sim/não do tipo "houve feridos?". A descrição livre
  leva um aviso para não incluir dados de saúde.
- Segurança como em `criar_lead_site`: a tabela nova não aceita inserções
  diretas do `anon`; só uma função `security definer` com validação, limite
  anti-spam e consentimento obrigatório. RLS ativa desde a primeira migração.
- Hooks são o único acesso a dados no CRM; páginas só compõem (`crm/AGENTS.md`).
- `.card-grid` para qualquer conjunto de caixas; `npm run qa:layout` a passar.

---

## 1. Base de dados (migração nova em `crm/supabase/migrations/`)

Tabela `public.pedidos_sinistro`:

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid pk | |
| `criado_em` | timestamptz | `now()` |
| `nome`, `email`, `telefone` | text | mesmas validações de `criar_lead_site` |
| `ramo` | text | mesmos valores de `leads.ramo_interesse` |
| `numero_apolice`, `seguradora` | text, opcionais | até 60 / 80 caracteres |
| `data_ocorrencia` | date | obrigatória, não pode ser no futuro nem ter mais de 2 anos |
| `local` | text, opcional | até 160 |
| `descricao` | text | obrigatória, 10 a 1500 caracteres |
| `detalhes` | jsonb | campos do ramo: objeto só com valores de texto, até 4 KB, chaves de uma lista permitida por ramo |
| `consentimento_em` | timestamptz | obrigatório |
| `estado` | text | `novo` / `em_tratamento` / `convertido` / `arquivado`, por omissão `novo` |
| `cliente_id` | uuid, fk `clientes`, opcional | preenchido ao ligar |
| `sinistro_id` | uuid, fk `sinistros`, opcional | preenchido ao converter |
| `tratado_por` | uuid, fk `profiles`, opcional | |
| `notas` | text, opcional | notas internas |
| `atualizado_em` | timestamptz | trigger como nas outras tabelas |

- **RLS:** ler e editar só utilizadores ativos com o módulo `sinistros` (mesmo
  critério da tabela `sinistros`); apagar só o admin; nenhuma política de
  insert para `anon`.
- **Função `criar_pedido_sinistro_site(...)`:** `security definer`, `grant
  execute` a `anon`. Valida tudo o que está acima e os `detalhes` do ramo, e
  aplica um anti-spam igual ao dos leads (3 por contacto por hora, 30 no total
  por 10 minutos). Devolve os mesmos códigos de erro (`dados_invalidos`,
  `consentimento_em_falta`, `limite_excedido`).
- **Converter:** função ou transação no hook que cria o `sinistro` (apólice
  escolhida, `data_ocorrencia`, `descricao`) e marca o pedido como
  `convertido`, com `sinistro_id`, numa só operação.
- **Conservação (confirmar com o cliente):** propor que os pedidos
  `arquivado` sejam apagados ao fim de 12 meses, na mesma rotina de limpeza que
  já existir.
- **Testes** em `crm/supabase/tests/` (PGlite, `npm run test:db`): pedido
  válido; cada validação a falhar; consentimento em falta; anti-spam; o `anon`
  não lê nem escreve diretamente na tabela; um utilizador sem o módulo
  `sinistros` não vê os pedidos.
- Atualizar `crm/supabase/schema.sql` com o mesmo conteúdo, como nas migrações
  anteriores.

## 2. Site

- **Dados:** `src/data/formulariosSinistro.ts`, com o mesmo formato de
  `formularios.ts` (tipo `Campo`) e as chaves permitidas iguais às da função:

  | Ramo | Campos próprios |
  |---|---|
  | Automóvel | Matrícula; outro veículo envolvido (sim/não); Declaração Amigável preenchida (sim/não); houve feridos (sim/não); autoridades no local (sim/não) |
  | Multirriscos | Tipo de dano (água / incêndio / furto ou roubo / tempestade ou inundação / outro); queixa às autoridades (sim/não, só relevante em furto); a casa está habitável (sim/não) |
  | Saúde | Tipo de pedido (reembolso de despesas / autorização prévia de cirurgia ou internamento / outro). Sem perguntas clínicas |
  | Acidentes de trabalho | Empresa; onde ocorreu (no local de trabalho / no trajeto); o trabalhador já foi assistido (sim/não) |
  | Vida | Relação com a pessoa segura (própria pessoa / beneficiário / familiar / outra) |
  | Outros | Tipo de seguro (texto) |

  Campos comuns a todos: nome, email, telefone, **tipo de seguro (primeiro
  campo, obrigatório)**, nº de apólice ou seguradora (se souber), data da
  ocorrência (obrigatória, `max` = hoje), local, descrição (obrigatória),
  consentimento, honeypot.
- **Formulário dinâmico:** ao escolher o tipo de seguro, aparecem os campos
  desse ramo por baixo (sem recarregar e sem perder o que já foi escrito nos
  campos comuns). Os campos que aparecem são anunciados ao leitor de ecrã
  (`aria-live="polite"` numa frase curta, ex.: "Mais 4 perguntas sobre o
  automóvel").
- **Avisos no topo do formulário:** "Em caso de feridos ou perigo, ligue 112."
  e "Este pedido chega à BV Seguros, que o acompanha junto da seguradora. Não
  substitui a participação à seguradora, que em regra deve ser feita no prazo
  de 8 dias." Junto à descrição: "Não inclua informação sobre lesões ou saúde."
- **Pop-up:** o `ModalProposta` passa a ter dois modos (`proposta` e
  `sinistro`); `abrirSinistro(ramo?)` em `src/app/proposta.ts`. O título, o
  texto e o formulário mudam com o modo. Não duplicar o componente do modal.
- **Envio:** `src/utils/enviarPedidoSinistro.ts`, como o `enviarContacto.ts`
  (fetch simples à RPC nova, mesmos erros traduzidos).
- **Onde abre:** botão do hero de `/sinistros` ("Participar sinistro"), bloco
  de fecho dessa página, e o link "Participar sinistro" do painel de contacto
  da Home. O acesso rápido "Participar sinistro" continua a levar à página
  `/sinistros` (informação primeiro).
- **Sucesso:** "Pedido recebido. Vamos contactá-lo para tratar do sinistro."
  com o lembrete do prazo de 8 dias.

## 3. CRM

- **Hook** `usePedidosSinistro` (listar com filtro de estado, atualizar
  estado/notas/responsável, converter), mais o contador de pedidos `novo` para
  o menu, como o `useLeadsPorTratar`.
- **Página:** dentro do módulo Sinistros, um separador "Pedidos do site" ao
  lado da lista atual (a URL guarda o separador ativo, como os filtros
  existentes). Lista com data, nome, ramo, data da ocorrência, estado e
  responsável; os 3 estados explícitos (loading, vazio, com dados, erro).
- **Ficha do pedido:** todos os campos, incluindo os `detalhes` do ramo com os
  rótulos do site, e as ações:
  - **Ligar a um cliente:** pesquisa por NIF, nome, email ou telefone
    (reutilizar a pesquisa existente); sugere automaticamente clientes com o
    mesmo email ou telefone.
  - **Criar sinistro:** escolhe a apólice do cliente (pré-seleciona a que
    tiver o nº de apólice indicado) e abre o `NovoSinistroModal` já com a data
    e a descrição; ao gravar, o pedido fica `convertido`.
  - **Arquivar** (com confirmação), **Em tratamento**, notas internas.
  - Se o email ou o telefone não corresponderem a nenhum cliente: mostrar
    "Sem cliente com estes dados" e a opção de criar o cliente primeiro.
- **Menu:** contador de pedidos novos no item Sinistros, como nos Leads.
- **Aviso por email (opcional):** reutilizar `api/aviso-lead.js` com um
  segundo tipo de evento, para avisar os responsáveis de um pedido novo.
- **Manual** (`crm/public/manual.html`): secção curta "Pedidos de sinistro do
  site".

## 4. Pergunta em aberto (responder antes de começar)

O formulário genérico de **proposta** (Home, `/seguros`) também deve passar
a mostrar os campos do ramo depois de se escolher o tipo de seguro? Se sim,
usar exatamente o mesmo mecanismo dinâmico deste prompt, com os esquemas de
`formularios.ts`.

## 5. Ordem de entrega

1. Migração + testes da base de dados. Aplicar no Supabase (SQL Editor ou
   CLI) e confirmar a função com um pedido de teste, depois apagado.
2. CRM (hook, separador, ficha, conversão, contador). Deploy manual:
   `npx vercel --prod` em `crm/`.
3. Site (dados, formulário dinâmico, modal em modo sinistro, envio). Deploy
   manual: `npx vercel --prod` na raiz.
   O site só deve ser publicado depois de a função existir na base de dados,
   senão os pedidos falham.

## Critérios de aceitação

- Um pedido feito em `/sinistros`, para cada um dos 6 ramos, aparece em
  "Pedidos do site" no CRM com os campos certos e **não aparece nos Leads**.
- Um pedido convertido cria o sinistro ligado à apólice e desaparece da lista
  de novos.
- `npm run test:db`, `npm test` e `npm run build` no CRM; `npm run check`,
  `npm run qa` e `npm run qa:layout` no site, todos a passar.
- Nenhuma pergunta clínica em nenhum formulário.
- `DECISIONS.md` (raiz e, se existir, a do CRM) com a decisão; `documento.md`
  atualizado com o fluxo e com o que falta confirmar (conservação dos dados,
  contactos de urgência).
