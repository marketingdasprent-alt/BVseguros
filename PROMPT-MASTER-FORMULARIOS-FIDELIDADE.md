# Prompt master: formulários de proposta ao nível dos simuladores da Fidelidade

Prompt para o agente que vai refazer os formulários de pedido de proposta do site
(pop-up `ModalProposta`). Mexe **só no site** (raiz). Não mexe em `crm/` nem na base
de dados. Copiar a partir de "Papel".

Origem: pedido do João (01/10/2026): "pega os formulários da Fidelidade como base".
Três correções concretas pedidas por ele: a matrícula aceita mais caracteres do que
devia (máximo 6, sem contar os hífenes), há carros sem matrícula, e o NIF não pode
ser opcional. Sugeriu a API [moradas.dev](https://moradas.dev/docs) para o código
postal.

Estado: **implementado** (01/10/2026), com as respostas por omissão da secção E
(NIF opcional nos sinistros, telefone fixo aceite, três níveis e quatro extras no
automóvel, morada só do imóvel). Análise da Fidelidade feita a 01/10/2026
(secção A): automóvel (com e sem matrícula) e saúde completos até ao Resumo.

---

## Papel

És o developer front-end da BV Seguros. O site já tem um pedido de proposta por ramo
que abre num pop-up, com validações próprias (NIF, telefone, matrícula, código
postal), Turnstile e envio por `/api/pedido` para o CRM. Vais transformá-lo num
**formulário por passos**, ao estilo dos simuladores da Fidelidade (um tema por ecrã,
barra de progresso, erros por campo, máscaras que formatam enquanto se escreve), e
corrigir os três problemas apontados pelo João. A BV é corretora: no fim não há preço,
há um resumo e o envio do pedido.

## Leitura obrigatória

- `AGENTS.md` da raiz, `BLUEPRINT.md`, `docs/design-system.md` (ModalProposta,
  ContactoForm por ramo, Input, `.choice-group`), `docs/content-style.md` (sem
  travessão), `docs/anti-ai.md`, `docs/agent-protocol.md`.
- `DECISIONS.md`: entradas de 2026-09-30 (formulário dinâmico por ramo, opção A
  "detalhes na mensagem do lead", pop-up `ModalProposta`, prefixo `d_`).
- Código: `src/sections/ContactoForm.tsx`, `src/components/forms/*`
  (`CamposBase`, `CamposRamo`, `InputValidado`, `Input`, `VerificacaoHumana`),
  `src/data/formularios.ts`, `src/data/formulariosSinistro.ts`,
  `src/utils/validacoes.ts`, `src/utils/montarMensagem.ts`,
  `src/utils/enviarContacto.ts`, `src/components/feedback/ModalProposta.tsx`,
  `src/app/proposta.ts`, `src/pages/legal/Privacy.tsx`, `api/pedido.ts`,
  `tests/validacoes.test.mjs`.

---

## A. O que a Fidelidade faz (analisado a 01/10/2026)

### A.1 Simulador automóvel (`simuladores.fidelidade.pt/SAWR_WebSimulator`)

**Ecrã 0, entrada.** Título "Comece por indicar a matrícula do seu carro".
- Matrícula em **três caixas de 2 caracteres** (`maxlength=2` cada, placeholder `XX`),
  separadas por pontos, com a faixa azul "P" à esquerda, desenhada como uma chapa.
  Total: 6 caracteres, nunca mais.
- **Defeito encontrado:** colar uma matrícula inteira (ex.: `aa00aa`) só cola os dois
  primeiros caracteres na primeira caixa; o resto perde-se e a pessoa tem de escrever
  tudo à mão. Nós não copiamos isto (ver C.3, colar).
- Link "**Ainda não tenho matrícula**": desativa as caixas (ficam cinzentas) e o link
  passa a "Tenho matrícula". O simulador continua sem matrícula.
- "Uso do veículo": botões segmentados **Uso particular** / **Outros fins**, com
  "Uso particular" escolhido por omissão.
- Botões "Recuperar simulação" e "Começar a simulação".

**Ecrã 0b, exemplo de preço (só com matrícula).** Com a matrícula preenchida, antes
de pedir qualquer dado pessoal, a Fidelidade identifica o carro e mostra um cartão
escuro: "O seu seguro desde 22,14€/mês", a matrícula formatada (`AA-00-AA`), marca,
modelo e combustível (ex.: "RENAULT CLIO Gasolina") com o logótipo da marca, e a lista
do que inclui (Responsabilidade Civil, Assistência em Viagem, Proteção ao Condutor).
Dois botões: "Quero ser contactado" e "Personalizar simulação". Um texto que abre e
fecha explica os pressupostos do exemplo, e com isso mostra **os fatores que pesam no
preço**: data da carta, morada e código postal, zona de circulação, anos com seguro
em nome próprio, anos sem sinistros (5 ou mais).

**Barra de progresso** fixa no topo: Dados pessoais, Dados do veículo, Coberturas,
Resumo. O passo atual a vermelho, os outros a cinzento.

**Ecrã 1, Dados pessoais (condutor).** "Damos o primeiro passo? Por favor, fale-nos um
pouco sobre o condutor".
- Nome completo (até 50), NIF (até 9), Data de nascimento (AAAA-MM-DD, com
  calendário e instruções de teclado para leitor de ecrã), Género (select), Data da
  carta de condução (data completa, não só o ano).
- "Para além de ser a pessoa que vai conduzir esta viatura com mais frequência, o
  seguro ficará em seu nome?" Sim/Não segmentado, com ícone de ajuda.
- Caixa "Porque precisamos dos seus dados?" com a finalidade (pré-contratual e
  acompanhamento comercial) e link para a política de privacidade.
- Tudo obrigatório. Erros por baixo de cada campo, só depois de tentar avançar:
  "Por favor, preencha o NIF para continuar". O NIF é verificado no servidor ao
  avançar: "NIF particular inválido. Por favor, confirme os dados e tente
  novamente" (aceita só NIF de pessoa singular neste simulador). Não valida ao sair
  do campo e deixa escrever letras no NIF.

**Ecrã 2, Contactos.** Título personalizado com o nome: "Teste Exemplo, precisamos de
alguns dados essenciais".
- Email (até 50), Telemóvel (`inputmode=numeric`, formata para `912 345 678`),
  Código postal (máscara `0000-000`, ícone de localização; ao escrever `1000001`
  aparece `1000-001`).
- O código postal atribui logo o agente mais próximo (painel lateral "Agente").
- Email mal escrito: "E-mail inválido. Por favor, confirme os dados e tente
  novamente". Email com domínio inexistente: "Por favor confirme o e-mail
  introduzido" (verificam o domínio no servidor). Telemóvel inválido: "Número de
  telemóvel inválido...".

Os ecrãs seguintes foram vistos a 01/10/2026 com os dados reais de alguém da equipa
(preenchidos por essa pessoa) e uma matrícula verdadeira. Não ficam aqui os valores.

**Ecrã 3, Dados do veículo.** "Estamos quase lá! Agora que temos os seus dados,
confirme os dados do seu veículo."
- Tipo de veículo: **Ligeiro / Motociclo** (rádio, com ajuda: "Ligeiros para veículos
  de quatro rodas e Motociclos para motociclos, ciclomotores e moto 4").
- **Data da 1.ª matrícula** (data completa, não o ano).
- **Marca** (lista fixa de 47 marcas, de ABARTH a VOLVO), **Modelo** (lista que
  depende da marca, com o combustível no nome: "Clio Diesel") e **Versão** (lista
  que depende do modelo: motor, nível de equipamento, caixa).
- Com matrícula, tipo, data, marca, modelo e "importado" vêm **preenchidos e
  bloqueados** (cinzentos) a partir da base de dados da matrícula; só a versão fica
  para escolher, porque o mesmo modelo tem várias.
- **Sem matrícula** (percorrido a 01/10/2026 com um carro fictício):
  - Os campos vêm vazios e por preencher. "Veículo importado?" vem **sem nada
    escolhido** (com matrícula vinha preenchido) e é obrigatório.
  - **As listas encadeiam-se**: a lista de marcas fica vazia até haver data da 1.ª
    matrícula; a data decide que marcas aparecem (para 2026, 67 marcas, incluindo
    BYD, MG, CUPRA, POLESTAR, LEAPMOTOR, XPENG; para 2017, as 47 de antes, com LANCIA,
    LOTUS, MORGAN...). A marca decide os modelos (40 da Renault em 2026, com a
    motorização no nome: "Clio VI", "Clio VI Hibrido", "Kangoo Van E-Tech"); o modelo
    decide as versões (motor, nível, potência, portas e ano de lançamento:
    "Clio 1.2 TCe Evolution (115Cv) - (5p) - (25-)").
  - **Regra de negócio**: "Apenas pode simular veículos sem matrícula com idade
    inferior a 30 dias". Ou seja, "sem matrícula" é só para **carros novos** (1.ª
    matrícula nos últimos 30 dias ou ainda por matricular). Data no futuro: "Não é
    possível simular para veículos com data de matrícula futura. Por favor corrija a
    informação e tente novamente". O calendário não deixa escolher meses depois do
    atual.
  - "Deseja incluir os opcionais de marca?" só aparece **depois de escolher a versão**.
  - Erros com campos vazios: "A data da 1.ª matrícula é obrigatória", "Por favor,
    escolha a marca / o modelo / a versão do seu veículo para continuar", "Por favor,
    indique se o veículo é importado".
  - Defeitos: por instantes aparece "Required field!" em inglês por baixo do modelo e
    da versão; as mensagens de erro **não desaparecem** depois de o campo ser
    preenchido (a marca e o modelo escolhidos continuam com "Por favor, escolha...");
    escrever uma data por cima de outra baralha o campo (`2020-03-15` escrito por cima
    de `2027-01-01` deu `2026-12-31`).
  - O ecrã do histórico aparece também sem matrícula, com o carro escolhido: o
    histórico é procurado por quem fica com o seguro (NIF), não pelo carro.
  - **As coberturas mudam com a idade do carro**: para o carro novo, os planos foram
    Auto 1, **Auto 3** ("um plano acessível, que lhe assegure uma maior proteção":
    furto, incêndio e fenómenos da natureza, sem choque nem colisão) e **Auto 4**, este
    o recomendado; para o carro de 2017 eram Auto 1, Autoestima (recomendado) e Auto 4.
- "O seu veículo circula com atrelado ou reboque para transportar equipamentos (como
  bicicletas, pranchas, animais ou motociclos)?" Sim/Não, Não por omissão.
- "Veículo importado?" Sim/Não. Se Sim: **Data da matrícula portuguesa**.
- "Deseja incluir os opcionais de marca?" Sim/Não, Não por omissão (equipamento de
  fábrica acima da versão base; só conta nos planos com danos próprios).

**Ecrã 3b, Histórico.** "Com base nos dados fornecidos, obtemos este histórico. Por
favor, confirme a informação apresentada." Cartão "Histórico do tomador" com a
matrícula e o carro, e três linhas que a Fidelidade **vai buscar sozinha** (base de
dados do setor): Nº de anos com seguro em seu nome, Nº de anos sem sinistros, Nº de
sinistros com responsabilidade nos últimos 5 anos. Não se edita: "Caso identifique
alguma incoerência nos dados apresentados, solicite um contacto aqui."

**Ecrã 4, Coberturas.** Ecrã de espera ("Aguarde mais um momento. Estamos a criar a
sua recomendação personalizada"), depois "Estas são as opções mais adequadas".
- **Início do seguro** (amanhã por omissão) com "Alterar opção".
- Três planos lado a lado com preço anual, uma frase e "Selecionar" / "Ver Detalhe":
  - **Auto 1**: "a proteção obrigatória por lei com acesso a uma assistência em
    viagem com serviços mínimos";
  - **Autoestima**, marcado "Recomendado" e já selecionado: "danos próprios para
    carros usados";
  - **Auto 4**: "o plano mais completo de danos próprios, para carros novos e
    semi-novos".
- Tabela de coberturas por linha, "Incluído" / "Não incluído" / "Adicionar
  cobertura", algumas com escolha de valor: franquia (0 a 10.000 €), responsabilidade
  civil (mínimo obrigatório ou 50 milhões), choque, colisão ou capotamento, furto ou
  roubo, incêndio, fenómenos da natureza, vandalismo, assistência em viagem (Standard
  ou VIP), proteção jurídica, quebra isolada de vidros, veículo de substituição
  (acidente, ou acidente e avaria; económico, familiar ou executivo), proteção ao
  condutor, proteção vital do condutor, ocupantes, responsabilidade civil carga.
- Periodicidade "Anual". Texto "Sobre a simulação": a simulação vale 30 dias e os
  pressupostos estão sujeitos a confirmação.

**Ecrã 5, Resumo.** "Concluiu a sua simulação! Receberá os detalhes no seu e-mail."
Número da simulação, preço, matrícula, "Tomador e Condutor habitual", plano,
periodicidade, "Ver detalhe do plano". "Como prefere avançar?": **Comprar online** ou
**Quero ser contactado**, e o botão "Avançar para contratação". Parámos aqui, sem
carregar em nenhum.

### A.2 Simulador de saúde (`simuladores.multicare.pt`)

- Ecrã 0: "Antes de começarmos": "Tem seguro de saúde? (Opcional)" Sim/Não, e
  convite para login de cliente.
- Ecrã 1: "Diga-nos que tipo de proteção procura", três **cartões de opção**:
  para mim e/ou a minha família; saúde oral; alteração de condições da minha apólice.
- Ecrã 2: igual ao do automóvel (nome até 150, NIF, data de nascimento, género) com a
  mesma caixa "Porque precisamos dos seus dados?". O NIF de teste `123456789` é
  rejeitado: têm uma lista de NIFs de exemplo bloqueados.
- Barra: Proteções, Dados pessoais, Coberturas, Resumo.

Os ecrãs seguintes foram vistos a 01/10/2026 com os dados reais de alguém da equipa
(preenchidos por essa pessoa); a segunda pessoa e as escolhas são fictícias.

- "Tem seguro de saúde?" com Sim não faz aparecer mais nenhum campo (nem seguradora).
- **Ecrã 3, Pessoas e necessidades.** "Estamos quase lá! Diga-nos o que precisa, para
  podermos recomendar-lhe o seguro mais adequado às suas necessidades."
  - Caixa "Para quem se destina esta simulação?" com a pessoa n.º 1 já preenchida a
    partir do ecrã 2, num cabeçalho que abre e fecha: "{nome} nº 1, {idade} anos".
    Dentro, segmentado **Seguro para mim e outros** / **Só quero ser Tomador**, com a
    explicação "O Tomador do Seguro é quem celebra o contrato com a Fidelidade e paga o
    prémio. Pode ou não ser beneficiário e contratar para si ou para a família."
  - "**+ Adicionar pessoas**": cada clique acrescenta um cartão "Pessoa Segura nº 2"
    com **só a idade** (2 dígitos, `maxlength=2`, aceita só números; uma letra
    escrita é descartada) e um ícone de caixote do lixo para a tirar. Não pede nome,
    data de nascimento nem relação.
  - "Com qual destas afirmações se identifica mais?", cinco cartões de opção, uma
    escolha obrigatória:
    - "Quero estar protegido mas procuro um seguro com um custo mais acessível";
    - "Quero consultas regulares e capital para internamento";
    - "Quero um seguro que inclua acesso a consultas, exames, tratamentos e até parto";
    - "Preocupo-me com doenças graves e oncológicas e quero um seguro que me proteja";
    - "Quero um seguro que me permita ter cuidados dentários".
  - Botão "**Calcular**". Vazio dá "Por favor, preencha a idade para continuar" e
    "Por favor, escolha uma das frases para continuar". Defeito: esta segunda mensagem
    aparece repetida por baixo de **cada um** dos cinco cartões, em vez de uma vez só.
  - Nenhuma pergunta sobre o estado de saúde.
- **Ecrã 4, Coberturas.** Resumo editável no topo: "Pessoas incluídas: 2", "Preferência:
  Dia a dia" (a frase escolhida, resumida), "Fracionamento: Mensal" (Mensal,
  Trimestral, Semestral ou Anual), cada um com "Alterar". Três planos com preço por
  mês, um "Recomendado" já selecionado: só internamento e rede a preços convencionados;
  internamento mais consultas; internamento, parto, consultas e tratamentos dentro ou
  fora da rede. Tabela longa de coberturas (oncologia, internamento, parto, saúde
  mental, ambulatório, consultas, medicina online, domicílio, dentária, ótica,
  medicamentos, assistência em viagem, doenças graves, medicina preventiva...), com
  "Incluído" / "Não incluído" / "Adicionar cobertura". O texto final avisa que a
  seguradora pode pedir exames médicos antes de aceitar.
- **Ecrã 5, Resumo.** Igual ao do automóvel: número da simulação, preço por mês e por
  ano, pessoas seguras, plano, fracionamento, "Comprar online" / "Quero ser
  contactado" / "Avançar para contratação". Parámos aqui, sem carregar em nenhum.

### A.3 Casa e Vida crédito habitação (`fidelidade.pt`)

Não há simulador: há um formulário curto de "ligamos-lhe de volta" (HubSpot), igual
nas duas páginas:
- Primeiro nome*, Último nome*, NIF* (`type=number`, 9), Código postal*, Email*,
  Telemóvel* (9), "Declaro que li e aceito a Política de Proteção de Dados*".
- Texto: "Preencha os campos com os seus dados e ligamos-lhe de volta sem qualquer
  compromisso ou qualquer custo para si". Botão "**Liguem-me**".
- Na página principal de Habitação, o botão "Simular o seu seguro" não leva a lado
  nenhum (`href=""`). A FAQ diz o que pesa no preço: tipo de construção, idade do
  edifício, localização.

### A.4 Padrões comuns a copiar

1. Um tema por ecrã, com barra de progresso e "Anterior"/"Próximo".
2. Títulos conversacionais e personalizados com o primeiro nome.
3. **NIF e código postal obrigatórios em todos os pedidos**, incluindo os curtos.
4. Máscaras que formatam enquanto se escreve (código postal, telemóvel) e campos com
   o tamanho exato do dado (matrícula 3 x 2, NIF 9).
5. Botões segmentados para escolhas curtas (Sim/Não, Particular/Outros fins) e
   cartões grandes para a primeira escolha.
6. Erros por campo, só depois de tentar avançar, com frase completa.
7. Caixa "Porque precisamos dos seus dados?" junto aos dados pessoais.

### A.5 O que **não** copiamos, e porquê

- **Género**: não é preciso para pedir propostas e a lei europeia proíbe usá-lo no
  preço. Não perguntar.
- **Recuperar simulação** e **atribuição de agente** pelo código postal: não temos
  sessão guardada nem rede de agentes. Fora.
- **Guardar dados a cada passo** (a Fidelidade fica com o contacto mesmo que a pessoa
  desista): nós só enviamos no fim, com consentimento. Não guardar nada parcial, nem
  em `localStorage`.
- **Verificação do domínio do email no servidor**: fora de âmbito. Em vez disso,
  sugestão de correção de domínios comuns (ver C.4).
- NIF que aceita letras e só valida no servidor: o nosso já valida no browser, manter.

---

## B. Regras que não se negoceiam

- PT-PT, sem travessão (o `npm run qa` procura-o também neste tipo de ficheiros).
- Sem dados inventados. Contactos e textos legais ainda por confirmar continuam
  `PorConfirmar` / `[por confirmar]`.
- **Saúde e Vida: nunca perguntar doenças, tratamentos, peso, tabaco** ou qualquer
  dado de saúde (art. 9.º RGPD). Idades e datas de nascimento sim.
- **Opção A mantém-se**: os campos do ramo seguem para o CRM dentro de `p_mensagem`
  (`montarMensagem`, limite 2000). Sem colunas novas, sem migração, sem mexer em
  `api/pedido.ts` nem em `crm/` (CRM em pausa, decisão do João de 30/09).
- O pop-up continua a ser o `<dialog>` nativo do `ModalProposta`. Nada de bibliotecas
  novas de formulários ou de passos.
- Reutilizar antes de criar: `InputValidado`, `Input`, `CamposRamo`,
  `.choice-group`/`.choice`, `.form-grid`, tokens. Qualquer padrão visual novo
  (chapa de matrícula, barra de passos, cartões de opção) passa por
  `docs/anti-ai.md` e fica registado em `docs/design-system.md` e `DECISIONS.md`
  (Level 2).
- `.card-grid` para qualquer conjunto de caixas (cartões de opção incluídos);
  `npm run qa:layout` a passar.

---

## C. O que construir

### C.1 Formulário por passos (`ContactoForm`)

Passos para qualquer ramo (o automóvel tem mais um, ver C.3):

| Passo | Título (exemplo) | Conteúdo |
|---|---|---|
| 1. O seguro | "Que seguro procura?" | Só no pop-up genérico: tipo de seguro em **cartões de opção** (ícone `RamoIcon` + nome), em vez do `select`. Escolher avança. Numa página de ramo este passo não existe. |
| 2. Sobre o seguro | conforme o ramo | Perguntas do ramo (`FORMULARIOS[ramo]`, revistas em C.3). |
| 3. Os seus dados | "Agora, os seus dados" | Nome, NIF, email, telemóvel, código postal (C.2). Caixa "Porque pedimos estes dados?". |
| 4. Rever e enviar | "{Primeiro nome}, confirme o pedido" | Resumo legível de tudo, com "Alterar" por bloco que volta ao passo. "Algo mais que devamos saber?", consentimento, Turnstile, botão "Enviar pedido". |

A ordem é a da Fidelidade para o automóvel (o seguro primeiro, os dados de contacto
depois), adaptada: as perguntas do seguro vêm antes dos dados pessoais porque custam
menos a responder e não guardamos nada a meio.

Comportamento:
- **Barra de progresso** no topo do pop-up: nomes dos passos, o atual destacado,
  os feitos clicáveis para voltar, os futuros não. Em mobile mostra só "Passo 2 de 4,
  Sobre o seguro". `aria-current="step"` no atual.
- "Próximo" valida **só os campos do passo atual** (`checkValidity` nos elementos
  desse `fieldset`, mostra os erros, foca o primeiro inválido). Não avança com erros.
- "Anterior" nunca valida e nunca apaga respostas.
- Ao mudar de passo: o foco vai para o título do passo (`tabIndex={-1}`) e o
  conteúdo do pop-up volta ao topo. O título do passo é anunciado (`aria-live`).
- Todos os passos ficam montados num só `<form>` (os não ativos com `hidden`), para o
  `FormData` final ter tudo e o código de envio atual quase não mudar. Atenção: o
  browser não consegue focar um campo inválido escondido; por isso cada passo é
  validado antes de se avançar, e no envio final, se algum campo escondido falhar,
  saltar para esse passo.
- Mudar de ramo no passo 1 limpa as respostas do ramo anterior (o `key` atual).
- Títulos com o primeiro nome só depois de o termos (passo 4). Nada de "Olá!".
- Enter num campo de texto avança de passo em vez de enviar o formulário.
- Os três estados mantêm-se: a enviar (botão `loading`), erro (mensagem
  `MENSAGEM_ERRO`, fica no passo 4 com tudo preenchido), enviado (ecrã atual de
  sucesso).
- Ramo "Outros": fica em 2 passos (descrição + dados), sem resumo longo.

### C.2 Dados pessoais (comuns a todos os ramos)

| Campo | Regra |
|---|---|
| Nome completo | Obrigatório, como hoje (`validarNome`). |
| NIF | **Obrigatório** (pedido do João). 9 dígitos, `inputmode="numeric"`, aceita só dígitos ao escrever (descarta o resto), `validarNif`. Mensagem própria para NIF de empresa onde só faz sentido particular (ver C.3). Rótulo "NIF" sem "(opcional)". |
| Email | Obrigatório, `validarEmail`, mais a sugestão de C.4. |
| Telefone | Obrigatório, `validarTelefone`. **Formata ao sair do campo** para `912 345 678` (ou `+351 912 345 678`); o valor enviado continua normalizado (`normalizarTelefone`). Rótulo "Telefone" enquanto aceitarmos fixos; "Telemóvel" se o João decidir só móveis (pergunta E.2). |
| Código postal | **Obrigatório** em todos os ramos. Máscara ao escrever: depois de 4 dígitos entra o hífen sozinho; `maxLength=8`; `inputmode="numeric"`; `autocomplete="postal-code"`. Confirmação pela moradas.dev (C.5). |

O NIF e o código postal seguem no topo da mensagem do lead, como o NIF já segue hoje
(`NIF: ...`, `Código postal: 1000-001 (Lisboa)`).

### C.3 Perguntas por ramo (`src/data/formularios.ts`)

Manter a estrutura `Campo` e acrescentar só o que faltar (ex.: `mostrarSe` para campos
condicionais, `tipo: "matricula"`, `tipo: "pessoas"` para a lista de pessoas com idade).
"Opcional" quer dizer opcional; o que não diz é obrigatório.

**Automóvel** (passa a ter três passos de seguro: "O veículo", "O condutor" e "A
proteção"; o automóvel fica com 5 passos ao todo, os outros ramos com 3 ou 4).

O veículo:
- **Matrícula: componente novo `CampoMatricula`**, como a Fidelidade: três caixas de
  2 caracteres numa chapa com a faixa "P" (cores do sistema, não o azul europeu
  literal se não couber nos tokens).
  - Cada caixa `maxLength=2`, maiúsculas automáticas, só `A-Z` e `0-9`.
  - Ao encher uma caixa, o foco salta para a seguinte; Backspace numa caixa vazia volta
    à anterior.
  - **Colar (corrige o defeito da Fidelidade):** o `maxLength=2` corta o que se cola,
    por isso o `onPaste` trata o texto antes do browser (`preventDefault`):
    - tira espaços, hífenes, pontos e outros separadores e passa a maiúsculas
      (`aa00aa`, `AA-00-AA`, `aa 00 aa`, `AA.00.AA`, ` aa-00-aa ` dão todos `AA-00-AA`);
    - reparte pelas três caixas **a começar sempre na primeira**, seja qual for a caixa
      onde se colou, e põe o foco na última caixa preenchida;
    - se o resultado tiver mais de 6 caracteres ou não for um dos quatro formatos,
      preenche o que couber e mostra o erro de matrícula, sem apagar o que lá estava
      antes de forma silenciosa;
    - o mesmo vale para preenchimento automático do browser ou do teclado do telemóvel
      que escreva vários caracteres de uma vez numa caixa (tratar no `onInput`: se a
      caixa receber mais de 2 caracteres, reparte como no colar).
  - Acessível: `fieldset` com `legend` "Matrícula"; cada caixa com `aria-label`
    "Matrícula, 1.º par" / "2.º par" / "3.º par".
  - Valor enviado num `input type="hidden"` como `AA-00-AA`. Total: **6 caracteres,
    nunca mais**. Validação com os quatro formatos de `FORMATOS_MATRICULA`.
  - Por baixo, o botão de texto "**Ainda não tenho matrícula**": desativa as caixas,
    tira o `required`, muda para "Tenho matrícula" e torna obrigatórios a marca e o
    modelo. Aparece logo a pergunta "Porque ainda não tem matrícula?": "Carro novo,
    ainda por matricular" / "Carro importado, à espera da matrícula portuguesa" /
    "Outro motivo". Na mensagem: `Matrícula: ainda não tem (carro novo)`.
    - A Fidelidade só simula carros sem matrícula com menos de 30 dias. Nós **não
      bloqueamos**: somos corretora e o mediador trata o caso (importados, carros
      parados). Se a pessoa escolher "Carro novo" e puser uma 1.ª matrícula com mais
      de 30 dias, mostrar só um aviso, que não impede o envio: "Um carro com mais de 30
      dias normalmente já tem matrícula. Se tiver, indique-a acima."
  - Usar o mesmo componente no pedido de sinistro (`formulariosSinistro.ts`), que hoje
    também aceita 12 caracteres.
- Tipo de veículo: segmentado **Ligeiro** / **Motociclo**, Ligeiro por omissão, com a
  mesma ajuda da Fidelidade (motociclos inclui ciclomotores e moto 4).
- Uso do veículo: segmentado **Particular** / **Profissional ou outros fins** (TVDE,
  transporte, empresa), Particular por omissão.
- Nós não temos a base de dados de matrículas da Fidelidade: não há preenchimento
  automático do carro. Por isso:
  - **Marca**: lista fixa em `src/data/marcasAuto.ts`, por ordem alfabética, mais
    "Outra" no fim. A Fidelidade muda a lista conforme a data da 1.ª matrícula; nós
    usamos uma só, a **união** das duas que vimos (47 marcas para um carro de 2017, 67
    para um de 2026): ABARTH, ADAMASTOR, AION, ALFA ROMEO, ALPINE, ASTON MARTIN, AUDI,
    BENTLEY, BMW, BYD, CATERHAM, CHANGAN, CITROEN, CUPRA, DACIA, DFSK, DONGFENG, DS,
    EBRO, FARIZON, FERRARI, FIAT, FIREFLY, FORD, FORTHING, FOTON, GEELY, HONDA,
    HYUNDAI, ISUZU, IVECO, JAECOO, JAGUAR, JEEP, KGM, KIA, LAMBORGHINI, LANCIA, LAND
    ROVER, LEAPMOTOR, LEXUS, LOTUS, MAN, MASERATI, MAXUS, MAZDA, MERCEDES-BENZ, MG,
    MINI, MITSUBISHI, MORGAN, NIO, NISSAN, OMODA, OPEL, PEUGEOT, PIAGGIO, POLESTAR,
    PORSCHE, RENAULT, ROLLS-ROYCE, ROVER, SEAT, SKODA, SMART, SUZUKI, TESLA, TOYOTA,
    VICTORY AUTO, VOLKSWAGEN, VOLVO, VOYAH, XPENG, ZEEKR. Com perto de 75 opções, usar
    um campo de texto com sugestões (`<datalist>`) em vez de `select`: deixa escrever
    "ren" e escolher, e aceita uma marca que não esteja na lista. Com motociclo
    escolhido, a lista não se aplica (a dos motociclos não foi vista): só texto livre.
    Opcional se houver matrícula.
  - **Modelo e versão**: texto livre, "Ex.: Clio 1.5 dCi" (opcional se houver
    matrícula). Não fazer listas dependentes: precisariam de uma base de dados que não
    temos e que teria de ser mantida.
  - **Combustível**: Gasolina / Gasóleo / Híbrido / Elétrico / GPL (opcional). A
    Fidelidade põe-no no nome do modelo; nós perguntamos à parte.
  - **Data da 1.ª matrícula** em vez de "Ano do veículo" (mês e ano chegam: `type="month"`
    ou dois campos), não pode ser no futuro ("A data da 1.ª matrícula não pode ser
    no futuro."). Opcional se houver matrícula; sem matrícula e "Carro novo", pode
    ficar em branco (ainda por matricular).
- "Veículo importado?" Sim/Não, Não por omissão (sem matrícula e "Carro importado",
  fica Sim e bloqueado). Se Sim: **Data da matrícula portuguesa** (mês e ano), não
  anterior à 1.ª matrícula; opcional enquanto não houver matrícula portuguesa.
- Os erros **somem quando o campo fica certo** (o `InputValidado` já o faz ao escrever)
  e aparecem uma vez, em português. Não copiar os defeitos da Fidelidade de A.1.
- "Leva atrelado ou reboque (bicicletas, pranchas, animais, mota)?" Sim/Não, Não por
  omissão.
- Seguradora atual (opcional), como hoje.
- Não copiar "opcionais de marca": é um pormenor de tarifa da Fidelidade que a pessoa
  raramente sabe responder.

O condutor:
- Data de nascimento do condutor habitual (obrigatória, `validarNascimentoCondutor`).
- **Data da carta de condução** (data completa, como a Fidelidade, em vez do ano):
  conta para saber se é recém-encartado. Validar contra a data de nascimento (17 anos,
  como `validarCartaVsNascimento`, adaptada a datas) e não pode ser no futuro.
- "O seguro fica em nome do condutor habitual?" Sim/Não. Se Não: "Nome de quem fica
  com o seguro" e "NIF de quem fica com o seguro" (validado, aceita empresa).
- Se o uso for Particular e o seguro ficar no nome do condutor, o NIF do passo 3 tem
  de ser de pessoa singular (`nifDeEmpresa` falso): "Para uso particular, indique o NIF
  de uma pessoa, não de empresa."
- "Há quantos anos tem seguro automóvel em seu nome?" (opcional): Nunca tive / Menos
  de 2 / 2 a 5 / Mais de 5. É um dos pressupostos do exemplo de preço da Fidelidade.
- "Teve sinistros com culpa nos últimos 5 anos?" (opcional): Nenhum / 1 / 2 ou mais.
  A Fidelidade vai buscar estes dois valores a uma base de dados (ecrã 3b); nós não
  temos acesso, por isso perguntamos.

A proteção (passa a ser um passo curto antes dos dados pessoais, como "Coberturas"):
- "Que proteção procura?" em três **cartões de opção**, com a mesma lógica dos planos
  da Fidelidade mas sem nomes de produto nem preço:
  - "Só o obrigatório": responsabilidade civil e assistência em viagem;
  - "Danos próprios, carro usado": também choque, furto, incêndio e fenómenos da
    natureza;
  - "Proteção completa, carro novo ou semi-novo".
  Mais "Não sei, aconselhem-me" (por omissão nenhum escolhido).
- "Quer acrescentar?" (opcional, várias escolhas): Quebra de vidros / Veículo de
  substituição / Proteção jurídica / Ocupantes. São as coberturas extra mais vistas na
  tabela da Fidelidade; o resto fica para a conversa com o mediador.
- **Quando quer que o seguro comece?** Data, a partir de amanhã (como a Fidelidade),
  até 12 meses à frente. Opcional, com a nota "Se já tem seguro, indique a data em que
  termina".
- Não mostramos preço (somos corretora e não temos tarifa), por isso os ecrãs 0b, 4
  (preços) e 5 (comprar online) da Fidelidade não têm equivalente. O nosso passo
  "Rever e enviar" faz o papel do Resumo: matrícula, carro, condutor, quem fica com o
  seguro, proteção escolhida, data de início.

**Saúde** (inspirado na Multicare):
- Para quem é: cartões "Para mim e a minha família", "Só para outras pessoas (eu pago
  mas não fico no seguro)", "Para a minha empresa". O segundo é o "Só quero ser
  Tomador" da Multicare, dito de forma simples.
- **Pessoas a segurar, como a Multicare**: uma lista de cartões. Se a pessoa que pede
  fica no seguro, o primeiro cartão é ela: "Você", com a idade (aqui ainda não temos a
  data de nascimento, porque os dados pessoais vêm depois: pedir a idade, 0 a 99).
  "+ Acrescentar pessoa" junta um cartão "Pessoa 2" com **só a idade** (número, 0 a
  99, só dígitos, `maxLength=2`) e um botão "Remover" com texto (não só o ícone),
  `aria-label="Remover pessoa 2"`. No máximo 10; ao 10.º, o botão some e aparece "Para
  mais de 10 pessoas, escolha 'Para a minha empresa'". Ao acrescentar, o foco vai para
  a idade nova; ao remover, para o botão "+ Acrescentar pessoa". Substitui os campos
  "Nº de pessoas" e "Idades" em texto. Para empresa: só "Nº de pessoas" e "Idades
  aproximadas" (texto), como hoje.
  - Só a idade, como a Multicare: chega para pedir propostas e é menos dado pessoal do
    que a data de nascimento.
- "O que é mais importante para si?" (escolha obrigatória), cartões com as mesmas
  cinco necessidades da Multicare, reescritas no nosso tom:
  - "Um seguro mais barato, sobretudo para internamento";
  - "Consultas regulares e internamento";
  - "Consultas, exames, tratamentos e parto";
  - "Proteção em doenças graves e oncológicas";
  - "Cuidados dentários".
  Mais "Não sei, aconselhem-me". O erro aparece **uma vez**, por baixo do grupo (não
  repetido em cada cartão, como na Multicare).
  - Atenção RGPD: escolher "doenças graves" ou "parto" é uma preferência de cobertura,
    não um dado de saúde, desde que não se pergunte porquê. Não acrescentar campos do
    tipo "tem alguma doença?" nem "está grávida?".
- "Já tem seguro de saúde?" Sim/Não (opcional); se Sim, "Seguradora" (opcional). A
  Multicare não pergunta qual; nós perguntamos, porque a corretora quer saber o que vai
  comparar.
- Preferência: Rede convencionada / Reembolso / Não sei, como hoje.
- "Como prefere pagar?" Mensal / Trimestral / Semestral / Anual / Não sei (opcional),
  o "Fracionamento" da Multicare.
- Sem perguntas de saúde, nem de doenças anteriores, nem de "já foi recusado".

**Vida**:
- Para que é: Crédito habitação / Proteção da família / Outro, como hoje.
- Se crédito habitação: "Montante em dívida (€)", "Anos que faltam do crédito",
  "Banco do crédito", "Quer trocar o seguro de vida que tem no banco?" Sim/Não/Não sei
  (é o caso típico de uma corretora). Se não: "Capital pretendido (€)".
- Pessoas a segurar: 1 ou 2 (segmentado) e a **idade de cada uma**, com o mesmo
  componente de cartões da saúde (máximo 2). Substitui "Idade de cada pessoa" em texto.
- Sem tabaco, peso, profissão de risco ou saúde.

**Habitação (multirriscos)**:
- Tipo de imóvel, Situação (acrescentar **Senhorio**: "Proprietário, vivo lá" /
  "Proprietário, arrendo a outros" / "Inquilino"), O que quer segurar, Crédito
  habitação: como hoje.
- "Habitação permanente ou secundária?"
- **Morada do imóvel** (opcional) com sugestões da moradas.dev (C.5): ao escolher uma
  sugestão, preenche o código postal e mostra a localidade. Código postal do imóvel
  obrigatório, com o mesmo comportamento de C.2. Como os dados pessoais vêm depois, o
  código postal do passo 3 aparece já preenchido com o do imóvel, e pode ser mudado.
- Ano de construção e área: como hoje. "Tipo de construção": Betão / Alvenaria /
  Madeira ou outra / Não sei (opcional; é um dos fatores que a Fidelidade cita).

**Acidentes de trabalho**:
- É trabalhador independente? como hoje.
- Se tem trabalhadores: "NIPC da empresa" obrigatório, só aceita NIF de empresa
  (`nifDeEmpresa`); o NIF do passo 3 passa a ser o da pessoa de contacto e pode ser
  opcional **neste ramo** (confirmar com o João).
- Se é independente: o NIF do passo 3 tem de ser de pessoa singular.
- Atividade, Nº de trabalhadores, Massa salarial: como hoje. "Código CAE" (opcional,
  5 dígitos).

**Outros**: como hoje (tipo + descrição obrigatória), com os dados de C.2.

### C.4 Sugestão de correção do email

Ao sair do campo, se o domínio estiver a uma letra de distância de um domínio comum
(`gmail.com`, `hotmail.com`, `outlook.com`, `outlook.pt`, `sapo.pt`, `yahoo.com`,
`icloud.com`, `live.com.pt`, `msn.com`), mostrar por baixo "Quis dizer
nome@gmail.com?" como botão que corrige. Não bloqueia o envio. Lógica pura em
`src/utils/validacoes.ts` (ou ficheiro próprio), com testes.

### C.5 Código postal e morada com a moradas.dev

API grátis, sem chave, CORS aberto, limite de cerca de 50 pedidos por 10 segundos
por IP, beta e sem garantia de disponibilidade. Documentação: https://moradas.dev/docs.

Usar **`fetch` direto**, num módulo `src/utils/moradas.ts`, e não o `widget.js`
(é um script de terceiros e um widget fora do design system).

- `GET https://moradas.dev/cp/{cp7}` quando o código postal fica completo
  (`^\d{4}-\d{3}$`, validar antes de pedir):
  - 200: mostrar por baixo do campo, em texto secundário, "Lisboa, Lisboa"
    (localidade, concelho) e guardar para a mensagem.
  - 404: erro do campo "Este código postal não existe. Confirme os dígitos." (o
    cabeçalho `X-Moradas-Hint` explica o motivo; não mostrar o texto em inglês).
  - 429, erro de rede, demora acima de ~3 s: **não bloquear**. Aceitar o código com a
    validação de formato atual e seguir sem localidade.
- `GET https://moradas.dev/suggest?q=...&count=5` para a morada do imóvel: a partir de
  3 caracteres, `debounce` de ~250 ms, cancelar o pedido anterior (`AbortController`).
  Lista acessível (padrão combobox: `role="combobox"`, `aria-expanded`,
  `aria-activedescendant`, setas, Enter, Escape). Ao escolher: preencher rua,
  localidade e o `cp7` (ou `resolved_cp7`). Se `cp7` vier `null` e `nseg > 1`,
  pedir o número de porta e chamar `GET /resolve?art={art_id}&numero={n}` logo a
  seguir. **Nunca guardar o `art_id`**: muda a cada atualização semanal.
- Uma pequena cache em memória por código postal (a mesma sessão não repete pedidos).
- O site deixa de funcionar sem a API? Não: tudo isto é ajuda, nunca condição.
- **Privacidade**: o texto escrito na morada e o IP do visitante passam a ir para um
  terceiro. Acrescentar à secção 5 de `src/pages/legal/Privacy.tsx` uma frase como a do
  Turnstile, e atualizar a data da política. O texto final é revisto pelo cliente: se
  houver dúvida, marcar `[por confirmar]`.

### C.6 Mensagem para o CRM (`montarMensagem`)

Com mais campos, organizar por blocos para quem lê no CRM, sem travessões:

```
[Veículo]
Matrícula: AA-00-AA
Uso: Particular
[Condutor]
Data de nascimento: 10/05/1985
Data da carta: 01/06/2005
[Contacto]
NIF: 123456789
Código postal: 1000-001 (Lisboa, Lisboa)

Mensagem:
...
```

Continua a caber em 2000 caracteres; se não couber, corta a mensagem livre, como hoje.
Datas em `dd/mm/aaaa`. Campos vazios não aparecem.

### C.7 Textos

Seguir `docs/content-style.md`. Erros curtos e com a correção, como os atuais
("O NIF tem 9 dígitos."), não o "Por favor, preencha... para continuar" da Fidelidade.
Botões: "Próximo", "Anterior", "Enviar pedido". Caixa de privacidade: "Porque pedimos
estes dados? Só para preparar as propostas que pediu e falar consigo sobre elas." mais
link para a política.

---

## D. Testes e verificação

- `tests/validacoes.test.mjs`: matrícula por partes (função pura que reparte o texto
  colado: `aa00aa`, `AA-00-AA`, `aa 00 aa`, `00-aa-00`, colado na 2.ª ou 3.ª caixa,
  texto com mais de 6 caracteres; 6 caracteres no máximo; os quatro formatos), formatação do telefone, máscara do
  código postal, carta contra nascimento com datas, NIF singular/empresa por ramo,
  sugestão de email.
- `src/utils/moradas.ts` testado com `fetch` simulado: 200, 404, 429, falha de rede,
  `cp7` nulo com `nseg > 1`.
- `npm run check`, `npm run test`, `npm run qa`, `npm run qa:layout` a passar.
- No browser (`npm run dev`, porta 5190), em mobile e desktop, dentro do pop-up:
  - pop-up genérico e pop-up de cada ramo, do passo 1 ao envio;
  - só teclado: Tab, Enter avança, Escape fecha, foco visível, foco no título ao mudar
    de passo, saltos entre as caixas da matrícula;
  - "Ainda não tenho matrícula" e voltar a "Tenho matrícula"; os três motivos; o
    aviso de "mais de 30 dias" aparece e não impede o envio; data no futuro dá erro;
  - colar uma matrícula inteira em cada uma das três caixas (Ctrl+V e menu do
    telemóvel): tem de ficar sempre completa nas três;
  - moradas.dev a responder e bloqueada (DevTools, bloquear o domínio): o formulário
    envia na mesma;
  - erro de envio (sem rede): fica no passo 4 com tudo preenchido;
  - formulário de sinistro com a nova matrícula.
- `docs/design-system.md` e `DECISIONS.md` atualizados (passos, chapa de matrícula,
  cartões de opção, NIF obrigatório, moradas.dev).

## E. Perguntas para o João antes de fechar

1. NIF obrigatório também no **pedido de sinistro** (hoje opcional)? E no ramo
   acidentes de trabalho, chega o NIPC da empresa?
2. Telefone: só **telemóvel** como a Fidelidade, ou continuamos a aceitar fixo?
3. Os três níveis de proteção do automóvel (C.3) e os quatro extras chegam, ou quer
   perguntar mais coberturas no site?
4. A morada do imóvel com sugestões (habitação) chega, ou quer morada completa também
   nos dados pessoais?
