# CRM BV Seguros: prompt master de evolução para nível de corretora de topo

> Especificação executável para levar o CRM de "CRM comercial" (lead → proposta →
> apólice) a "sistema de gestão de mediação" ao nível das grandes corretoras: dinheiro
> (recibos, comissões), documentos, conformidade (ASF, IDD, RGPD, branqueamento de
> capitais), automação e relatórios de gestão. Nasceu da análise de 30/09/2026.
>
> Complementa o [`PROMPT-ENTREGA.md`](PROMPT-ENTREGA.md): o que lá está na fase 4 (RGPD)
> e na fase 5 (segunda fase) é absorvido e detalhado aqui. Copiar a partir de "Papel".

> **Estado (30/09/2026):** nada implementado. Auditoria de segurança feita (fase 1.1, com
> os problemas confirmados no código). MFA adiado. Fase 0 à espera de respostas do cliente.
>
> **Em pausa (decisão do João, 30/09/2026):** o CRM fica como está até haver testes reais com a
> equipa. A prioridade passa a ser os formulários da landing page e os domínios do site e do CRM.
> Uma implementação da fase 1.1 chegou a ser feita e foi desfeita no mesmo dia; este ficheiro
> continua a servir de referência para quando se voltar ao CRM.

Legenda de dono: **[dev]** faz-se no código · **[tu]** configuração tua (painéis
Supabase/Vercel/GitHub) · **[cliente]** depende de decisão ou dados da BV Seguros.

---

## Papel

És o developer full-stack sénior da BV Seguros, com experiência em sistemas de gestão de
mediação de seguros em Portugal. O CRM já tem leads, propostas, clientes, apólices,
renovações, sinistros, pedidos de sinistro do site, atividades, grupos com permissões
por módulo e por carteira, histórico de alterações e importação com IA. Vais evoluí-lo
por fases, cada uma entregue de forma independente, sem partir nada do que existe.

## Leitura obrigatória (antes de qualquer fase)

- `crm/AGENTS.md` (todo), `AGENTS.md` da raiz (regras gerais), `documento.md`.
- `crm/STYLING-PROMPT-NOVAS-FUNCIONALIDADES.md` (padrão visual de ecrãs novos).
- `crm/supabase/schema.sql`: em especial `pode()`, `ve_carteira_toda()`, `ve_cliente()`,
  `ve_apolice()`, `grupo_permissoes`, `registar_historico()`, `converter_lead()`,
  `marcar_renovada()`, `criar_lead_site()`, `criar_pedido_sinistro_site()`.
- `crm/supabase/tests/migracoes.mjs` (como as migrações são testadas nos dois cenários).
- `crm/src/lib/permissoes.ts` (lista `MODULOS`, espelho da base de dados).
- `crm/src/lib/importacao.ts` e `crm/api/ler-carteira.js` (importação CSV e com IA).
- `crm/api/aviso-lead.js` (envio de email por Brevo, já em uso).

## Regras que não se negoceiam

1. **Um plano por fase, aprovado antes de código.** Cada fase mexe em base de dados,
   hooks e ecrãs: apresentar o plano (tabelas, colunas, funções, políticas RLS, ecrãs,
   ficheiros tocados) e esperar aprovação (`crm/AGENTS.md` secção 15).
2. **Base de dados:** cada alteração numa migração nova em `supabase/migrations/`
   (cabeçalho "depois de <migração anterior>") **e** no `schema.sql`. `npm run test:db`
   a passar nos dois cenários antes de declarar a fase feita. Estender os testes de
   acesso em `migracoes.mjs` para cada tabela nova (anon, conta inativa, mediador com
   carteira própria, mediador com carteira toda, admin).
3. **RLS desde a primeira migração** em todas as tabelas novas, com o padrão existente:
   `pode('<modulo>', 'ver'|'editar'|'apagar')` + `ve_carteira_toda()` / `ve_cliente()` /
   `ve_apolice()`. Nada de `using (true)`.
4. **Módulos de permissão novos** entram em três sítios ao mesmo tempo: `check` de
   `grupo_permissoes.modulo`, `MODULOS` em `src/lib/permissoes.ts` e o teste que confirma
   que os dois coincidem. Os grupos existentes ficam com `nenhum` nos módulos novos; só o
   admin os liga.
5. **Histórico:** tabelas novas com dados de cliente ligam o trigger `registar_historico`.
6. **Dinheiro:** `numeric(12, 2)`, nunca `float`. Cálculos (comissões, fraccionamento,
   prorata) em funções puras em `src/lib/` com testes Vitest, e a mesma regra repetida na
   base de dados só quando a base de dados precisa de a garantir.
7. **Nada se apaga em cascata** em dados de negócio a partir da fase 1 (ver 1.2).
8. **Dados de saúde (art. 9.º RGPD):** não criar campos de diagnóstico, lesões ou
   tratamentos. Onde for inevitável (documentos de sinistro de saúde), só com decisão
   escrita do cliente na fase 0 e categoria de documento com acesso restrito.
9. **Não inventar regras legais.** Prazos da ASF, prazos de retenção e textos legais ficam
   como `[por confirmar]` e configuráveis até o cliente (ou o jurídico dele) os dar.
10. PT-PT com "você" no texto visível, sem travessão, 3 estados em tudo o que mostra dados,
    hooks como único acesso a dados, páginas só compõem, `@/` nos imports.
11. **Não fazer commit nem push** sem ordem explícita do utilizador.

## Fluxo de cada fase

1. Ler o que a fase toca. 2. Plano → aprovação. 3. Migração + `schema.sql` +
`test:db`. 4. Tipos em `src/lib/types.ts` (ou gerados, ver 1.5). 5. Lógica pura em
`src/lib/` com testes. 6. Hooks. 7. Componentes e página. 8. `npm run typecheck`,
`npm test`, `npm run build`, `npm run test:db`. 9. Testar no browser (desktop e
telemóvel, teclado, os 3 estados). 10. Actualizar `documento.md`, o `public/manual.html`
se o utilizador final vir diferença, e o **Estado** no topo deste ficheiro.

---

## Fase 0: decisões do cliente [cliente]

Nenhuma fase de 2 em diante começa sem as respostas que lhe dizem respeito. Registar as
respostas no `documento.md` e aqui.

| # | Pergunta | Afecta |
|---|---|---|
| 0.1 | Quem cobra os prémios: a seguradora directamente, a BV, ou os dois conforme a apólice? | Fase 3 |
| 0.2 | A BV trabalha com subagentes/angariadores que recebem parte da comissão? | Fase 4 |
| 0.3 | Como chegam hoje as comissões e os recibos das seguradoras (extracto PDF, CSV, portal)? Pedir um exemplo de cada seguradora principal. | Fases 3, 4 |
| 0.4 | A BV vende seguros do ramo Vida com componente financeira (PPR, capitalização)? | Fase 6 (branqueamento de capitais) |
| 0.5 | Que modelos de análise de necessidades e de informação pré-contratual usam hoje? | Fase 6 |
| 0.6 | Prazos de retenção: leads perdidos, ex-clientes, documentos, reclamações. | Fase 6 |
| 0.7 | Guardar documentos de sinistro que possam conter dados de saúde: sim ou não? Se sim, quem pode ver? | Fases 5, 8 |
| 0.8 | Clientes empresa: que dados precisam (CAE, contactos por departamento, grupos económicos)? | Fase 2 |
| 0.9 | Canais de comunicação a automatizar: email (já há Brevo), SMS, WhatsApp? | Fase 7 |
| 0.10 | Sinistros: quem pode marcar "aprovado"/"pago" e registar o valor pago? Qualquer pessoa com Sinistros "editar", ou só um perfil próprio (segregação de funções)? | Fase 1 (1.1.8) |

---

## Fase 1: fundações e segurança [dev + tu]

Barato, reduz risco já e prepara o terreno para o resto. Só o 1.1.8 depende do cliente
(0.10). O MFA fica adiado por decisão de 30/09/2026 (ver fase 11).

### 1.1 Endurecimento de segurança (auditoria de 30/09/2026)

Cada ponto abaixo foi confirmado no código. Todos os pontos de base de dados vão numa só
migração (`<data>_endurecimento.sql`), com um teste em `migracoes.mjs` que **tenta o
ataque e confirma que falha**. Ordem = gravidade.

#### 1.1.1 Abuso dos formulários públicos (bloqueio de pedidos reais) [dev + tu] (feito 30/09/2026)
- **Problema:** `criar_lead_site` e `criar_pedido_sinistro_site` têm um tecto global de
  30 pedidos em 10 minutos. Qualquer pessoa, com 30 pedidos de contactos inventados,
  bloqueia a entrada de leads e de sinistros reais durante 10 minutos, em ciclo. Cada lead
  do site envia ainda um email a todos os admins (até ~4300 por dia). O limite por
  contacto (3/hora) contorna-se mudando o email.
- **Fazer:**
  - Os dois formulários do site passam a enviar para uma função da Vercel do site
    (`/api/contacto`, `/api/sinistro`) que: verifica um desafio Cloudflare Turnstile
    (invisível, sem cookies de rastreio) no servidor; aplica limite por IP (ex.: 5 por
    hora); só então chama a RPC com a service-role.
  - A RPC deixa de ter `grant execute ... to anon` (só `service_role`), e o tecto global
    passa a proteger só contra falha da função (ex.: 200/10 min).
  - O aviso por email agrupa: no máximo um email a cada 10 minutos com a lista dos novos.
  - **Atenção:** mexe no projecto do site (raiz); pedir aprovação explícita (regra 1 do
    `AGENTS.md` da raiz). Chaves do Turnstile **[tu]**.
- **Feito quando:** 100 pedidos seguidos do mesmo IP param ao 6.º; um pedido sem token
  Turnstile é recusado; um `curl` directo à RPC com a anon key é recusado.

#### 1.1.2 Registo aberto no Supabase Auth [tu]
- **Problema (a confirmar no painel):** a anon key é pública (está no JavaScript). Se o
  registo estiver ligado, qualquer pessoa cria contas (ficam inactivas, mas enchem a lista
  de Utilizadores) e usa o email da BV para enviar confirmações a terceiros.
- **Fazer:** Authentication → Sign In / Providers → desligar "Allow new users to sign up"
  (as contas nascem só por `api/utilizadores.js`). Rever também: limites de pedidos do Auth,
  senha mínima de 10 caracteres com letras e números, "Leaked password protection"
  (plano pago), duração do JWT (1 hora).

#### 1.1.3 Campos que se podem falsificar pela API [dev]
- **Problema:** as políticas de `update`/`insert` deixam gravar qualquer coluna. Hoje, com
  a sessão de um mediador e a API do Supabase, é possível:
  - criar ou alterar um lead com `origem = 'site'` e `consentimento_em` preenchido, ou seja,
    **forjar um consentimento RGPD** e um pedido "do site";
  - alterar `criado_em` de qualquer registo (antedatar) e escolher `atualizado_em`;
  - em `pedidos_sinistro`, reescrever o que o participante escreveu (nome, contactos,
    descrição, data, consentimento) e marcar `estado = 'convertido'` com um `sinistro_id`
    ou `cliente_id` à escolha, sem passar por `converter_pedido_sinistro`.
- **Fazer:** triggers `before insert or update`:
  - `criado_em`: no insert, `now()`; no update, mantém o antigo. `atualizado_em`: sempre
    `now()` no servidor (o bloqueio optimista em `atualizarComVersao` continua a funcionar,
    porque compara com o valor lido do servidor).
  - `leads.origem`, `consentimento_em`, `mensagem`: só a função do site os preenche
    (detectar por `current_user` do dono da função `security definer`); para os
    restantes, insert força `origem = 'manual'` e `consentimento_em = null`, update mantém
    os valores antigos.
  - `pedidos_sinistro`: campos do participante imutáveis; `estado = 'convertido'`,
    `sinistro_id` e `cliente_id` só dentro de `converter_pedido_sinistro` (variável de
    sessão local à transacção, `set_config('bv.a_converter', 'on', true)`).
- **Feito quando:** os ataques acima, feitos em `migracoes.mjs` com uma sessão de
  mediador, não mudam nada.

#### 1.1.4 Texto sem limite de tamanho [dev]
- **Problema:** `notas`, `descricao`, `morada`, `coberturas`, `titulo`, `numero_apolice`,
  `numero_sinistro`, `email`, `seguradora` (apólices/propostas) não têm limite na base de
  dados nem `maxLength` nos inputs. Uma sessão (ou um token roubado) grava centenas de MB
  por campo; o histórico duplica cada linha em `to_jsonb`. A base fica cheia e lenta.
- **Fazer:** `check (char_length(...) <= N)` em todas as colunas de texto livre (ex.:
  títulos e números 60 a 120, email 254, morada 300, notas/descrição 5000), `maxLength`
  igual nos inputs e contador de caracteres nos `textarea`. Constante única por campo em
  `src/lib/limites.ts`. Mensagem própria em `erros.ts`.
- **Antes:** verificar em produção o maior valor actual de cada coluna para não partir a
  migração.

#### 1.1.5 Overflow numérico [dev]
- **Problema:** prémios e valores são `numeric(10,2)` (máximo 99 999 999,99). Os inputs
  `type="number"` não têm `max`; `Number('1e12')` passa no browser e a base de dados
  devolve `numeric field overflow` (22003), que o `erros.ts` mostra como erro genérico.
- **Fazer:** `max` nos inputs e validação em `src/lib/` (só dígitos, até 2 casas,
  tecto de negócio, ex.: 10 000 000 €, a confirmar); `check` com o mesmo tecto na base de
  dados; tradução do 22003 e do novo `check` em `erros.ts`. O mesmo para
  `importar_apolices` (hoje cai no `exception when others` com a mensagem técnica).
- **Feito quando:** `1e12`, `-0`, `12,345` e `99999999999` dão mensagem clara em todos os
  formulários com valores.

#### 1.1.6 Funções internas expostas a visitantes anónimos [dev]
- **Problema:** por omissão o Supabase dá `EXECUTE` a `anon` nas funções novas do schema
  `public`. `is_active_user`, `is_admin_user`, `pode`, `ve_carteira_toda`, `meu_grupo` e as
  `security definer` `ve_lead`, `ve_cliente`, `ve_apolice` não têm `revoke`. As `ve_*`
  respondem a qualquer visitante se um id existe e não tem responsável.
- **Fazer:** `revoke execute on all functions in schema public from public, anon`, seguido
  de `grant` explícito a `authenticated` só das que o CRM chama e a `anon` de nenhuma (depois
  do 1.1.1). `alter default privileges ... revoke execute on functions from anon` para as
  futuras. Teste: listar em `migracoes.mjs` as funções executáveis por `anon` e falhar se a
  lista não for a esperada.

#### 1.1.7 Pedidos repetidos e concorrência [dev]
- **Problema:** duplo clique, dois separadores ou um script em ciclo criam registos
  duplicados onde falta uma chave única:
  - `renovacoes`: sem `unique (apolice_id, data_fim_anterior)`; `marcarContactado` e
    `marcar_renovada` (sem id) inserem sempre.
  - `clientes.lead_origem_id`: `converter_lead` protege com bloqueio, mas um insert directo
    cria dois clientes para o mesmo lead.
- **Fazer:** índices únicos (limpar duplicados existentes antes, com relatório), inserts com
  `on conflict`, e botões de gravar desactivados enquanto o pedido corre (confirmar que
  todos os modais o fazem).

#### 1.1.8 Regras de negócio que permitem fraude interna [dev + cliente]
- **Problema:**
  - `marcar_renovada` não confirma que `p_renovacao_id` pertence a `p_apolice_id` (marca
    renovada a renovação de outra apólice) nem valida a nova data de fim (pode ser anterior
    à actual ou daqui a 100 anos).
  - `sinistros`: o estado muda livremente (ex.: `recusado` → `pago`) e `valor_pago`
    grava-se em qualquer estado e sem tecto face ao `valor_estimado`.
  - `atividades` e `pedidos_sinistro` não têm histórico: `data_atividade`, `concluida` e
    notas mudam sem rasto (ex.: antedatar chamadas).
- **Fazer:**
  - `marcar_renovada`: exigir que a renovação seja da apólice, nova data de fim posterior à
    anterior e no máximo 5 anos depois; bloquear a linha da apólice (`for update`).
  - Trigger de transições de `sinistros` (tabela de estados permitidos em `src/lib/` e na
    base de dados); `valor_pago` só em `aprovado`/`pago`. Quem pode aprovar e pagar
    conforme 0.10 (acção de permissão nova, ex.: `pode('sinistros', 'aprovar')`).
  - Ligar `registar_historico` a `atividades` e `pedidos_sinistro`.

#### 1.1.9 Cabeçalhos do browser [dev]
- **Problema:** o `vercel.json` não tem `Content-Security-Policy` nem
  `Strict-Transport-Security`. A sessão do Supabase fica no `localStorage`: um XSS (por
  exemplo numa dependência) levava o token.
- **Fazer:** CSP restrita (`default-src 'self'`; `connect-src` com o URL do Supabase, `wss:`
  do Realtime e Sentry quando existir; `img-src 'self' data: blob:`; `frame-ancestors
  'none'`; sem `unsafe-eval`), HSTS de 1 ano. Testar login, Realtime, importação e
  descarregar CSV com a CSP ligada.

#### 1.1.10 Exportação CSV [dev]
- **Problema:** `escreverCsv` não neutraliza fórmulas. Um nome vindo do site como
  `=HYPERLINK(...)` executa no Excel de quem exportar. Hoje só se exportam erros de
  importação, mas a fase 10 vai exportar leads e clientes.
- **Fazer:** prefixar com `'` qualquer célula que comece por `=`, `+`, `-`, `@`, tabulação
  ou `\r`, com teste em `csv.test.ts`.

#### 1.1.11 Pormenores [dev]
- `deve_trocar_senha` só é imposto no browser: quem recebeu a senha do admin usa a API sem
  a trocar e o admin continua a saber a senha. `is_active_user()` passa a devolver `false`
  enquanto `deve_trocar_senha` for verdadeiro (`senha_trocada()` e a leitura do próprio
  perfil continuam a funcionar).
- Rever todas as funções `security definer` (as que ignoram a RLS): cada uma tem de
  verificar `pode(...)` **e** a carteira (`ve_*`) de todos os ids que recebe.
- NIF: validar o dígito de controlo também na base de dados (hoje só formato).
- `api/aviso-lead.js`: `JSON.parse` fora do `try` devolve 500 com corpo inválido.
- **[tu]** Vercel Firewall: limite por IP em `/api/*` do CRM.

#### Feito quando (1.1 inteiro)
- Um script `supabase/tests/ataques.mjs` (ou secção em `migracoes.mjs`) reproduz cada
  ataque acima como anónimo, mediador de carteira própria e mediador de carteira toda, e
  todos falham.
- Relatório curto em `documento.md`: o que foi corrigido e o que ficou como tarefa **[tu]**.

### 1.2 Arquivar em vez de apagar
- **Porquê:** hoje há 9 `on delete cascade`. Apagar um cliente apaga apólices, sinistros
  e renovações, o que colide com a obrigação de guardar histórico.
- **Fazer:**
  - Coluna `arquivado_em timestamptz` (+ `arquivado_por`) em `leads`, `clientes`,
    `apolices`, `propostas`, `sinistros`.
  - FKs de `apolices → clientes`, `sinistros/renovacoes → apolices` e
    `propostas → leads/clientes` passam de `cascade` a `restrict`. `atividades` pode
    manter `cascade` só se o cliente concordar; por omissão, `restrict`.
  - "Apagar" na interface passa a "Arquivar" (com `AlertDialog`) e há um filtro
    "Mostrar arquivados". Desarquivar só com permissão `apagar`.
  - Apagar de verdade fica reservado ao admin e só através da anonimização RGPD (fase 6).
  - Listagens e `obter_resumo_dashboard()` excluem arquivados por omissão.
- **Atenção:** confirmar com o utilizador antes, porque muda o comportamento actual de
  "Apagar" (regra de protecção contra regressões).
- **Feito quando:** apagar um cliente com apólices é recusado pela base de dados;
  arquivar e desarquivar funcionam com permissões certas.

### 1.3 CI no GitHub
- **Não fazer.** Decisão do João (30/09/2026): o projecto é pequeno demais para CI/CD. As
  verificações correm à mão antes de cada entrega (`typecheck`, `test`, `build`, `test:db`).

### 1.4 Monitorização de erros
- **Fazer:** Sentry (plano gratuito) no `main.tsx` e no `ErrorBoundary`, e nas funções
  de `api/`. Remover dados pessoais dos eventos (`beforeSend`: sem emails, NIF,
  telefones). DSN em variável de ambiente **[tu]**.

### 1.5 Tipos gerados do Supabase
- **Porquê:** `crm/AGENTS.md` pede `database.types.ts`; hoje `types.ts` é à mão e pode
  divergir.
- **Fazer:** script `npm run gen:types` (`supabase gen types typescript`), gerar
  `src/lib/database.types.ts`, e fazer `types.ts` derivar dele (`Row`, `Insert`) em vez de
  duplicar. Se o utilizador preferir não o fazer, alinhar o `AGENTS.md` com o código.

### 1.6 Sessão
- Terminar sessão por inactividade (configurável, ex.: 30 min) com aviso 1 min antes.
- **[tu]** Confirmar plano pago do Supabase com recuperação a qualquer momento (PITR) e
  fazer um teste de restauro.

---

## Fase 2: modelo de dados de clientes e riscos [dev]

Mexe muito no schema: fazer cedo, antes de a carteira real crescer. Depende de 0.8.

### 2.1 Clientes singulares e colectivos
- `clientes.tipo text check (tipo in ('singular', 'coletivo')) default 'singular'`.
- Singular: `data_nascimento`, `profissao`, `documento_identificacao_tipo/numero`
  (validade), `estado_civil` (opcional).
- Colectivo: `cae`, `designacao_comercial`, `grupo_economico_id` (tabela
  `grupos_economicos`, opcional conforme 0.8).
- Tabela `cliente_contactos` (nome, cargo, telefone, email, principal boolean) para
  colectivos e para famílias.
- Morada estruturada: `morada`, `codigo_postal` (`^\d{4}-\d{3}$`), `localidade`, `pais`.
- Ficha do cliente mostra os campos certos consoante o tipo.

### 2.2 Intervenientes da apólice
- Tabela `apolice_intervenientes` (`apolice_id`, `cliente_id`, `papel` em
  `'tomador' | 'segurado' | 'beneficiario' | 'condutor' | 'pessoa_segura'`, percentagem
  para beneficiários).
- `apolices.cliente_id` continua a ser o tomador (não partir o que existe); a migração
  cria o interveniente `tomador` para as apólices actuais.
- A ficha do cliente mostra também as apólices onde ele é segurado ou beneficiário.

### 2.3 Objectos seguros
- Tabela `objetos_seguros` (`apolice_id`, `tipo` em `'viatura' | 'imovel' | 'pessoa' |
  'outro'`, colunas indexadas para o que se pesquisa: `matricula`, `codigo_postal`;
  resto em `dados jsonb` validado em `src/lib/objetosSeguros.ts` por tipo).
- Viatura: matrícula (formato PT), marca, modelo, ano, categoria. Imóvel: morada, tipo,
  ano de construção, área, capital do edifício e do recheio.

### 2.4 Coberturas estruturadas
- Tabela `apolice_coberturas` (`apolice_id`, `nome`, `capital`, `franquia`,
  `franquia_tipo` em `'valor' | 'percentagem'`, `incluida boolean`).
- Catálogo opcional de coberturas por ramo (`coberturas_catalogo`) para escolher em vez
  de escrever.

### 2.5 Apólice mais completa
- `fracionamento text check (in ('anual', 'semestral', 'trimestral', 'mensal'))`,
  `forma_pagamento` (`'multibanco' | 'debito_direto' | 'transferencia' | 'outro'`),
  `renovacao_automatica boolean`, `motivo_cancelamento`, `apolice_anterior_id`
  (para ligar substituições).

### 2.6 Importação
- Estender `MODELOS` em `importacao.ts` e `COLUNAS` em `ler-carteira.js` com os campos
  novos que façam sentido (tipo de cliente, matrícula, fraccionamento). O teste que
  confirma a mesma ordem tem de continuar a passar.

- **Feito quando:** um cliente colectivo com 3 contactos, uma apólice auto com viatura,
  condutor e coberturas, e uma apólice multirriscos com imóvel se criam e se vêem na
  ficha; dados antigos migrados sem perdas; `test:db` verde.

---

## Fase 3: recibos e cobranças [dev]

O maior buraco. Depende de 0.1 e 0.3. Módulo de permissão novo: `recibos`.

- Tabela `recibos`: `apolice_id`, `numero_recibo`, `periodo_inicio`, `periodo_fim`,
  `premio_total`, `premio_comercial` (base de comissão), `impostos_encargos`,
  `data_emissao`, `data_limite`, `estado` em `'emitido' | 'cobrado' | 'anulado' |
  'estornado'`, `data_cobranca`, `cobrado_por` em `'seguradora' | 'corretora'`,
  `meio_pagamento`, `notas`. Único por `(apolice_id, numero_recibo)`.
- `src/lib/recibos.ts`: gerar os períodos e valores a partir do prémio e do
  fraccionamento (com testes, incluindo arredondamento ao cêntimo e anos bissextos).
- Função `gerar_recibos_previstos(p_apolice)` para quando a seguradora não envia recibos:
  cria recibos `emitido` a partir das regras; recibos importados substituem os previstos.
- `marcar_renovada` passa a gerar os recibos do novo período.
- Página **Recibos**: filtros por estado, seguradora, responsável, intervalo de datas;
  separador "Em dívida" (emitidos com `data_limite` passada); acção "Marcar cobrado" e
  "Anular" (com motivo).
- Ficha do cliente e da apólice: lista de recibos e total em dívida.
- Importação de recibos (CSV e com IA, reutilizando `ler-carteira.js`).
- Dashboard: "Recibos em dívida" (número e valor).
- **Feito quando:** apólice mensal de 600 € gera 12 recibos de 50 €; marcar cobrado
  actualiza a dívida; recibos de uma carteira própria não se vêem por outro mediador.

---

## Fase 4: comissões e conta-corrente [dev]

Depende de 0.2 e 0.3 e da fase 3. Módulo de permissão novo: `comissoes` (por omissão só
o admin).

- Tabela `comissoes_taxas`: `seguradora_id`, `ramo`, `taxa` (percentagem, `numeric(5,2)`),
  `tipo` em `'nova_producao' | 'renovacao'`, `valido_de`, `valido_ate`.
- Tabela `comissoes`: uma linha por recibo cobrado: `recibo_id`, `taxa_aplicada`,
  `valor_previsto`, `valor_recebido`, `data_recebimento`, `estado` em `'prevista' |
  'recebida' | 'divergente' | 'anulada'`. A taxa fica gravada no momento (não recalcular
  o passado quando a tabela de taxas muda).
- Se houver subagentes (0.2): `comissoes_partilha` (`comissao_id`, `profile_id` ou
  angariador externo, percentagem, valor).
- Reconciliação: importar o extracto de comissões de cada seguradora (CSV ou IA), casar
  por número de apólice e recibo, marcar diferenças como `divergente` para revisão.
- `src/lib/comissoes.ts` (cálculo e casamento) com testes.
- Página **Comissões**: previstas vs recebidas por mês e seguradora, lista de divergências,
  exportação.
- **Feito quando:** um extracto de exemplo de cada seguradora principal reconcilia sem
  intervenção manual nos casos normais e as divergências aparecem listadas.

---

## Fase 5: gestão documental [dev + tu]

Depende de 0.7. Módulo de permissão novo: `documentos` (ou herdar do módulo da entidade;
decidir no plano).

- **[tu]** Bucket privado `documentos` no Supabase Storage.
- Tabela `documentos`: `cliente_id` (obrigatório), `apolice_id`, `sinistro_id`,
  `proposta_id` (opcionais), `categoria` em `'apolice' | 'condicoes' | 'carta_verde' |
  'recibo' | 'identificacao' | 'sinistro' | 'proposta' | 'analise_necessidades' |
  'outro'`, `nome`, `caminho`, `mime`, `tamanho`, `versao`, `substitui_id`,
  `carregado_por`, `criado_em`, `arquivado_em`.
- Caminho no bucket: `<cliente_id>/<uuid>-<nome>`. Políticas de `storage.objects` que
  usam `ve_cliente()` a partir do primeiro segmento do caminho; ninguém lista o bucket
  inteiro.
- Tipos aceites: PDF, JPEG, PNG, WEBP, DOCX, XLSX; máximo 10 MB (validar no browser e na
  política). Descarregar só por URL assinado de curta duração.
- Componente de anexos reutilizável (arrastar e largar, lista, pré-visualização de PDF e
  imagem, nova versão) na ficha do cliente, na apólice, no sinistro e na proposta.
- Importação com IA: permitir guardar o PDF lido como documento da apólice criada.
- **Feito quando:** um mediador de carteira própria não consegue descarregar um documento
  de outro cliente nem adivinhando o caminho (teste com cliente Supabase real ou
  documentado em `migracoes.mjs` se o PGlite não cobrir Storage).

---

## Fase 6: conformidade regulatória [dev + cliente]

Depende de 0.4, 0.5 e 0.6. Tudo o que é prazo ou texto legal fica `[por confirmar]`.

### 6.1 Análise de exigências e necessidades (IDD, Lei 7/2019)
- Tabela `analises_necessidades`: `cliente_id` ou `lead_id`, `proposta_id`, `ramo`,
  `respostas jsonb` (questionário por ramo definido em `src/lib/analiseNecessidades.ts`),
  `recomendacao`, `justificacao`, `aceite_pelo_cliente_em`, `feita_por`.
- Uma proposta não passa a `enviada` sem análise associada (regra na base de dados,
  não só na interface).
- Vista de impressão/PDF da análise para o cliente assinar; o documento assinado vai para
  a fase 5 (categoria `analise_necessidades`).

### 6.2 Informação pré-contratual
- Registo do que foi entregue (`documentos_entregues`: tipo, data, canal, prova), ligado à
  proposta. Checklist na proposta antes de a marcar `aceite`.

### 6.3 Reclamações
- Módulo novo `reclamacoes`. Tabela: `cliente_id` (opcional), dados do reclamante,
  `canal`, `recebida_em`, `assunto`, `descricao`, `estado` em `'recebida' | 'em_analise' |
  'respondida' | 'encerrada'`, `prazo_resposta` (calculado a partir de um prazo
  configurável `[por confirmar]`), `respondida_em`, `resposta`, `responsavel_id`.
- Página com alerta de prazos a vencer e relatório anual exportável.

### 6.4 Branqueamento de capitais (Lei 83/2017), só se 0.4 = sim
- Na ficha do cliente singular: pessoa politicamente exposta, origem dos fundos,
  verificação de identidade (data, meio, documento em anexo), nível de risco
  (`baixo | medio | alto`). Colectivo: beneficiários efectivos (tabela própria).
- Uma apólice de Vida com componente financeira não passa a `ativa` sem verificação
  feita.

### 6.5 RGPD (absorve a fase 4 do `PROMPT-ENTREGA.md`)
- "Exportar dados do titular" (JSON/CSV com tudo, incluindo documentos) e "Anonimizar"
  (substitui dados pessoais, mantém apólices e valores para estatística) na ficha, só
  admin.
- **Registo de consultas:** a ficha passa a abrir por uma função `abrir_ficha_cliente(id)`
  que devolve os dados e grava em `acessos_dados` (quem, quando, que cliente). Admin vê o
  registo na ficha.
- Prazos de retenção configuráveis; listagem "a rever para eliminação" (nunca apagar
  automaticamente sem decisão do cliente).
- Consentimentos de marketing separados do consentimento de tratamento, com data e canal.

---

## Fase 7: automação, notificações e comunicação [dev + tu]

Depende de 0.9.

### 7.1 Renovações automáticas
- `pg_cron` diário: função `gerar_renovacoes_pendentes()` cria a renovação `pendente`
  para apólices activas a N dias do fim (N configurável, por omissão 60), atribui ao
  responsável do cliente e cria uma atividade tipo `tarefa`.
- Idempotente (correr duas vezes não duplica). Testado em `migracoes.mjs`.

### 7.2 Notificações internas
- Tabela `notificacoes` (`profile_id`, `tipo`, `titulo`, `ligacao`, `lida_em`).
  Sino no `Layout` com contador (Supabase Realtime).
- Geradas por triggers ou pelo `pg_cron`: lead novo atribuído, tarefa em atraso,
  renovação a vencer, recibo em dívida, sinistro parado há X dias, reclamação a vencer.
- Preferências por utilizador (ver no CRM e/ou resumo diário por email).

### 7.3 Email a partir do CRM
- Tabela `modelos_mensagem` (nome, assunto, corpo com variáveis `{{cliente.nome}}`,
  `{{apolice.numero}}`, ...), gerida pelo admin. `src/lib/modelos.ts` substitui variáveis
  (com testes; variável em falta é erro, não texto vazio).
- `api/enviar-email.js` (Brevo, como `aviso-lead.js`): valida sessão e permissão,
  envia, grava atividade tipo `email` na ficha. Chave só no servidor.
- Modelos de partida: aviso de renovação, recibo em dívida, documentos em falta para
  sinistro, boas-vindas. Texto `[por confirmar]` com o cliente.
- Respeitar consentimento de marketing (6.5) para mensagens que não são de serviço.

### 7.4 Tarefas a sério
- `atividades`: `prioridade`, `hora_prevista`, `lembrete_em`. Vista "As minhas tarefas"
  (hoje, atrasadas, próximas) e exportação `.ics` ou ligação a calendário (decidir no
  plano).

### 7.5 SMS / WhatsApp
- Só se 0.9 pedir. Mesmo padrão de 7.3 com fornecedor a escolher.

---

## Fase 8: sinistros com processo [dev]

- `sinistros`: `data_participacao_seguradora`, `prazo_participacao` (a partir da
  ocorrência, configurável), `perito`, `data_peritagem`, `oficina_prestador`,
  `franquia_aplicada`, `numero_processo_seguradora`, `responsavel_id`.
- Checklist de documentos por ramo (`src/lib/sinistros.ts`): pedidos vs recebidos, ligados
  a documentos da fase 5.
- Linha temporal do sinistro (histórico + atividades + documentos) na ficha do sinistro.
- Alertas: prazo de participação a vencer, sinistro sem movimento há X dias (fase 7).
- Relatório de sinistralidade alimenta a fase 10.

---

## Fase 9: propostas comparativas [dev]

- Tabela `proposta_cotacoes` (`proposta_id`, `seguradora_id`, `premio`, `fracionamento`,
  `coberturas jsonb` ou ligação a coberturas estruturadas, `franquias`, `escolhida
  boolean`). A `proposta` passa a ser o pedido do cliente; as cotações são as opções.
- Quadro comparativo lado a lado e vista de impressão/PDF com a marca BV para enviar ao
  cliente (fica como documento da proposta).
- Aceitar uma cotação cria a apólice pré-preenchida (reutilizar o fluxo de conversão
  existente).

---

## Fase 10: relatórios de gestão e pesquisa [dev]

Módulo novo `relatorios`. Funções SQL `security invoker` (a RLS aplica-se) que agregam no
servidor; nunca descarregar tabelas inteiras para somar no browser.

- Produção: prémios de novas apólices por mês, ramo, seguradora e responsável.
- Carteira: prémios activos por ramo e seguradora; peso de cada seguradora.
- Retenção: taxa de renovação e motivos de não renovação.
- Sinistralidade: sinistros pagos ÷ prémios, por cliente, ramo e seguradora.
- Comissões previstas vs recebidas (fase 4).
- Funil de leads por origem e tempo médio até conversão.
- Venda cruzada: clientes com um só ramo, ordenados por prémio.
- Exportação CSV (reutilizar `src/lib/csv.ts`) e, se pedido, Excel.
- Gráficos seguindo o padrão visual do CRM; cada gráfico com tabela equivalente acessível.
- **Pesquisa global** (Ctrl+K): clientes, NIF, telefone, número de apólice, matrícula,
  número de sinistro, respeitando a RLS. Função SQL única com limite de resultados.

---

## Fase 11: diferenciadores (só planear; não implementar sem novo pedido)

Produzir um documento curto de opções, custos e riscos para cada um:
- Autenticação de dois factores (TOTP do Supabase), imposta na base de dados
  (`auth.jwt()->>'aal' = 'aal2'` em `is_active_user()`), não só no ecrã. Adiada a 30/09/2026.
- Portal do cliente (apólices, documentos, recibos, participar sinistro), com contas e
  RLS separadas da equipa.
- Integração com portais e serviços web das seguradoras para importar apólices,
  recibos e comissões automaticamente.
- WhatsApp Business API.
- Assinatura digital (Chave Móvel Digital ou fornecedor qualificado) em propostas e
  análises de necessidades.
- IA: resumo da ficha, sugestão de venda cruzada, triagem de pedidos de sinistro.

---

## Critérios de conclusão (por fase, tudo verdade)

- [ ] Plano aprovado antes do código.
- [ ] Migração nova + `schema.sql` actualizados; `npm run test:db` verde nos dois
      cenários, com testes de acesso para cada tabela nova.
- [ ] `npm run typecheck`, `npm test`, `npm run build` a passar.
- [ ] Nenhuma funcionalidade existente removida ou alterada sem aprovação.
- [ ] Testado no browser: desktop e telemóvel, teclado, loading/vazio/com dados/erro.
- [ ] Sem `console.log`, sem segredos no cliente, sem dados reais inventados.
- [ ] `documento.md`, `public/manual.html` (se aplicável) e o **Estado** deste ficheiro
      actualizados.
- [ ] Migração a correr no Supabase de produção listada como tarefa **[tu]**, com a
      ordem certa.
