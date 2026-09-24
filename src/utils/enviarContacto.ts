/**
 * Envia o pedido de contacto do site para o CRM (Supabase), via a função
 * pública `criar_lead_site`. Fetch simples em vez do SDK do Supabase: é a
 * única chamada que o site faz, não justifica a dependência.
 */

export type RamoCrm = "auto" | "vida" | "saude" | "multirriscos" | "acidentes_trabalho" | "outro";

export type PedidoContacto = {
  nome: string;
  email: string;
  telefone: string;
  ramo: RamoCrm;
  mensagem: string;
  consentimento: boolean;
};

export type ErroContacto = "dados_invalidos" | "limite_excedido" | "falha_envio";

export class EnvioContactoError extends Error {
  constructor(public readonly motivo: ErroContacto) {
    super(motivo);
  }
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export async function enviarContacto(pedido: PedidoContacto): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Faltam VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (ver .env.example).");
    throw new EnvioContactoError("falha_envio");
  }

  let resposta: Response;
  try {
    resposta = await fetch(`${SUPABASE_URL}/rest/v1/rpc/criar_lead_site`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        p_nome: pedido.nome,
        p_email: pedido.email,
        p_telefone: pedido.telefone,
        p_ramo: pedido.ramo,
        p_mensagem: pedido.mensagem,
        p_consentimento: pedido.consentimento,
      }),
    });
  } catch {
    throw new EnvioContactoError("falha_envio");
  }

  if (resposta.ok) return;

  // A função devolve o motivo na mensagem do erro (ver crm/supabase/schema.sql).
  const corpo = (await resposta.json().catch(() => null)) as { message?: string } | null;
  if (corpo?.message === "limite_excedido") throw new EnvioContactoError("limite_excedido");
  if (corpo?.message === "dados_invalidos" || corpo?.message === "consentimento_em_falta") {
    throw new EnvioContactoError("dados_invalidos");
  }
  throw new EnvioContactoError("falha_envio");
}
