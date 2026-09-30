import type { Campo } from "../data/formularios";

/** Limite de `p_mensagem` na função criar_lead_site (crm/supabase/schema.sql). */
export const MAX_MENSAGEM = 2000;

function formatarValor(campo: Campo, valor: string): string {
  // input type="date" devolve aaaa-mm-dd; no CRM lê-se melhor em dd/mm/aaaa.
  if (campo.tipo === "data") {
    const [a, m, d] = valor.split("-");
    return a && m && d ? `${d}/${m}/${a}` : valor;
  }
  return valor;
}

/**
 * Junta os campos do ramo num bloco "Rótulo: valor" legível no CRM,
 * seguido da mensagem livre. Se passar do limite, corta a mensagem livre
 * (os campos do ramo são o que a BV precisa para pedir propostas).
 */
export function montarMensagem(campos: Campo[], valores: Record<string, string>, livre: string): string {
  const linhas = campos
    .map((c) => ({ c, v: (valores[c.nome] ?? "").trim() }))
    .filter(({ v }) => v !== "")
    .map(({ c, v }) => `${c.rotulo}: ${formatarValor(c, v)}`);
  const detalhes = linhas.join("\n");
  const texto = livre.trim();
  if (!texto) return detalhes.slice(0, MAX_MENSAGEM);
  if (!detalhes) return texto.slice(0, MAX_MENSAGEM);

  const prefixo = `${detalhes}\n\nMensagem:\n`;
  const espaco = MAX_MENSAGEM - prefixo.length;
  if (espaco <= 0) return detalhes.slice(0, MAX_MENSAGEM);
  return prefixo + (texto.length > espaco ? `${texto.slice(0, espaco - 1)}…` : texto);
}
