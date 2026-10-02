import type { RamoKey } from "./seguros";
import {
  diasDesde,
  hojeIso,
  naoFutura,
  validarCartaVsNascimento,
  validarNascimentoCondutor,
  validarNif,
  validarNipc,
} from "../utils/validacoes";
import { validarMatricula } from "../utils/validacoes";
import type { Validador } from "../utils/validacoes";

/** Respostas do formulário, por `nome` do campo (sem o prefixo `d_`). Várias escolhas vêm juntas por ", ". */
export type Valores = Record<string, string>;

export type Campo = {
  nome: string;
  rotulo: string;
  tipo:
    | "texto"
    | "numero"
    | "data"
    | "select"
    | "radio"
    | "cartoes"
    | "multipla"
    | "textarea"
    | "matricula"
    | "marca"
    | "pessoas"
    | "codigo_postal"
    | "morada";
  opcoes?: string[];
  /** Cartões: uma frase por opção, pela mesma ordem de `opcoes`. */
  descricoes?: string[];
  obrigatorio?: boolean;
  /** Obrigatório só nalguns casos (ex.: marca quando não há matrícula). */
  obrigatorioSe?: (v: Valores) => boolean;
  /** Sem isto, o campo aparece sempre. Escondido, não é enviado. */
  mostrarSe?: (v: Valores) => boolean;
  /** Opção já escolhida ao abrir (rádios). */
  padrao?: string;
  /** Texto curto por baixo do campo. */
  ajuda?: string;
  /** Aviso que não impede o envio (ex.: carro "novo" com mais de 30 dias). */
  aviso?: (v: Valores) => string | null;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "numeric" | "decimal" | "text";
  /** Datas: também "hoje", "amanha", "doze_meses" ou "ha_dois_anos". */
  min?: number | string;
  max?: number | string;
  minLength?: number;
  maxLength?: number;
  /** Validação própria do campo (src/utils/validacoes.ts), além de required/min/max. */
  validar?: Validador;
  /** Arruma o valor ao sair do campo (ex.: matrícula em maiúsculas com hífenes). */
  formatar?: (valor: string) => string;
  /** Limpa o que se escreve, tecla a tecla (ex.: só dígitos no NIF). */
  filtrar?: (valor: string) => string;
  /** "meia": ocupa uma de duas colunas em desktop. */
  largura?: "meia" | "inteira";
  /** Matrícula: mostra "Ainda não tenho matrícula". */
  permitirSemMatricula?: boolean;
  /** Pessoas: máximo de cartões. */
  maxPessoas?: number;
  /** Pessoas: o primeiro cartão é quem pede ("Você"). */
  titularSe?: (v: Valores) => boolean;
  /** Morada: o campo de código postal que a sugestão escolhida preenche. */
  codigoPostal?: string;
};

export type PassoRamo = {
  id: string;
  /** Nome curto na barra de progresso. */
  nome: string;
  titulo: string;
  texto?: string;
  campos: Campo[];
  /** Só aparece nalguns casos (ex.: "Quem fica com o seguro" só quando não é o condutor). */
  mostrarSe?: (v: Valores) => boolean;
  /**
   * Quando passa a verdade (a matrícula fica completa, escolhe-se um cartão),
   * a página passa sozinha para o passo seguinte. Nada abre por baixo: o que
   * depende da resposta fica no passo a seguir (pedido do cliente).
   */
  avancaQuando?: (v: Valores) => boolean;
  /** Campo em destaque, grande e ao centro (a matrícula). */
  destaque?: string;
};

/** Erro entre campos, posto no campo `campo` ao tentar avançar. */
export type ErroRegra = { campo: string; mensagem: string };

export type FormularioRamo = {
  titulo: string;
  texto: string;
  passos: PassoRamo[];
  /** Esconde "Algo mais que devamos saber?" quando um campo do ramo já faz esse papel. */
  semMensagemLivre?: boolean;
  /** Sem passo "Rever e enviar": o envio fica nos dados pessoais. */
  semRevisao?: boolean;
  /** Regras entre campos do ramo. */
  regras?: (v: Valores) => ErroRegra[];
  /** O NIF de quem pede deixa de ser obrigatório (ex.: a empresa já deu o NIPC). */
  nifDispensavel?: (v: Valores) => boolean;
  /** Se o NIF de quem pede tem de ser de pessoa singular, a mensagem para um NIF de empresa. */
  nifParticular?: (v: Valores) => string | null;
};

export const SEM_MATRICULA = "Ainda não tem";
const NAO_SEI = "Não sei";
const SIM_NAO = ["Sim", "Não"];
const ANO_ATUAL = new Date().getFullYear();
const soDigitos = (v: string) => v.replace(/\D/g, "");

/** Converte "hoje", "amanha", "doze_meses" e "ha_dois_anos" na data aaaa-mm-dd; números e datas ficam iguais. */
export function limiteData(limite: number | string | undefined): number | string | undefined {
  if (limite !== "hoje" && limite !== "amanha" && limite !== "doze_meses" && limite !== "ha_dois_anos") return limite;
  const d = new Date();
  if (limite === "amanha") d.setDate(d.getDate() + 1);
  if (limite === "doze_meses") d.setFullYear(d.getFullYear() + 1);
  // A função do Supabase aceita ocorrências até 2 anos atrás (o próprio dia de há 2 anos já não).
  if (limite === "ha_dois_anos") {
    d.setFullYear(d.getFullYear() - 2);
    d.setDate(d.getDate() + 1);
  }
  return hojeIso(d);
}

const semMatricula = (v: Valores) => v.matricula === SEM_MATRICULA;
export const matriculaCompleta = (m: string) => /^[A-Z0-9]{2}-[A-Z0-9]{2}-[A-Z0-9]{2}$/.test(m) && !validarMatricula(m);
const MOTIVO_NOVO = "Carro novo, ainda por matricular";
const MOTIVO_IMPORTADO = "Carro importado, à espera da matrícula portuguesa";
const COM_TRABALHADORES = "Não, tenho trabalhadores";

/** Todas as marcas que o simulador da Fidelidade mostrou (carros de 2017 e de 2026), por ordem. */
export const MARCAS_AUTO = [
  "ABARTH", "ADAMASTOR", "AION", "ALFA ROMEO", "ALPINE", "ASTON MARTIN", "AUDI", "BENTLEY", "BMW", "BYD",
  "CATERHAM", "CHANGAN", "CITROEN", "CUPRA", "DACIA", "DFSK", "DONGFENG", "DS", "EBRO", "FARIZON", "FERRARI",
  "FIAT", "FIREFLY", "FORD", "FORTHING", "FOTON", "GEELY", "HONDA", "HYUNDAI", "ISUZU", "IVECO", "JAECOO",
  "JAGUAR", "JEEP", "KGM", "KIA", "LAMBORGHINI", "LANCIA", "LAND ROVER", "LEAPMOTOR", "LEXUS", "LOTUS", "MAN",
  "MASERATI", "MAXUS", "MAZDA", "MERCEDES-BENZ", "MG", "MINI", "MITSUBISHI", "MORGAN", "NIO", "NISSAN", "OMODA",
  "OPEL", "PEUGEOT", "PIAGGIO", "POLESTAR", "PORSCHE", "RENAULT", "ROLLS-ROYCE", "ROVER", "SEAT", "SKODA",
  "SMART", "SUZUKI", "TESLA", "TOYOTA", "VICTORY AUTO", "VOLKSWAGEN", "VOLVO", "VOYAH", "XPENG", "ZEEKR",
];

const naoFuturaMatricula = naoFutura("A data da matrícula não pode ser no futuro.");

/**
 * O que a BV precisa para pedir propostas de cada ramo, por passos (como os
 * simuladores da Fidelidade, PROMPT-MASTER-FORMULARIOS-FIDELIDADE.md). Os
 * valores seguem para o CRM dentro da mensagem do lead (opção A, DECISIONS.md
 * 2026-09-30). Saúde e Vida não perguntam doenças nem estado de saúde: dados
 * de categoria especial (art. 9.º RGPD). Das pessoas a segurar, só a idade.
 */
export const FORMULARIOS: Record<RamoKey, FormularioRamo> = {
  auto: {
    titulo: "Peça uma proposta de seguro automóvel.",
    texto: "Tenha à mão a matrícula e a carta de condução. Comparamos propostas de várias seguradoras.",
    passos: [
      {
        id: "matricula",
        nome: "A matrícula",
        titulo: "Comece por indicar a matrícula do seu carro.",
        texto: "Depois pedimos o resto dos dados do carro.",
        destaque: "matricula",
        avancaQuando: (v) => semMatricula(v) || matriculaCompleta(v.matricula ?? ""),
        campos: [{ nome: "matricula", rotulo: "Matrícula", tipo: "matricula", obrigatorio: true, permitirSemMatricula: true }],
      },
      {
        id: "sem_matricula",
        nome: "Sem matrícula",
        titulo: "Porque ainda não tem matrícula?",
        mostrarSe: semMatricula,
        avancaQuando: (v) => Boolean(v.motivo_sem_matricula),
        campos: [
          {
            nome: "motivo_sem_matricula",
            rotulo: "Motivo",
            tipo: "radio",
            opcoes: [MOTIVO_NOVO, MOTIVO_IMPORTADO, "Outro motivo"],
            obrigatorio: true,
          },
        ],
      },
      {
        id: "veiculo",
        nome: "O veículo",
        titulo: "Agora, o carro.",
        texto: "Com a matrícula, estes dados são opcionais.",
        campos: [
          {
            nome: "tipo_veiculo",
            rotulo: "Tipo de veículo",
            tipo: "radio",
            opcoes: ["Ligeiro", "Motociclo"],
            padrao: "Ligeiro",
            obrigatorio: true,
            ajuda: "Motociclo inclui ciclomotores e moto 4.",
            largura: "meia",
          },
          {
            nome: "uso",
            rotulo: "Uso do veículo",
            tipo: "radio",
            opcoes: ["Particular", "Profissional"],
            padrao: "Particular",
            obrigatorio: true,
            ajuda: "Profissional: TVDE, transporte, empresa ou outros fins.",
            largura: "meia",
          },
          { nome: "marca", rotulo: "Marca", tipo: "marca", maxLength: 40, obrigatorioSe: semMatricula, largura: "meia" },
          {
            nome: "modelo",
            rotulo: "Modelo e versão",
            tipo: "texto",
            placeholder: "Ex.: Clio 1.5 dCi",
            maxLength: 80,
            obrigatorioSe: semMatricula,
            largura: "meia",
          },
          {
            nome: "combustivel",
            rotulo: "Combustível",
            tipo: "select",
            opcoes: ["Gasolina", "Gasóleo", "Híbrido", "Elétrico", "GPL"],
            largura: "meia",
          },
          {
            nome: "data_matricula",
            rotulo: "Data da 1.ª matrícula",
            tipo: "data",
            max: "hoje",
            validar: naoFuturaMatricula,
            largura: "meia",
            aviso: (v) => {
              const dias = v.data_matricula ? diasDesde(v.data_matricula) : null;
              return semMatricula(v) && v.motivo_sem_matricula === MOTIVO_NOVO && dias !== null && dias > 30
                ? "Um carro com mais de 30 dias normalmente já tem matrícula. Se tiver, indique-a acima."
                : null;
            },
          },
          {
            nome: "importado",
            rotulo: "Veículo importado?",
            tipo: "radio",
            opcoes: SIM_NAO,
            padrao: "Não",
            obrigatorio: true,
            mostrarSe: (v) => !semMatricula(v) || v.motivo_sem_matricula !== MOTIVO_IMPORTADO,
            largura: "meia",
          },
          {
            nome: "data_matricula_pt",
            rotulo: "Data da matrícula portuguesa, se for importado",
            tipo: "data",
            max: "hoje",
            validar: naoFuturaMatricula,
            obrigatorioSe: (v) => v.importado === "Sim" && !semMatricula(v),
            largura: "meia",
          },
          {
            nome: "atrelado",
            rotulo: "Leva atrelado ou reboque (bicicletas, pranchas, animais, mota)?",
            tipo: "radio",
            opcoes: SIM_NAO,
            padrao: "Não",
            obrigatorio: true,
          },
          { nome: "seguradora_atual", rotulo: "Seguradora atual, se tiver", tipo: "texto", maxLength: 80, largura: "meia" },
        ],
      },
      {
        id: "condutor",
        nome: "O condutor",
        titulo: "Agora, o condutor habitual.",
        texto: "É quem conduz o carro mais vezes.",
        campos: [
          {
            nome: "nascimento_condutor",
            rotulo: "Data de nascimento do condutor habitual",
            tipo: "data",
            obrigatorio: true,
            max: "hoje",
            validar: validarNascimentoCondutor,
            largura: "meia",
          },
          {
            nome: "data_carta",
            rotulo: "Data da carta de condução",
            tipo: "data",
            obrigatorio: true,
            max: "hoje",
            validar: naoFutura("A data da carta não pode ser no futuro."),
            largura: "meia",
          },
          {
            nome: "seguro_em_nome",
            rotulo: "O seguro fica em nome do condutor habitual?",
            tipo: "radio",
            opcoes: SIM_NAO,
            padrao: "Sim",
            obrigatorio: true,
          },
          {
            nome: "anos_seguro",
            rotulo: "Há quantos anos tem seguro automóvel em seu nome?",
            tipo: "radio",
            opcoes: ["Nunca tive", "Menos de 2", "2 a 5", "Mais de 5"],
          },
          {
            nome: "sinistros",
            rotulo: "Teve sinistros com culpa nos últimos 5 anos?",
            tipo: "radio",
            opcoes: ["Nenhum", "1", "2 ou mais"],
          },
        ],
      },
      {
        id: "tomador",
        nome: "Quem fica com o seguro",
        titulo: "Em nome de quem fica o seguro?",
        mostrarSe: (v) => v.seguro_em_nome === "Não",
        campos: [
          {
            nome: "tomador_nome",
            rotulo: "Nome de quem fica com o seguro",
            tipo: "texto",
            maxLength: 120,
            obrigatorio: true,
            largura: "meia",
          },
          {
            nome: "tomador_nif",
            rotulo: "NIF de quem fica com o seguro",
            tipo: "texto",
            inputMode: "numeric",
            maxLength: 9,
            obrigatorio: true,
            validar: validarNif,
            filtrar: soDigitos,
            largura: "meia",
          },
        ],
      },
      {
        id: "protecao",
        nome: "A proteção",
        titulo: "Que proteção procura?",
        texto: "Serve para pedirmos as propostas certas; pode mudar de ideias depois.",
        avancaQuando: (v) => Boolean(v.protecao),
        campos: [
          {
            nome: "protecao",
            rotulo: "Nível de proteção",
            tipo: "cartoes",
            obrigatorio: true,
            opcoes: ["Só o obrigatório", "Danos próprios, carro usado", "Proteção completa", "Não sei, aconselhem-me"],
            descricoes: [
              "Responsabilidade civil e assistência em viagem.",
              "Também choque, furto, incêndio e fenómenos da natureza.",
              "A mais alargada, para carro novo ou semi-novo.",
              "Um mediador explica as opções antes de pedir propostas.",
            ],
          },
        ],
      },
      {
        id: "extras",
        nome: "Extras",
        titulo: "Quer acrescentar alguma coisa?",
        texto: "Tudo opcional. O mediador confirma consigo antes de pedir as propostas.",
        campos: [
          {
            nome: "extras",
            rotulo: "Coberturas extra",
            tipo: "multipla",
            opcoes: ["Quebra de vidros", "Veículo de substituição", "Proteção jurídica", "Ocupantes"],
          },
          {
            nome: "inicio",
            rotulo: "Início do seguro",
            tipo: "data",
            min: "amanha",
            max: "doze_meses",
            ajuda: "Quando quer que comece. Se já tem seguro, a data em que termina.",
            largura: "meia",
          },
        ],
      },
    ],
    regras: (v) => {
      const erros: ErroRegra[] = [];
      const carta = validarCartaVsNascimento(v.data_carta ?? "", v.nascimento_condutor ?? "");
      if (carta) erros.push({ campo: "data_carta", mensagem: carta });
      if (v.data_matricula && v.data_matricula_pt && v.data_matricula_pt < v.data_matricula) {
        erros.push({ campo: "data_matricula_pt", mensagem: "A matrícula portuguesa não pode ser anterior à 1.ª matrícula." });
      }
      return erros;
    },
    nifParticular: (v) =>
      v.uso === "Particular" && v.seguro_em_nome !== "Não"
        ? "Para uso particular, indique o NIF de uma pessoa, não de empresa."
        : null,
  },
  vida: {
    titulo: "Peça uma proposta de seguro de vida.",
    texto: "Diga-nos para que precisa do seguro e quem quer segurar. Não pedimos dados de saúde neste formulário.",
    passos: [
      {
        id: "finalidade",
        nome: "Para que é",
        titulo: "Para que é o seguro de vida?",
        avancaQuando: (v) => Boolean(v.finalidade),
        campos: [
          {
            nome: "finalidade",
            rotulo: "Finalidade",
            tipo: "cartoes",
            opcoes: ["Crédito habitação", "Proteção da família", "Outro"],
            descricoes: [
              "O seguro que o banco pede para o empréstimo da casa.",
              "Um capital para quem depende de si.",
              "Outra situação: explique-nos no fim.",
            ],
            obrigatorio: true,
          },
        ],
      },
      {
        id: "seguro",
        nome: "O seguro",
        titulo: "Fale-nos do seguro.",
        campos: [
          {
            nome: "montante",
            rotulo: "Montante em dívida (€)",
            tipo: "numero",
            inputMode: "numeric",
            min: 0,
            obrigatorio: true,
            mostrarSe: (v) => v.finalidade === "Crédito habitação",
            largura: "meia",
          },
          {
            nome: "anos_credito",
            rotulo: "Anos que faltam do crédito",
            tipo: "numero",
            inputMode: "numeric",
            min: 1,
            max: 50,
            obrigatorio: true,
            mostrarSe: (v) => v.finalidade === "Crédito habitação",
            largura: "meia",
          },
          {
            nome: "banco",
            rotulo: "Banco do crédito",
            tipo: "texto",
            maxLength: 80,
            obrigatorio: true,
            mostrarSe: (v) => v.finalidade === "Crédito habitação",
            largura: "meia",
          },
          {
            nome: "trocar_banco",
            rotulo: "Quer trocar o seguro de vida que tem no banco?",
            tipo: "radio",
            opcoes: ["Sim", "Não", NAO_SEI],
            obrigatorio: true,
            mostrarSe: (v) => v.finalidade === "Crédito habitação",
          },
          {
            nome: "capital",
            rotulo: "Capital pretendido (€)",
            tipo: "numero",
            inputMode: "numeric",
            min: 0,
            mostrarSe: (v) => Boolean(v.finalidade) && v.finalidade !== "Crédito habitação",
            largura: "meia",
          },
          { nome: "pessoas", rotulo: "Idades das pessoas seguras", tipo: "pessoas", obrigatorio: true, maxPessoas: 2 },
        ],
      },
    ],
  },
  saude: {
    titulo: "Peça uma proposta de seguro de saúde.",
    texto: "Só precisamos de saber quem quer proteger e o que procura. Não pedimos informação sobre doenças.",
    passos: [
      {
        id: "para_quem",
        nome: "Para quem é",
        titulo: "Para quem é o seguro de saúde?",
        avancaQuando: (v) => Boolean(v.para_quem),
        campos: [
          {
            nome: "para_quem",
            rotulo: "Para quem é",
            tipo: "cartoes",
            obrigatorio: true,
            opcoes: ["Para mim e a minha família", "Só para outras pessoas", "Para a minha empresa"],
            descricoes: [
              "Fico no seguro, sozinho ou com quem quiser juntar.",
              "Eu pago, mas não fico no seguro.",
              "Seguro de grupo para a equipa.",
            ],
          },
        ],
      },
      {
        id: "pessoas",
        nome: "As pessoas",
        titulo: "Quem fica no seguro?",
        campos: [
          {
            nome: "pessoas",
            rotulo: "Idades das pessoas seguras",
            tipo: "pessoas",
            obrigatorio: true,
            maxPessoas: 10,
            titularSe: (v) => v.para_quem === "Para mim e a minha família",
            mostrarSe: (v) => Boolean(v.para_quem) && v.para_quem !== "Para a minha empresa",
          },
          {
            nome: "n_pessoas",
            rotulo: "Nº de pessoas",
            tipo: "numero",
            inputMode: "numeric",
            min: 1,
            max: 5000,
            obrigatorio: true,
            mostrarSe: (v) => v.para_quem === "Para a minha empresa",
            largura: "meia",
          },
          {
            nome: "idades",
            rotulo: "Idades aproximadas",
            tipo: "texto",
            placeholder: "Ex.: entre 25 e 50",
            maxLength: 80,
            mostrarSe: (v) => v.para_quem === "Para a minha empresa",
            largura: "meia",
          },
        ],
      },
      {
        id: "necessidades",
        nome: "O que procura",
        titulo: "O que é mais importante para si?",
        texto: "Escolha a frase que mais se aproxima. Não perguntamos nada sobre a sua saúde.",
        avancaQuando: (v) => Boolean(v.necessidade),
        campos: [
          {
            nome: "necessidade",
            rotulo: "O mais importante",
            tipo: "cartoes",
            obrigatorio: true,
            opcoes: [
              "Um seguro mais barato",
              "Consultas regulares e internamento",
              "Consultas, exames, tratamentos e parto",
              "Doenças graves e oncológicas",
              "Cuidados dentários",
              "Não sei, aconselhem-me",
            ],
            descricoes: [
              "Sobretudo para o caso de internamento.",
              "Para quem vai ao médico com frequência.",
              "Uma proteção alargada, dentro e fora da rede.",
              "Mais capital para as situações mais pesadas.",
              "Consultas e tratamentos no dentista.",
              "Um mediador explica as opções antes de pedir propostas.",
            ],
          },
        ],
      },
      {
        id: "detalhes",
        nome: "Detalhes",
        titulo: "Só mais uns detalhes.",
        campos: [
          { nome: "tem_seguro", rotulo: "Já tem seguro de saúde?", tipo: "radio", opcoes: SIM_NAO, largura: "meia" },
          { nome: "seguradora_atual", rotulo: "Seguradora atual, se tiver", tipo: "texto", maxLength: 80, largura: "meia" },
          { nome: "preferencia", rotulo: "Preferência", tipo: "radio", opcoes: ["Rede convencionada", "Reembolso", NAO_SEI] },
          {
            nome: "pagamento",
            rotulo: "Como prefere pagar?",
            tipo: "radio",
            opcoes: ["Mensal", "Trimestral", "Semestral", "Anual", NAO_SEI],
          },
        ],
      },
    ],
  },
  habitacao: {
    titulo: "Peça uma proposta de seguro multirriscos.",
    texto: "Alguns dados da casa chegam para começarmos a comparar.",
    passos: [
      {
        id: "imovel",
        nome: "O imóvel",
        titulo: "Fale-nos da casa.",
        campos: [
          { nome: "tipo_imovel", rotulo: "Tipo de imóvel", tipo: "radio", opcoes: ["Apartamento", "Moradia"], largura: "meia" },
          {
            nome: "utilizacao",
            rotulo: "Habitação permanente ou secundária?",
            tipo: "radio",
            opcoes: ["Permanente", "Secundária"],
            obrigatorio: true,
            largura: "meia",
          },
          {
            nome: "situacao",
            rotulo: "Situação",
            tipo: "radio",
            opcoes: ["Proprietário, vivo lá", "Proprietário, arrendo a outros", "Inquilino"],
          },
          { nome: "segurar", rotulo: "O que quer segurar?", tipo: "radio", opcoes: ["Edifício", "Recheio", "Ambos", NAO_SEI] },
          { nome: "credito", rotulo: "Tem crédito habitação?", tipo: "radio", opcoes: SIM_NAO },
          {
            nome: "morada_imovel",
            rotulo: "Morada do imóvel",
            tipo: "morada",
            codigoPostal: "codigo_postal_imovel",
            placeholder: "Escreva a rua e escolha uma sugestão",
            maxLength: 160,
          },
          {
            nome: "codigo_postal_imovel",
            rotulo: "Código postal do imóvel",
            tipo: "codigo_postal",
            obrigatorio: true,
            largura: "meia",
          },
          {
            nome: "area",
            rotulo: "Área aproximada (m²)",
            tipo: "numero",
            inputMode: "numeric",
            min: 10,
            max: 5000,
            largura: "meia",
          },
          {
            nome: "ano_construcao",
            rotulo: "Ano de construção",
            tipo: "numero",
            inputMode: "numeric",
            min: 1800,
            max: ANO_ATUAL,
            largura: "meia",
          },
          {
            nome: "construcao",
            rotulo: "Tipo de construção",
            tipo: "radio",
            opcoes: ["Betão", "Alvenaria", "Madeira ou outra", NAO_SEI],
          },
        ],
      },
    ],
  },
  trabalho: {
    titulo: "Peça uma proposta de acidentes de trabalho.",
    texto: "Com a atividade, o nº de trabalhadores e a massa salarial conseguimos pedir propostas.",
    passos: [
      {
        id: "independente",
        nome: "Quem trabalha",
        titulo: "É trabalhador independente?",
        avancaQuando: (v) => Boolean(v.independente),
        campos: [
          {
            nome: "independente",
            rotulo: "Situação",
            tipo: "cartoes",
            opcoes: ["Sim", COM_TRABALHADORES],
            descricoes: ["Trabalho por conta própria, sem ninguém a cargo.", "Tenho uma empresa com pessoas a trabalhar."],
            obrigatorio: true,
          },
        ],
      },
      {
        id: "atividade",
        nome: "A atividade",
        titulo: "Fale-nos da atividade.",
        campos: [
          {
            nome: "empresa",
            rotulo: "Nome da empresa",
            tipo: "texto",
            autoComplete: "organization",
            maxLength: 120,
            mostrarSe: (v) => v.independente === COM_TRABALHADORES,
            largura: "meia",
          },
          {
            nome: "nipc",
            rotulo: "NIPC da empresa",
            tipo: "texto",
            inputMode: "numeric",
            maxLength: 9,
            obrigatorio: true,
            validar: validarNipc,
            filtrar: soDigitos,
            mostrarSe: (v) => v.independente === COM_TRABALHADORES,
            largura: "meia",
          },
          {
            nome: "atividade",
            rotulo: "Atividade",
            tipo: "texto",
            placeholder: "Ex.: restauração, construção",
            maxLength: 120,
            largura: "meia",
          },
          {
            nome: "cae",
            rotulo: "Código CAE",
            tipo: "texto",
            inputMode: "numeric",
            maxLength: 5,
            filtrar: soDigitos,
            validar: (v) => (v && !/^\d{5}$/.test(v) ? "O código CAE tem 5 dígitos." : null),
            largura: "meia",
          },
          {
            nome: "trabalhadores",
            rotulo: "Nº de trabalhadores",
            tipo: "numero",
            inputMode: "numeric",
            min: 0,
            max: 10000,
            mostrarSe: (v) => v.independente === COM_TRABALHADORES,
            largura: "meia",
          },
          {
            nome: "massa_salarial",
            rotulo: "Massa salarial anual (€)",
            placeholder: "Valor aproximado",
            tipo: "numero",
            inputMode: "numeric",
            min: 0,
            largura: "meia",
          },
        ],
      },
    ],
    nifDispensavel: (v) => v.independente === COM_TRABALHADORES,
    nifParticular: (v) =>
      v.independente === "Sim" ? "Como trabalhador independente, indique o seu NIF pessoal, não o de uma empresa." : null,
  },
  outros: {
    titulo: "Diga-nos que seguro procura.",
    texto: "Descreva a situação e procuramos a solução junto das seguradoras.",
    semMensagemLivre: true,
    semRevisao: true,
    passos: [
      {
        id: "pedido",
        nome: "O pedido",
        titulo: "Que seguro procura?",
        campos: [
          {
            nome: "tipo",
            rotulo: "Tipo de seguro",
            tipo: "select",
            opcoes: ["Responsabilidade civil", "Viagem", "Animais de companhia", "Acidentes pessoais", "Empresa", "Outro"],
          },
          { nome: "descricao", rotulo: "O que precisa de segurar?", tipo: "textarea", obrigatorio: true, maxLength: 1500 },
        ],
      },
    ],
  },
};

export function campoVisivel(campo: Campo, v: Valores): boolean {
  return campo.mostrarSe ? campo.mostrarSe(v) : true;
}

export function campoObrigatorio(campo: Campo, v: Valores): boolean {
  return Boolean(campo.obrigatorio || campo.obrigatorioSe?.(v));
}
