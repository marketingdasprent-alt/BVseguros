export type Pergunta = {
  pergunta: string;
  resposta: string;
  /** A resposta depende de informação que o cliente ainda não confirmou. */
  porConfirmar?: boolean;
};

/** Perguntas sobre a corretora (não sobre um ramo): Home, hub e sinistros. */
export const PERGUNTAS_GERAIS: Pergunta[] = [
  {
    pergunta: "Qual a diferença entre uma corretora e uma seguradora?",
    resposta:
      "A seguradora emite a apólice e paga as indemnizações. A corretora é um mediador independente: não pertence a nenhuma seguradora, compara propostas de várias e aconselha a que faz mais sentido para si.",
  },
  {
    pergunta: "Tenho de pagar pelo aconselhamento?",
    resposta: "Por confirmar: se o serviço tem algum custo para o cliente ou se a corretora é remunerada apenas pela seguradora.",
    porConfirmar: true,
  },
  {
    pergunta: "Posso passar para a BV os seguros que já tenho?",
    resposta:
      "Pode. Diga-nos que seguros tem e em que seguradoras. Analisamos as apólices, dizemos se há alternativas melhores e tratamos da mudança se decidir avançar.",
  },
  {
    pergunta: "Quem me ajuda quando tiver um sinistro?",
    resposta:
      "Nós. Ajudamos a participar o sinistro à seguradora, explicamos os passos seguintes e acompanhamos o processo até à resolução.",
  },
];

/**
 * Morada real do escritório, para o mapa. null até o cliente confirmar:
 * o mapa não carrega com a morada fictícia de CANAIS.
 */
export const MORADA_CONFIRMADA: string | null = null;

export type Canal = {
  titulo: string;
  descricao: string;
  valor: string;
  href?: string;
  confirmado: boolean;
  icone: "telefone" | "email" | "whatsapp" | "morada";
};

/** Só o email está confirmado; os outros ficam marcados até o cliente os dar. */
export const CANAIS: Canal[] = [
  {
    titulo: "Telefone",
    descricao: "Para falar já com um mediador.",
    valor: "+351 21 000 0000 (fictício, por confirmar)",
    confirmado: false,
    icone: "telefone",
  },
  {
    titulo: "Email",
    descricao: "Para enviar apólices ou documentos.",
    valor: "geral@bvseguros.pt",
    href: "mailto:geral@bvseguros.pt",
    confirmado: true,
    icone: "email",
  },
  {
    titulo: "WhatsApp",
    descricao: "Para uma dúvida rápida.",
    valor: "Número por confirmar",
    confirmado: false,
    icone: "whatsapp",
  },
  {
    titulo: "Escritório",
    descricao: "Para falar pessoalmente.",
    valor: "Rua das Flores, nº 123, 1200-192 Lisboa (fictício, por confirmar)",
    confirmado: false,
    icone: "morada",
  },
];

export const ACESSOS_RAPIDOS = [
  { label: "Pedir proposta", descricao: "Comparamos por si", href: "#contacto", icone: "proposta" },
  { label: "Participar sinistro", descricao: "O que fazer e como ajudamos", href: "/sinistros", icone: "sinistro" },
  { label: "Ver seguros", descricao: "Particulares e empresas", href: "/seguros", icone: "seguros" },
  { label: "Perguntas frequentes", descricao: "Respostas rápidas", href: "#apoio", icone: "perguntas" },
] as const;

export type IconeAcesso = (typeof ACESSOS_RAPIDOS)[number]["icone"];
