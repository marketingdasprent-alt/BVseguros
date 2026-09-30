import type { Campo } from "./formularios";
import type { RamoKey } from "./seguros";

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
    { nome: "matricula", rotulo: "Matrícula do seu veículo", tipo: "texto", placeholder: "AA-00-AA", maxLength: 12, largura: "meia" },
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
