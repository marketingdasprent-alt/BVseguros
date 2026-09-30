/**
 * Envia os pedidos do site para o CRM através da função da Vercel `/api/pedido`
 * (api/pedido.ts), que confirma o Turnstile, aplica o limite por IP e só depois
 * chama o Supabase: `criar_lead_site` para propostas, `criar_pedido_sinistro_site`
 * para sinistros. O browser já não fala com o Supabase.
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

export type ErroContacto = "dados_invalidos" | "limite_excedido" | "verificacao_falhou" | "falha_envio";

/** Texto para o visitante, por motivo de erro devolvido por /api/pedido. */
export const MENSAGEM_ERRO: Record<ErroContacto, string> = {
  dados_invalidos: "Verifique os dados do formulário e tente novamente.",
  limite_excedido:
    "Recebemos vários pedidos seguidos deste contacto ou desta ligação. Tente novamente mais tarde, ou escreva-nos para geral@bvseguros.pt.",
  verificacao_falhou:
    "Não conseguimos confirmar que o pedido foi feito por uma pessoa. Recarregue a página e tente novamente.",
  falha_envio:
    "Não foi possível enviar o pedido. Verifique a ligação e tente novamente, ou escreva-nos para geral@bvseguros.pt.",
};

export class EnvioContactoError extends Error {
  constructor(public readonly motivo: ErroContacto) {
    super(motivo);
  }
}

const MOTIVOS: ErroContacto[] = ["dados_invalidos", "limite_excedido", "verificacao_falhou"];

export async function enviarContacto(pedido: PedidoContacto, token: string | null): Promise<void> {
  await enviarPedidoSite(
    "lead",
    {
      p_nome: pedido.nome,
      p_email: pedido.email,
      p_telefone: pedido.telefone,
      p_ramo: pedido.ramo,
      p_mensagem: pedido.mensagem,
      p_consentimento: pedido.consentimento,
    },
    token
  );
}

/** Envia para /api/pedido e traduz o motivo de erro que a função devolve. */
export async function enviarPedidoSite(
  tipo: "lead" | "sinistro",
  parametros: Record<string, unknown>,
  token: string | null
): Promise<void> {
  if (!token) throw new EnvioContactoError("verificacao_falhou");

  let resposta: Response;
  try {
    resposta = await fetch("/api/pedido", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, token, parametros }),
    });
  } catch {
    throw new EnvioContactoError("falha_envio");
  }

  if (resposta.ok) return;
  const corpo = (await resposta.json().catch(() => null)) as { erro?: string } | null;
  const motivo = MOTIVOS.find((m) => m === corpo?.erro);
  throw new EnvioContactoError(motivo ?? "falha_envio");
}
