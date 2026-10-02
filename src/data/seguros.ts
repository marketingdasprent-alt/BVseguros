import type { RamoCrm } from "../utils/enviarContacto";

export type RamoKey = "auto" | "vida" | "saude" | "habitacao" | "trabalho" | "outros";

export type Segmento = "particulares" | "empresas";

export const SEGMENTOS: { valor: Segmento; nome: string }[] = [
  { valor: "particulares", nome: "Particulares" },
  { valor: "empresas", nome: "Empresas" },
];

export type Disponibilidade = "incluido" | "opcional" | "nao";

/** Três níveis ilustrativos para orientar a conversa, não um produto de uma seguradora. */
export type NiveisProtecao = {
  niveis: { nome: string; resumo: string }[];
  linhas: { cobertura: string; valores: Disponibilidade[] }[];
};

export type Seguro = {
  key: RamoKey;
  slug: string;
  nome: string;
  /** Texto curto dos cartões (Home, hub e "outros seguros"). */
  descricao: string;
  titulo: string;
  intro: string;
  imagem: string;
  /** object-position da foto: onde está o assunto (ex.: o carro está em baixo). */
  imagemFoco?: string;
  /** Valor de ramo que o CRM aceita (leads.ramo_interesse). */
  ramoCrm: RamoCrm;
  publico: "Particulares" | "Empresas" | "Particulares e empresas";
  segmentos: Segmento[];
  /** Só nos ramos onde níveis de proteção fazem sentido. */
  niveis?: NiveisProtecao;
  /** Tema em destaque na página do ramo. */
  destaque?: { titulo: string; texto: string; pontos: string[] };
  coberturas: { titulo: string; descricao: string }[];
  perguntas: { pergunta: string; resposta: string }[];
};

/**
 * Coberturas e perguntas descrevem o que o mercado português costuma
 * oferecer em cada ramo, não um produto concreto: a proposta final
 * depende da seguradora. Quais as seguradoras e produtos que a BV
 * coloca está por confirmar (ver documento.md secção 4).
 *
 * Fotografias de stock (Pexels, licença livre para uso comercial, sem
 * ligação real à BV Seguros): placeholders visuais, ver docs/anti-ai.md
 * #content-integrity.
 */
export const SEGUROS: Seguro[] = [
  {
    key: "auto",
    slug: "automovel",
    nome: "Automóvel",
    descricao: "Responsabilidade civil, danos próprios e assistência em viagem.",
    titulo: "Seguro automóvel à medida do carro que tem.",
    intro:
      "Do mínimo obrigatório à proteção contra danos no próprio carro. Comparamos as opções de várias seguradoras e explicamos a diferença entre elas antes de decidir.",
    imagem: "/images/ramos/auto.jpg",
    imagemFoco: "center 85%",
    ramoCrm: "auto",
    publico: "Particulares e empresas",
    segmentos: ["particulares", "empresas"],
    niveis: {
      niveis: [
        { nome: "Essencial", resumo: "O mínimo obrigatório para circular, com assistência em viagem." },
        { nome: "Intermédio", resumo: "Protege também contra furto, incêndio, natureza e vidros." },
        { nome: "Completo", resumo: "Inclui danos no próprio carro, mesmo com culpa sua." },
      ],
      linhas: [
        { cobertura: "Responsabilidade civil", valores: ["incluido", "incluido", "incluido"] },
        { cobertura: "Assistência em viagem", valores: ["incluido", "incluido", "incluido"] },
        { cobertura: "Proteção jurídica", valores: ["opcional", "incluido", "incluido"] },
        { cobertura: "Quebra isolada de vidros", valores: ["opcional", "incluido", "incluido"] },
        { cobertura: "Furto ou roubo", valores: ["nao", "incluido", "incluido"] },
        { cobertura: "Incêndio e fenómenos da natureza", valores: ["nao", "incluido", "incluido"] },
        { cobertura: "Choque, colisão e capotamento", valores: ["nao", "nao", "incluido"] },
        { cobertura: "Veículo de substituição", valores: ["nao", "opcional", "incluido"] },
        { cobertura: "Condutor e ocupantes", valores: ["opcional", "opcional", "opcional"] },
      ],
    },
    destaque: {
      titulo: "Tem um carro elétrico ou híbrido?",
      texto: "Um elétrico tem riscos que um carro a combustão não tem. Algumas seguradoras já incluem coberturas pensadas para eles; confirmamos quais antes de escolher.",
      pontos: [
        "Assistência em caso de falta de bateria, com reboque até ao posto de carregamento.",
        "Cabos e carregador protegidos contra furto e vandalismo.",
        "Danos causados a terceiros durante o carregamento.",
      ],
    },
    coberturas: [
      { titulo: "Responsabilidade civil", descricao: "Obrigatória para circular. Cobre os danos causados a terceiros, pessoas e bens." },
      { titulo: "Danos próprios", descricao: "Choque, colisão e capotamento: cobre a reparação do carro mesmo quando a culpa é sua." },
      { titulo: "Furto ou roubo", descricao: "Indemnização se o carro for furtado, e os danos de uma tentativa de furto." },
      { titulo: "Incêndio e fenómenos da natureza", descricao: "Incêndio, raio, explosão, tempestades e inundações." },
      { titulo: "Quebra isolada de vidros", descricao: "Reparação ou substituição de para-brisas, vidros laterais e óculo traseiro." },
      { titulo: "Assistência em viagem", descricao: "Reboque, transporte dos ocupantes e alojamento quando o carro fica imobilizado." },
      { titulo: "Proteção jurídica", descricao: "Apoio e despesas de defesa em litígios relacionados com o veículo." },
      { titulo: "Condutor e ocupantes", descricao: "Despesas de tratamento e indemnização em caso de lesões no acidente." },
    ],
    perguntas: [
      {
        pergunta: "O seguro automóvel é obrigatório?",
        resposta:
          "A responsabilidade civil é obrigatória para qualquer veículo que circule na via pública. As restantes coberturas são opcionais e escolhem-se consoante o valor e a utilização do carro.",
      },
      {
        pergunta: "Compensa ter danos próprios?",
        resposta:
          "Depende da idade e do valor do carro. Num carro recente ou com crédito ou leasing (onde costuma ser exigido), normalmente sim. Num carro com mais anos, pode fazer mais sentido um seguro contra terceiros com algumas coberturas extra. Fazemos essas contas consigo.",
      },
      {
        pergunta: "O que faço se tiver um acidente?",
        resposta:
          "Se possível, preencha a Declaração Amigável com o outro condutor e tire fotografias. Depois fale connosco: ajudamos a participar o sinistro à seguradora e acompanhamos o processo. A participação deve ser feita no prazo de 8 dias.",
      },
      {
        pergunta: "Posso mudar de seguradora antes da renovação?",
        resposta:
          "Pode. O mais simples é mudar na data de renovação, avisando a seguradora atual com a antecedência prevista no contrato. Tratamos do pedido por si.",
      },
    ],
  },
  {
    key: "vida",
    slug: "vida",
    nome: "Vida",
    descricao: "Proteção financeira para quem depende de si, ajustada à sua fase de vida.",
    titulo: "Seguro de vida para proteger quem depende de si.",
    intro:
      "Garante um capital à família em caso de morte ou invalidez, e é muitas vezes pedido pelo banco no crédito à habitação. Ajudamos a escolher o capital e as coberturas certas.",
    imagem: "/images/ramos/vida.jpg",
    ramoCrm: "vida",
    publico: "Particulares",
    segmentos: ["particulares"],
    destaque: {
      titulo: "Vai pedir crédito à habitação?",
      texto: "O banco vai pedir um seguro de vida associado ao empréstimo. Pode comparar antes de aceitar o que lhe propõem.",
      pontos: [
        "Pedimos propostas a várias seguradoras com as coberturas e o capital que o banco exige.",
        "Tratamos da documentação a entregar ao banco.",
        "Revemos o seguro ao longo do crédito, à medida que o capital em dívida baixa.",
      ],
    },
    coberturas: [
      { titulo: "Morte", descricao: "Pagamento do capital seguro aos beneficiários que escolher." },
      { titulo: "Invalidez total e permanente", descricao: "Pagamento do capital se ficar incapacitado de forma permanente." },
      { titulo: "Vida crédito habitação", descricao: "Liquida o empréstimo ao banco, total ou parcialmente, se algo lhe acontecer." },
      { titulo: "Doenças graves", descricao: "Cobertura opcional que antecipa parte do capital em caso de diagnóstico." },
    ],
    perguntas: [
      {
        pergunta: "Tenho de fazer o seguro de vida no banco do crédito?",
        resposta:
          "Não necessariamente. Na maioria dos casos pode contratar noutra seguradora, desde que as coberturas e o capital cumpram o que o banco exige. É frequente encontrar condições melhores fora do banco, e comparamos por si.",
      },
      {
        pergunta: "Que capital devo segurar?",
        resposta:
          "Depende do que quer proteger: o valor em dívida de um crédito, alguns anos de rendimento da família, ou ambos. Fazemos essa conta consigo antes de pedir propostas.",
      },
      {
        pergunta: "Vou ter de fazer exames médicos?",
        resposta:
          "Depende da idade e do capital. Para capitais mais baixos costuma bastar um questionário de saúde. A seguradora indica quando são precisos exames.",
      },
    ],
  },
  {
    key: "saude",
    slug: "saude",
    nome: "Saúde",
    descricao: "Acesso a rede de cuidados privados, com e sem internamento.",
    titulo: "Seguro de saúde com a rede de médicos e hospitais que procura.",
    intro:
      "Consultas, exames e internamento em rede privada, com copagamentos previsíveis. Os planos variam muito entre seguradoras, por isso comparamos o que cada um cobre na prática.",
    imagem: "/images/ramos/saude.jpg",
    ramoCrm: "saude",
    publico: "Particulares e empresas",
    segmentos: ["particulares", "empresas"],
    niveis: {
      niveis: [
        { nome: "Essencial", resumo: "Protege contra as despesas maiores: internamento e cirurgia." },
        { nome: "Intermédio", resumo: "Acrescenta consultas, exames e análises." },
        { nome: "Completo", resumo: "Plano alargado, com dentista, parto e medicamentos." },
      ],
      linhas: [
        { cobertura: "Hospitalização", valores: ["incluido", "incluido", "incluido"] },
        { cobertura: "Ambulatório (consultas e exames)", valores: ["nao", "incluido", "incluido"] },
        { cobertura: "Estomatologia", valores: ["nao", "opcional", "incluido"] },
        { cobertura: "Parto", valores: ["nao", "opcional", "incluido"] },
        { cobertura: "Medicamentos", valores: ["nao", "nao", "incluido"] },
      ],
    },
    coberturas: [
      { titulo: "Hospitalização", descricao: "Internamento e cirurgia, a cobertura com maior peso no plano." },
      { titulo: "Ambulatório", descricao: "Consultas de especialidade, exames e análises fora do internamento." },
      { titulo: "Estomatologia", descricao: "Consultas e tratamentos dentários, com valores definidos por ato." },
      { titulo: "Parto", descricao: "Acompanhamento e parto, normalmente depois de um período de carência." },
      { titulo: "Medicamentos", descricao: "Comparticipação em medicamentos receitados, em alguns planos." },
    ],
    perguntas: [
      {
        pergunta: "O que é o período de carência?",
        resposta:
          "É o tempo entre a entrada no seguro e o momento em que uma cobertura pode ser usada. Varia por cobertura e por seguradora: o parto, por exemplo, tem quase sempre um período mais longo.",
      },
      {
        pergunta: "Doenças que já tenho ficam cobertas?",
        resposta:
          "Em regra, as doenças preexistentes ficam excluídas ou com limites. Convém declará-las na adesão. Explicamos o que cada seguradora aceita antes de escolher.",
      },
      {
        pergunta: "Qual a diferença entre rede e reembolso?",
        resposta:
          "Na rede convencionada paga apenas o copagamento no momento. No reembolso escolhe o médico que quiser, paga a consulta e a seguradora devolve uma parte.",
      },
    ],
  },
  {
    key: "habitacao",
    slug: "multirriscos-habitacao",
    nome: "Multirriscos habitação",
    descricao: "Casa própria ou arrendada, conteúdo e responsabilidade civil incluídos.",
    titulo: "Seguro multirriscos para a casa e o que está dentro dela.",
    intro:
      "Protege o edifício, o recheio ou ambos contra incêndio, danos por água, furto e outros imprevistos. Serve para casa própria, arrendada ou com crédito à habitação.",
    imagem: "/images/ramos/habitacao.jpg",
    ramoCrm: "multirriscos",
    publico: "Particulares",
    segmentos: ["particulares"],
    niveis: {
      niveis: [
        { nome: "Essencial", resumo: "O que a lei e o banco costumam exigir." },
        { nome: "Intermédio", resumo: "Cobre os imprevistos mais frequentes em casa." },
        { nome: "Completo", resumo: "Proteção alargada, incluindo fenómenos sísmicos." },
      ],
      linhas: [
        { cobertura: "Incêndio, raio e explosão", valores: ["incluido", "incluido", "incluido"] },
        { cobertura: "Responsabilidade civil", valores: ["opcional", "incluido", "incluido"] },
        { cobertura: "Danos por água", valores: ["nao", "incluido", "incluido"] },
        { cobertura: "Tempestades e inundações", valores: ["nao", "incluido", "incluido"] },
        { cobertura: "Furto ou roubo", valores: ["nao", "opcional", "incluido"] },
        { cobertura: "Assistência ao lar", valores: ["nao", "incluido", "incluido"] },
        { cobertura: "Fenómenos sísmicos", valores: ["nao", "opcional", "opcional"] },
      ],
    },
    coberturas: [
      { titulo: "Incêndio, raio e explosão", descricao: "A base de qualquer multirriscos. Obrigatória em prédios em propriedade horizontal." },
      { titulo: "Danos por água", descricao: "Roturas e infiltrações, das mais participadas no dia a dia." },
      { titulo: "Fenómenos da natureza", descricao: "Tempestades, inundações e, como opção, fenómenos sísmicos." },
      { titulo: "Furto ou roubo", descricao: "Bens do recheio e danos causados na tentativa." },
      { titulo: "Responsabilidade civil", descricao: "Danos que a casa ou a família causem a terceiros, como uma fuga de água para o vizinho." },
      { titulo: "Assistência ao lar", descricao: "Canalizador, eletricista ou serralheiro em caso de urgência." },
    ],
    perguntas: [
      {
        pergunta: "O seguro de casa é obrigatório?",
        resposta:
          "O seguro de incêndio é obrigatório para frações em prédios em propriedade horizontal. O banco também o exige no crédito à habitação. O multirriscos completo é opcional, mas cobre muito mais do que o incêndio.",
      },
      {
        pergunta: "Edifício ou recheio: qual preciso?",
        resposta:
          "O edifício cobre paredes, canalizações e o que está fixo. O recheio cobre móveis, eletrodomésticos e bens pessoais. Um proprietário costuma segurar os dois; quem vive numa casa arrendada, normalmente só o recheio.",
      },
      {
        pergunta: "Qual o valor a segurar?",
        resposta:
          "O edifício deve ser seguro pelo custo de reconstrução, não pelo valor de mercado. Um capital abaixo do real pode reduzir a indemnização. Ajudamos a calcular.",
      },
    ],
  },
  {
    key: "trabalho",
    slug: "acidentes-de-trabalho",
    nome: "Acidentes de trabalho",
    descricao: "Obrigatório para quem tem trabalhadores a cargo. Tratamos do processo todo.",
    titulo: "Seguro de acidentes de trabalho, obrigatório e tratado por nós.",
    intro:
      "Obrigatório para empresas com trabalhadores e para trabalhadores independentes. Tratamos da apólice, das atualizações de salários e do acompanhamento quando há um acidente.",
    imagem: "/images/ramos/trabalho.jpg",
    ramoCrm: "acidentes_trabalho",
    publico: "Empresas",
    segmentos: ["empresas"],
    coberturas: [
      { titulo: "Despesas de tratamento", descricao: "Assistência médica, medicamentos, transportes e reabilitação." },
      { titulo: "Incapacidade temporária", descricao: "Indemnização pela perda de salário durante a recuperação." },
      { titulo: "Incapacidade permanente", descricao: "Pensão ou capital de acordo com o grau de incapacidade." },
      { titulo: "Acidente de trajeto", descricao: "Acidentes no percurso normal entre casa e o local de trabalho." },
    ],
    perguntas: [
      {
        pergunta: "Quem é obrigado a ter este seguro?",
        resposta:
          "Todas as entidades empregadoras, para os seus trabalhadores, e os trabalhadores independentes, para si próprios.",
      },
      {
        pergunta: "Como é calculado o prémio?",
        resposta:
          "Com base na massa salarial e na atividade da empresa. Por isso é importante manter os salários atualizados na seguradora: salários declarados abaixo do real podem reduzir a indemnização.",
      },
      {
        pergunta: "O que acontece quando há um acidente?",
        resposta:
          "O acidente deve ser participado à seguradora no prazo previsto na lei. Ajudamos a preencher a participação e acompanhamos o processo até ao fim.",
      },
    ],
  },
  {
    key: "outros",
    slug: "outros-seguros",
    nome: "Outros seguros",
    descricao: "Responsabilidade civil, viagem e situações à medida. Fale connosco.",
    titulo: "Outros seguros, para o que não cabe numa categoria.",
    intro:
      "Responsabilidade civil, viagem, animais de companhia, acidentes pessoais e seguros para empresas. Diga-nos o que precisa proteger e procuramos a solução.",
    imagem: "/images/ramos/outros.jpg",
    ramoCrm: "outro",
    publico: "Particulares e empresas",
    segmentos: ["particulares", "empresas"],
    coberturas: [
      { titulo: "Responsabilidade civil", descricao: "Geral, familiar ou profissional, incluindo as obrigatórias por lei para certas atividades." },
      { titulo: "Viagem", descricao: "Despesas médicas no estrangeiro, cancelamento e bagagem." },
      { titulo: "Animais de companhia", descricao: "Despesas veterinárias e responsabilidade civil do animal." },
      { titulo: "Acidentes pessoais", descricao: "Capital e despesas de tratamento em caso de acidente, no trabalho ou fora dele." },
      { titulo: "Multirriscos empresarial", descricao: "Instalações, equipamento e mercadoria de um negócio." },
    ],
    perguntas: [
      {
        pergunta: "Não encontro o seguro de que preciso. Podem ajudar?",
        resposta:
          "Sim. Descreva a situação no formulário e procuramos a solução junto das seguradoras com quem trabalhamos.",
      },
      {
        pergunta: "A minha atividade exige um seguro obrigatório. Tratam disso?",
        resposta:
          "Várias profissões e atividades têm seguros de responsabilidade civil obrigatórios. Diga-nos qual é a sua e confirmamos o que a lei exige.",
      },
    ],
  },
];

export const SEGUROS_FORMULARIO = SEGUROS.map((s) => ({ valor: s.ramoCrm, nome: s.nome }));

export function segurosDoSegmento(segmento: Segmento) {
  return SEGUROS.filter((s) => s.segmentos.includes(segmento));
}

export function hrefSeguro(seguro: Seguro) {
  return `/seguros/${seguro.slug}`;
}

export function seguroPorCaminho(pathname: string): Seguro | undefined {
  const caminho = pathname.replace(/\/+$/, "");
  return SEGUROS.find((s) => hrefSeguro(s) === caminho);
}

export const PASSOS = [
  {
    titulo: "Diga-nos o que precisa",
    descricao: "Preencha o formulário ou ligue‑nos. Sem compromisso, sem letras miúdas.",
  },
  {
    titulo: "Pedimos as propostas",
    descricao: "Analisamos propostas de várias seguradoras para o seu caso concreto.",
  },
  {
    titulo: "Escolha com tudo explicado",
    descricao: "Explicamos as opções em português simples. Você decide, nós tratamos do resto.",
  },
];
