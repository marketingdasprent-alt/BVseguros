import type { RamoKey } from "./seguros";
import {
  formatarCodigoPostal,
  formatarMatricula,
  validarCodigoPostal,
  validarIdades,
  validarMatricula,
  validarNascimentoCondutor,
} from "../utils/validacoes";
import type { Validador } from "../utils/validacoes";

export type Campo = {
  nome: string;
  rotulo: string;
  tipo: "texto" | "numero" | "data" | "select" | "radio" | "textarea";
  opcoes?: string[];
  obrigatorio?: boolean;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "numeric" | "decimal" | "text";
  min?: number;
  max?: number;
  maxLength?: number;
  /** Validação própria do campo (src/utils/validacoes.ts), além de required/min/max. */
  validar?: Validador;
  /** Arruma o valor ao sair do campo (ex.: matrícula em maiúsculas com hífenes). */
  formatar?: (valor: string) => string;
  /** "meia": ocupa uma de duas colunas em desktop. */
  largura?: "meia" | "inteira";
};

export type FormularioRamo = {
  titulo: string;
  texto: string;
  campos: Campo[];
  /** Esconde "Algo mais que devamos saber?" quando um campo do ramo já faz esse papel. */
  semMensagemLivre?: boolean;
};

const ANO_ATUAL = new Date().getFullYear();
const NAO_SEI = "Não sei";

/**
 * O que a BV precisa para pedir propostas de cada ramo. Tudo opcional
 * salvo indicação: menos campos obrigatórios, mais pedidos enviados.
 * Os valores seguem para o CRM dentro da mensagem do lead (opção A,
 * DECISIONS.md 2026-09-30). Saúde e Vida não perguntam doenças nem
 * estado de saúde: dados de categoria especial (art. 9.º RGPD).
 */
export const FORMULARIOS: Record<RamoKey, FormularioRamo> = {
  auto: {
    titulo: "Peça uma proposta de seguro automóvel.",
    texto: "Tenha à mão os dados do carro e do condutor habitual. O que não souber, deixe em branco.",
    campos: [
      { nome: "matricula", rotulo: "Matrícula", tipo: "texto", placeholder: "AA-00-AA", maxLength: 12, largura: "meia", validar: validarMatricula, formatar: formatarMatricula },
      { nome: "marca_modelo", rotulo: "Marca e modelo", tipo: "texto", placeholder: "Ex.: Renault Clio", maxLength: 80, largura: "meia" },
      { nome: "ano_veiculo", rotulo: "Ano do veículo", tipo: "numero", inputMode: "numeric", min: 1950, max: ANO_ATUAL + 1, largura: "meia" },
      { nome: "nascimento_condutor", rotulo: "Data de nascimento do condutor habitual", tipo: "data", largura: "meia", validar: validarNascimentoCondutor },
      { nome: "ano_carta", rotulo: "Ano da carta de condução", tipo: "numero", inputMode: "numeric", min: 1950, max: ANO_ATUAL, largura: "meia" },
      { nome: "seguradora_atual", rotulo: "Seguradora atual, se tiver", tipo: "texto", maxLength: 80, largura: "meia" },
      { nome: "coberturas", rotulo: "Que proteção procura?", tipo: "radio", opcoes: ["Contra terceiros", "Com danos próprios", NAO_SEI] },
    ],
  },
  vida: {
    titulo: "Peça uma proposta de seguro de vida.",
    texto: "Diga-nos para que precisa do seguro e quem quer segurar. Não pedimos dados de saúde neste formulário.",
    campos: [
      { nome: "finalidade", rotulo: "Para que é o seguro?", tipo: "radio", opcoes: ["Crédito habitação", "Proteção da família", "Outro"] },
      { nome: "capital", rotulo: "Capital pretendido (€)", tipo: "numero", inputMode: "numeric", min: 0, largura: "meia" },
      { nome: "pessoas", rotulo: "Nº de pessoas a segurar", tipo: "numero", inputMode: "numeric", min: 1, max: 10, largura: "meia" },
      { nome: "idades", rotulo: "Idade de cada pessoa", tipo: "texto", placeholder: "Ex.: 38, 36", maxLength: 60, largura: "meia", validar: validarIdades },
      { nome: "banco", rotulo: "Banco do crédito, se houver", tipo: "texto", maxLength: 80, largura: "meia" },
    ],
  },
  saude: {
    titulo: "Peça uma proposta de seguro de saúde.",
    texto: "Só precisamos de saber quem quer proteger. Não pedimos informação sobre doenças neste formulário.",
    campos: [
      { nome: "para_quem", rotulo: "Para quem é o seguro?", tipo: "radio", opcoes: ["Só para mim", "Para a família", "Para a empresa"] },
      { nome: "pessoas", rotulo: "Nº de pessoas", tipo: "numero", inputMode: "numeric", min: 1, max: 500, largura: "meia" },
      { nome: "idades", rotulo: "Idades", tipo: "texto", placeholder: "Ex.: 40, 38, 9", maxLength: 80, largura: "meia", validar: validarIdades },
      { nome: "preferencia", rotulo: "Preferência", tipo: "radio", opcoes: ["Rede convencionada", "Reembolso", NAO_SEI] },
    ],
  },
  habitacao: {
    titulo: "Peça uma proposta de seguro multirriscos.",
    texto: "Alguns dados da casa chegam para começarmos a comparar.",
    campos: [
      { nome: "tipo_imovel", rotulo: "Tipo de imóvel", tipo: "radio", opcoes: ["Apartamento", "Moradia"] },
      { nome: "situacao", rotulo: "Situação", tipo: "radio", opcoes: ["Proprietário", "Arrendatário"] },
      { nome: "credito", rotulo: "Tem crédito habitação?", tipo: "radio", opcoes: ["Sim", "Não"] },
      { nome: "segurar", rotulo: "O que quer segurar?", tipo: "radio", opcoes: ["Edifício", "Recheio", "Ambos", NAO_SEI] },
      { nome: "codigo_postal", rotulo: "Código postal", tipo: "texto", placeholder: "0000-000", autoComplete: "postal-code", maxLength: 8, largura: "meia", validar: validarCodigoPostal, formatar: formatarCodigoPostal },
      { nome: "area", rotulo: "Área aproximada (m²)", tipo: "numero", inputMode: "numeric", min: 10, max: 5000, largura: "meia" },
      { nome: "ano_construcao", rotulo: "Ano de construção", tipo: "numero", inputMode: "numeric", min: 1800, max: ANO_ATUAL, largura: "meia" },
    ],
  },
  trabalho: {
    titulo: "Peça uma proposta de acidentes de trabalho.",
    texto: "Com a atividade, o nº de trabalhadores e a massa salarial conseguimos pedir propostas.",
    campos: [
      { nome: "independente", rotulo: "É trabalhador independente?", tipo: "radio", opcoes: ["Sim", "Não, tenho trabalhadores"] },
      { nome: "empresa", rotulo: "Nome da empresa", tipo: "texto", autoComplete: "organization", maxLength: 120, largura: "meia" },
      { nome: "atividade", rotulo: "Atividade", tipo: "texto", placeholder: "Ex.: restauração, construção", maxLength: 120, largura: "meia" },
      { nome: "trabalhadores", rotulo: "Nº de trabalhadores", tipo: "numero", inputMode: "numeric", min: 0, max: 10000, largura: "meia" },
      { nome: "massa_salarial", rotulo: "Massa salarial anual aproximada (€)", tipo: "numero", inputMode: "numeric", min: 0, largura: "meia" },
    ],
  },
  outros: {
    titulo: "Diga-nos que seguro procura.",
    texto: "Descreva a situação e procuramos a solução junto das seguradoras.",
    semMensagemLivre: true,
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
};
