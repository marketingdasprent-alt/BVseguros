import ContactoForm from "./ContactoForm";
import type { EnvioPedido, Modalidade } from "./ContactoForm";
import { enviarPedidoSinistro } from "../utils/enviarPedidoSinistro";
import { normalizarTelefone } from "../utils/validacoes";
import { CAMPOS_FIXOS_SINISTRO, FORMULARIOS_SINISTRO } from "../data/formulariosSinistro";
import { SEGUROS, SEGUROS_FORMULARIO } from "../data/seguros";
import type { RamoKey } from "../data/seguros";

const texto = (dados: FormData, nome: string) => String(dados.get(nome) ?? "").trim();

/**
 * Vai para o CRM como pedido de sinistro (pedidos_sinistro), não como lead:
 * os campos fixos nas suas colunas, as respostas do ramo em `detalhes`. O
 * NIF segue nos detalhes: ajuda a equipa a encontrar o cliente no CRM.
 */
async function enviarSinistro({ dados, valores, ramo }: EnvioPedido, token: string | null) {
  const fixo = (nome: string) => (valores[nome] ?? "").trim();
  const nif = texto(dados, "nif").replace(/\D/g, "");
  const detalhes = Object.fromEntries(
    [
      ["nif", nif],
      ...Object.entries(valores).filter(([nome]) => !CAMPOS_FIXOS_SINISTRO.includes(nome)),
    ]
      .map(([nome, valor]) => [nome, valor.trim()])
      .filter(([, valor]) => valor !== "")
  );
  await enviarPedidoSinistro(
    {
      nome: texto(dados, "nome"),
      email: texto(dados, "email"),
      telefone: normalizarTelefone(texto(dados, "telefone")),
      ramo,
      numeroApolice: fixo("numero_apolice"),
      seguradora: fixo("seguradora"),
      dataOcorrencia: fixo("data_ocorrencia"),
      local: fixo("local"),
      descricao: fixo("descricao"),
      detalhes,
      consentimento: dados.get("consentimento") === "sim",
    },
    token
  );
}

const SINISTRO: Modalidade = {
  formularios: FORMULARIOS_SINISTRO,
  tituloTipo: "Que seguro vai acionar?",
  textoDados: "Para falarmos consigo sobre o sinistro.",
  nifObrigatorio: false,
  comCodigoPostal: false,
  porquePedimos: "Só para tratar este pedido de sinistro e falar consigo sobre ele.",
  finalidade: "tratar este pedido de sinistro",
  rotuloEnviar: "Enviar pedido de sinistro",
  sucesso: {
    titulo: "Pedido recebido.",
    texto:
      "Vamos contactá-lo para tratar do sinistro. Lembre-se: em regra, a participação à seguradora deve ser feita no prazo de 8 dias.",
  },
  aviso: (
    <div className="claim-notice" role="note">
      <p>
        <strong>Em caso de feridos ou perigo, ligue 112.</strong>
      </p>
      <p className="text-body-small">
        Este pedido chega à BV Seguros, que o acompanha junto da seguradora. Não substitui a participação à
        seguradora, que em regra deve ser feita no prazo de 8 dias.
      </p>
    </div>
  ),
  enviar: enviarSinistro,
};

/**
 * Pedido de ajuda com um sinistro, por passos, com o mesmo padrão do pedido
 * de proposta (deslize lateral, matrícula em destaque, nada abre por baixo).
 * Sem perguntas de saúde.
 */
export default function SinistroForm({ ramoInicial }: { ramoInicial?: RamoKey }) {
  const seguro = SEGUROS.find((s) => s.key === ramoInicial);
  return (
    <ContactoForm
      ramos={SEGUROS_FORMULARIO}
      ramoFixo={seguro ? { valor: seguro.ramoCrm, formulario: FORMULARIOS_SINISTRO[seguro.key] } : undefined}
      modalidade={SINISTRO}
    />
  );
}
