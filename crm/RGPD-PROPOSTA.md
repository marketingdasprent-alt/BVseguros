# RGPD no CRM: proposta (fase 4.a, para validar)

> **Estado (06/10/2026): validada e implementada** (as 4 decisões do fim, como propostas).
> Ajustes na implementação: os clientes não têm notas; campos obrigatórios (sinistro,
> pedido de sinistro) passam a "anonimizado" em vez de ficarem vazios; as ações ficam num
> painel próprio no fim da ficha, não no cabeçalho. Ver crm/README.md, secção RGPD.

## 1. Exportar dados de um cliente (direito de acesso e portabilidade)

**Onde:** ficha do cliente, menu de ações, "Exportar dados" (só admin).

**O que entra:** o cliente; o lead de origem (`lead_origem_id`); apólices, propostas,
renovações e sinistros das apólices; atividades; pedidos de sinistro do site ligados ao
cliente; o histórico de alterações desse cliente.

**Formato:** dois ficheiros, gerados no browser:
- **Excel (.xlsx)**, uma folha por tipo (Cliente, Apólices, Propostas, ...), para a pessoa
  ler. Em vez de CSV, pelo mesmo motivo da importação.
- **JSON**, com tudo junto, para portabilidade (formato estruturado que o RGPD pede).

**Registo:** cada exportação fica no histórico do cliente ("Exportado por X em ..."), sem
copiar os dados exportados.

**Base de dados:** uma função `exportar_cliente(p_id)` (`security definer`, só admin) que
devolve tudo numa ida e escreve o registo. Evita 8 leituras do browser e garante que o
registo fica sempre feito.

## 2. Revisão por prazo (nada é apagado sozinho)

**Onde:** Administração, nova página "Revisão de dados" (só admin).

**O que lista:**
| Lista | Critério |
|---|---|
| Leads perdidos | estado "perdido" e sem alterações há mais do que o prazo |
| Pedidos do site sem resposta | lead do site em "novo", sem responsável, há mais do que o prazo |
| Pedidos de sinistro do site | arquivados há mais do que o prazo |

Cada linha: nome, data, há quanto tempo, e botões para abrir o registo, apagar ou (no
caso de clientes) anonimizar. Apagar usa o que já existe, com confirmação.

**Prazo:** 12 meses por omissão (proposta do questionário, ponto 7), numa constante em
`lib/`. Quando o cliente responder, muda-se o número. Sem tabela de configuração por agora.

**Base de dados:** só leitura com os filtros acima; sem migração.

## 3. Anonimizar um cliente (direito ao apagamento, mantendo a estatística)

**Onde:** ficha do cliente, menu de ações, "Anonimizar" (só admin).

**Confirmação:** modal com o que vai acontecer e o nome do cliente escrito à mão para
confirmar. Irreversível.

**O que passa a marca neutra:**
| Registo | Campos |
|---|---|
| Cliente | nome passa a "Cliente anonimizado (ab12cd34)"; telefone "anonimizado"; email, NIF, morada e notas ficam vazios |
| Lead de origem | o mesmo (nome, telefone, email, mensagem do site, notas) |
| Pedidos de sinistro do site | nome, email, telefone, descrição, local, respostas (`detalhes`) e notas |
| Sinistros e atividades | descrição, título e notas (texto livre pode ter dados pessoais) |
| Histórico de alterações | os valores antigos e novos guardados apagam-se; fica "Anonimizado por X em ..." |

**O que fica (estatística):** apólices (nº, ramo, seguradora, prémio, datas, estado),
propostas, renovações, sinistros (datas, estado, valores), responsável e datas de criação.

**Base de dados:** uma função `anonimizar_cliente(p_id, p_confirmacao)` (`security
definer`): confirma que é admin e que o nome bate, faz tudo numa transação e escreve o
registo. O gatilho do histórico tem de ficar de fora durante esta operação; caso
contrário, guardaria no histórico os dados que se querem apagar.

## 4. Impacto

- **Migração nova** `supabase/migrations/2026-10-xx_rgpd.sql` + `schema.sql`: as duas
  funções e o histórico a aceitar as ações "exportado" e "anonimizado" (hoje só aceita
  criado, alterado, apagado). Testada com `npm run test:db` nos dois cenários e corrida
  por ti no SQL Editor **antes** do deploy do CRM.
- **RLS:** sem políticas novas; as funções verificam `is_admin_user()` lá dentro.
- **Código:** `hooks/useRgpd.ts`, `lib/rgpd.ts` (prazo, montagem do Excel/JSON, com
  testes), 2 modais na ficha do cliente, 1 página em Administração.
- **Política de privacidade do site:** a secção 4 passa a dizer os prazos reais (resposta 7
  do questionário) e que há revisão periódica; a secção 7 pode indicar que o pedido de
  acesso é respondido com uma exportação dos dados.

## Decisões para validar

1. Exportar em **Excel + JSON** (em vez de CSV + JSON).
2. Prazo de **12 meses** como constante, até o cliente responder.
3. Na anonimização, limpar também o **texto livre** de sinistros e atividades, e os
   valores do **histórico** (mais seguro; perde-se o detalhe do que foi escrito).
4. Pedidos de sinistro do site também entram na revisão por prazo, apesar de "ficarem
   todos guardados" (decisão de 30/09): proposta é listá-los só para rever, sem sugerir
   apagar. Ou ficam de fora?
