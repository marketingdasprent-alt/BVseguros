import { enviarPedidoSite } from "./enviarContacto";
import type { RamoCrm } from "./enviarContacto";

export type PedidoSinistro = {
  nome: string;
  email: string;
  telefone: string;
  ramo: RamoCrm;
  numeroApolice: string;
  seguradora: string;
  /** aaaa-mm-dd, do input type="date". */
  dataOcorrencia: string;
  local: string;
  descricao: string;
  /** Respostas próprias do ramo (src/data/formulariosSinistro.ts), só as preenchidas. */
  detalhes: Record<string, string>;
  consentimento: boolean;
};

/** Pedido de sinistro para o CRM (tabela pedidos_sinistro), não um lead. */
export async function enviarPedidoSinistro(p: PedidoSinistro, token: string | null): Promise<void> {
  await enviarPedidoSite("sinistro", {
    p_nome: p.nome,
    p_email: p.email,
    p_telefone: p.telefone,
    p_ramo: p.ramo,
    p_numero_apolice: p.numeroApolice,
    p_seguradora: p.seguradora,
    p_data_ocorrencia: p.dataOcorrencia,
    p_local: p.local,
    p_descricao: p.descricao,
    p_detalhes: p.detalhes,
    p_consentimento: p.consentimento,
  }, token);
}
