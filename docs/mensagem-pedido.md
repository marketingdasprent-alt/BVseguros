# Mensagem do pedido de proposta: diagnóstico (fase 1)

> **Estado (02/10/2026): fase 2 aplicada.** Decisões: formato como abaixo; bloco
> "Quem pede"; o ecrã "Confirme o pedido" mantém os títulos do formulário; sem coluna
> nova; níveis do automóvel com os nomes da página (Essencial, Intermédio, Completo),
> com o nível da página já marcado no formulário. Nos exemplos abaixo, onde se lê
> "Só o obrigatório" passa a ler-se "Essencial".

Fase 1 de [`PROMPT-MASTER-MENSAGEM-PEDIDO.md`](../PROMPT-MASTER-MENSAGEM-PEDIDO.md),
feita a 02/10/2026. Só diagnóstico: nenhum código alterado. Base: `src/data/formularios.ts`,
`src/utils/montarMensagem.ts`, `src/sections/ContactoForm.tsx`, `src/pages/PaginaPedido.tsx`
e, no CRM, `LeadCard.tsx`, `NovoLeadModal.tsx` e `api/aviso-lead.js`.

## Achados novos (além dos da secção A do prompt)

1. **"Situação: Sim" nos acidentes de trabalho.** O passo "Quem trabalha" tem as
   opções "Sim" e "Não, tenho trabalhadores", por isso o CRM recebe "Situação: Sim",
   que sozinho não quer dizer nada. O resumo tem de traduzir o valor
   ("Trabalhador independente" / "Com trabalhadores").
2. **Dois níveis no automóvel.** Quem vem da tabela de níveis da página do ramo traz
   `Nível de proteção pretendido: Essencial` (contexto, primeira linha) e depois
   escolhe no formulário `Nível de proteção: Só o obrigatório`. Os nomes não batem
   (Essencial/Intermédio/Completo contra Só o obrigatório/Danos próprios/Proteção
   completa) e podem até contradizer-se. Proposta: na mensagem fica uma linha só,
   a do formulário, e o nível da página só aparece se o formulário não tiver
   resposta. Alinhar os nomes dos níveis é uma decisão à parte (ver fim).
3. **"Matrícula: Ainda não tem".** O valor interno do "Ainda não tenho matrícula"
   chega como está. No resumo: "Matrícula: sem matrícula" e o motivo no mesmo bloco.
4. **Dois NIF no automóvel.** Quando o seguro não fica em nome do condutor, o bloco
   "Quem fica com o seguro" traz nome e NIF do tomador, e o bloco final "Contacto"
   traz o NIF de quem pede. Com os títulos atuais não se percebe qual é qual.
5. **Rótulos que já são bons** (não precisam de versão de resumo): Matrícula,
   Combustível, Motivo, Finalidade, Banco do crédito, Preferência, Situação
   (habitação), Atividade, Código CAE, Tipo de seguro.

## Títulos dos blocos

| Ramo | Hoje | Resumo |
|---|---|---|
| Automóvel | A matrícula · Sem matrícula · O veículo | **Veículo** (os três juntos) |
| | O condutor | **Condutor habitual** |
| | Quem fica com o seguro | **Tomador do seguro** |
| | A proteção · Extras | **Proteção** (juntos) |
| Vida | Para que é · O seguro | **Seguro de vida** (juntos) |
| Saúde | Para quem é · As pessoas | **Pessoas seguras** |
| | O que procura · Detalhes | **Preferências** |
| Habitação | O imóvel | **Imóvel** |
| Acidentes de trabalho | Quem trabalha · A atividade | **Empresa** |
| Outros seguros | O pedido | **Pedido** |
| Todos | Contacto (NIF, código postal) | **Quem pede** |

## Rótulos de resumo por campo

| Campo (`nome`) | Rótulo hoje | Resumo |
|---|---|---|
| `tipo_veiculo` | Tipo de veículo | Tipo |
| `uso` | Uso do veículo | Uso |
| `modelo` | Modelo e versão | Modelo |
| `data_matricula` | Data da 1.ª matrícula | 1.ª matrícula |
| `importado` | Veículo importado? | Importado |
| `data_matricula_pt` | Data da matrícula portuguesa, se for importado | Matrícula portuguesa |
| `atrelado` | Leva atrelado ou reboque (bicicletas, pranchas, animais, mota)? | Atrelado ou reboque |
| `nascimento_condutor` | Data de nascimento do condutor habitual | Data de nascimento |
| `data_carta` | Data da carta de condução | Carta desde |
| `seguro_em_nome` | O seguro fica em nome do condutor habitual? | Seguro em nome do condutor |
| `anos_seguro` | Há quantos anos tem seguro automóvel em seu nome? | Anos com seguro em nome próprio |
| `sinistros` | Teve sinistros com culpa nos últimos 5 anos? | Sinistros com culpa (5 anos) |
| `tomador_nome` / `tomador_nif` | Nome / NIF de quem fica com o seguro | Nome / NIF |
| `protecao` | Nível de proteção | Nível |
| `extras` | Coberturas extra | Extras |
| `inicio` | Início do seguro | Início |
| `montante` | Montante em dívida (€) | Montante em dívida |
| `anos_credito` | Anos que faltam do crédito | Anos de crédito em falta |
| `trocar_banco` | Quer trocar o seguro de vida que tem no banco? | Trocar o seguro do banco |
| `capital` | Capital pretendido (€) | Capital pretendido |
| `para_quem` | Para quem é | Para quem |
| `pessoas` / `idades` | Idades das pessoas seguras / Idades aproximadas | Idades |
| `n_pessoas` | Nº de pessoas | Nº de pessoas |
| `necessidade` | O mais importante | Prioridade |
| `tem_seguro` | Já tem seguro de saúde? | Já tem seguro de saúde |
| `pagamento` | Como prefere pagar? | Pagamento |
| `tipo_imovel` | Tipo de imóvel | Tipo |
| `utilizacao` | Habitação permanente ou secundária? | Habitação |
| `segurar` | O que quer segurar? | A segurar |
| `credito` | Tem crédito habitação? | Crédito habitação |
| `morada_imovel` / `codigo_postal_imovel` | Morada / Código postal do imóvel | Morada / Código postal |
| `area` | Área aproximada (m²) | Área |
| `construcao` | Tipo de construção | Construção |
| `independente` | Situação ("Sim" / "Não, tenho trabalhadores") | Situação: **Trabalhador independente** / **Com trabalhadores** |
| `empresa` / `nipc` | Nome da empresa / NIPC da empresa | Nome / NIPC |
| `trabalhadores` | Nº de trabalhadores | Trabalhadores |
| `massa_salarial` | Massa salarial anual (€) | Massa salarial anual |
| `descricao` | O que precisa de segurar? | Descrição |

Valores: euros como `150 000 €` (formato pt-PT), área como `120 m²`, datas `dd/mm/aaaa`,
código postal `2410-232 Pousos, Leiria` (sem parênteses), escolhas múltiplas por vírgula.

## Linha de resumo por ramo

| Ramo | Linha |
|---|---|
| Automóvel | `Automóvel · BT-84-HL · Só o obrigatório` (sem matrícula: o modelo, ou "sem matrícula") |
| Vida | `Vida · Crédito habitação · 150 000 €` (montante ou capital) |
| Saúde | `Saúde · 3 pessoas (38, 36, 8) · Consultas e exames` |
| Habitação | `Multirriscos habitação · Apartamento · 2410-232 Pousos, Leiria · Ambos` |
| Acidentes de trabalho | `Acidentes de trabalho · Construções Silva, Lda. · 12 trabalhadores` |
| Outros seguros | `Outros seguros · Viagem` |
| Sem ramo | `Pedido de proposta` (só a mensagem livre) |

## Exemplos completos

Automóvel (o pedido real da captura):

```
Automóvel · BT-84-HL · Só o obrigatório

[Veículo]
Matrícula: BT-84-HL
Tipo: Ligeiro
Uso: Particular
Importado: Não
Atrelado ou reboque: Não

[Condutor habitual]
Data de nascimento: 04/04/2001
Carta desde: 04/04/2020
Seguro em nome do condutor: Sim

[Proteção]
Nível: Só o obrigatório

[Quem pede]
NIF: 338437517
Código postal: 2410-232 Pousos, Leiria
```

Vida:

```
Vida · Crédito habitação · 150 000 €

[Seguro de vida]
Finalidade: Crédito habitação
Montante em dívida: 150 000 €
Anos de crédito em falta: 28
Banco do crédito: CGD
Trocar o seguro do banco: Sim

[Quem pede]
NIF: …
Código postal: …
```

Acidentes de trabalho:

```
Acidentes de trabalho · Construções Silva, Lda. · 12 trabalhadores

[Empresa]
Situação: Com trabalhadores
Nome: Construções Silva, Lda.
NIPC: 5XXXXXXXX
Atividade: Construção civil
Código CAE: 41200
Trabalhadores: 12
Massa salarial anual: 180 000 €
```

(Saúde, habitação e outros seguem o mesmo molde, com os títulos e rótulos das tabelas.)

## Leitor partilhado (CRM e email)

- **CRM:** `src/lib/mensagemSite.ts` em TypeScript, com testes, usado pelo modal e
  pelo cartão do Kanban. Lê o formato novo e o antigo (limpa `?` e artigos na leitura).
- **Email** (`api/aviso-lead.js`, JavaScript que não importa de `src/`): recomendo
  **não** duplicar o leitor. Com o formato novo o texto já se lê bem, por isso o
  email mostra a linha de resumo em destaque (primeira linha) e o resto com
  `pre-line` e os títulos `[…]` a negrito por uma substituição simples, com teste.
  Mais simples de manter do que dois leitores.
- `RAMOS.outro` passa a "Outros seguros" no email.

## Decisões para avançar

1. Formato e ordem dos blocos como acima.
2. Bloco com NIF e código postal: **"Quem pede"** (proposta; distingue do "Tomador do
   seguro" no automóvel) ou "Dados para a proposta".
3. O ecrã "Confirme o pedido" do site: manter os títulos do formulário (proposta: é o
   visitante que lê, e lá o tom de conversa ajuda) ou passar aos curtos.
4. Coluna `detalhes jsonb` nos leads: proposta **não agora**; o formato novo resolve a
   leitura sem migração.
5. (Novo) Níveis do automóvel: alinhar os nomes da tabela da página com os do
   formulário. Proposta: tratar à parte, porque mexe em copy de produto.
