import { matriculaCompleta } from "./formularios";
import type { Campo, FormularioRamo, PassoRamo } from "./formularios";
import type { RamoKey } from "./seguros";
import { naoFutura } from "../utils/validacoes";

const SIM_NAO = ["Sim", "Não"];

/**
 * Perguntas de cada ramo no pedido de sinistro. As chaves (`nome`) têm
 * rótulo no CRM (crm/src/lib/pedidosSinistro.ts, ROTULOS_DETALHES) e a
 * função criar_pedido_sinistro_site aceita só texto curto por chave.
 * Nunca perguntar lesões, diagnósticos ou tratamentos: dados de saúde
 * (art. 9.º RGPD). "Houve feridos?" fica por sim/não.
 */
export const CAMPOS_SINISTRO: Record<RamoKey, Campo[]> = {
  auto: [
    { nome: "outro_veiculo", rotulo: "Houve outro veículo envolvido?", tipo: "radio", opcoes: SIM_NAO, largura: "meia" },
    { nome: "declaracao_amigavel", rotulo: "Preencheu a Declaração Amigável?", tipo: "radio", opcoes: SIM_NAO, largura: "meia" },
    { nome: "feridos", rotulo: "Houve feridos?", tipo: "radio", opcoes: SIM_NAO, largura: "meia" },
    { nome: "autoridades", rotulo: "As autoridades estiveram no local?", tipo: "radio", opcoes: SIM_NAO, largura: "meia" },
  ],
  habitacao: [
    {
      nome: "tipo_dano",
      rotulo: "Tipo de dano",
      tipo: "select",
      opcoes: ["Danos por água", "Incêndio", "Furto ou roubo", "Tempestade ou inundação", "Outro"],
      largura: "meia",
    },
    { nome: "habitavel", rotulo: "A casa continua habitável?", tipo: "radio", opcoes: SIM_NAO, largura: "meia" },
    { nome: "queixa", rotulo: "Em caso de furto, já apresentou queixa às autoridades?", tipo: "radio", opcoes: ["Sim", "Não", "Não foi furto"] },
  ],
  saude: [
    {
      nome: "tipo_pedido",
      rotulo: "Do que precisa?",
      tipo: "radio",
      opcoes: ["Reembolso de despesas", "Autorização prévia de cirurgia ou internamento", "Outro"],
    },
  ],
  trabalho: [
    { nome: "empresa", rotulo: "Empresa", tipo: "texto", autoComplete: "organization", maxLength: 120, largura: "meia" },
    { nome: "onde_ocorreu", rotulo: "Onde aconteceu?", tipo: "radio", opcoes: ["No local de trabalho", "No trajeto casa-trabalho"], largura: "meia" },
    { nome: "assistido", rotulo: "O trabalhador já foi assistido?", tipo: "radio", opcoes: SIM_NAO },
  ],
  vida: [
    {
      nome: "relacao",
      rotulo: "Qual a sua relação com a pessoa segura?",
      tipo: "radio",
      opcoes: ["Sou a pessoa segura", "Beneficiário", "Familiar", "Outra"],
    },
  ],
  outros: [{ nome: "tipo_seguro", rotulo: "Que seguro é?", tipo: "texto", placeholder: "Ex.: responsabilidade civil, viagem", maxLength: 80 }],
};

/** Campos que vão em colunas próprias de pedidos_sinistro; o resto segue em `detalhes`. */
export const CAMPOS_FIXOS_SINISTRO = ["numero_apolice", "seguradora", "data_ocorrencia", "local", "descricao"];

// A matrícula em destaque, como no pedido de proposta. Opcional: quem não a souber de cor avança.
const MATRICULA: PassoRamo = {
  id: "matricula",
  nome: "A matrícula",
  titulo: "Qual é a matrícula do seu carro?",
  texto: "Se não a souber de cor, avance: encontramos o carro pela apólice.",
  destaque: "matricula",
  avancaQuando: (v) => matriculaCompleta(v.matricula ?? ""),
  campos: [{ nome: "matricula", rotulo: "Matrícula do seu veículo", tipo: "matricula" }],
};

const ocorrencia = (ramo: RamoKey): PassoRamo => ({
  id: "ocorrencia",
  nome: "A ocorrência",
  titulo: "Quando e onde aconteceu?",
  campos: [
    {
      nome: "data_ocorrencia",
      rotulo: "Data da ocorrência",
      tipo: "data",
      obrigatorio: true,
      min: "ha_dois_anos",
      max: "hoje",
      validar: naoFutura("A data da ocorrência não pode ser no futuro."),
      largura: "meia",
    },
    { nome: "local", rotulo: "Local", tipo: "texto", placeholder: "Ex.: Lisboa, A5", maxLength: 160, largura: "meia" },
    ...CAMPOS_SINISTRO[ramo],
  ],
});

const APOLICE: PassoRamo = {
  id: "apolice",
  nome: "A apólice",
  titulo: "Que apólice vai acionar?",
  texto: "Se não souber, deixe em branco: encontramos a apólice pelo seu NIF ou nome.",
  campos: [
    { nome: "numero_apolice", rotulo: "Nº da apólice, se souber", tipo: "texto", maxLength: 60, largura: "meia" },
    { nome: "seguradora", rotulo: "Seguradora, se souber", tipo: "texto", maxLength: 80, largura: "meia" },
  ],
};

const DESCRICAO: PassoRamo = {
  id: "descricao",
  nome: "O que aconteceu",
  titulo: "Conte-nos o que aconteceu.",
  campos: [
    {
      nome: "descricao",
      rotulo: "Descreva o que aconteceu",
      tipo: "textarea",
      obrigatorio: true,
      minLength: 10,
      maxLength: 1500,
      ajuda: "Não inclua informação sobre lesões ou saúde: tratamos disso diretamente consigo.",
    },
  ],
};

const formulario = (ramo: RamoKey): FormularioRamo => ({
  titulo: "Participar sinistro.",
  texto: "Conte-nos o que aconteceu. Um mediador da BV fala consigo e acompanha o processo junto da seguradora.",
  semMensagemLivre: true,
  passos: [...(ramo === "auto" ? [MATRICULA] : []), ocorrencia(ramo), APOLICE, DESCRICAO],
});

/** Passos do pedido de sinistro de cada ramo, com o mesmo padrão do pedido de proposta. */
export const FORMULARIOS_SINISTRO: Record<RamoKey, FormularioRamo> = {
  auto: formulario("auto"),
  vida: formulario("vida"),
  saude: formulario("saude"),
  habitacao: formulario("habitacao"),
  trabalho: formulario("trabalho"),
  outros: formulario("outros"),
};
