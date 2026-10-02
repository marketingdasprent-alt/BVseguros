import type { Campo, PassoRamo, Valores } from "../data/formularios";

/** Limite de `p_mensagem` na função criar_lead_site (crm/supabase/schema.sql). */
export const MAX_MENSAGEM = 2000;

/** Um bloco do resumo e da mensagem do CRM: um passo, com as suas respostas. */
export type Bloco = { titulo: string; passo?: string; linhas: { rotulo: string; valor: string }[] };

/** input type="date" devolve aaaa-mm-dd; no CRM e no resumo lê-se melhor em dd/mm/aaaa. */
export function dataPt(valor: string): string {
  const [a, m, d] = valor.split("-");
  return a && m && d ? `${d}/${m}/${a}` : valor;
}

function valorLegivel(campo: Campo, valores: Valores): string {
  const v = (valores[campo.nome] ?? "").trim();
  if (!v) return "";
  if (campo.tipo === "data") return dataPt(v);
  if (campo.tipo === "codigo_postal") {
    const local = (valores[`${campo.nome}_local`] ?? "").trim();
    return local ? `${v} (${local})` : v;
  }
  return v;
}

/** Os passos do ramo como blocos "Rótulo: valor", só com o que foi respondido. */
export function blocosDosPassos(passos: PassoRamo[], valores: Valores): Bloco[] {
  return passos
    .map((p) => ({
      titulo: p.nome,
      passo: p.id,
      linhas: p.campos
        .map((c) => ({ rotulo: c.rotulo, valor: valorLegivel(c, valores) }))
        .filter((l) => l.valor !== ""),
    }))
    .filter((b) => b.linhas.length > 0);
}

/**
 * Junta o contexto já escolhido na página (ex.: nível de proteção) e os
 * blocos do ramo num texto "[Passo]" e "Rótulo: valor" legível no CRM,
 * seguido da mensagem livre. Se passar do limite, corta a mensagem livre
 * (as respostas do ramo são o que a BV precisa para pedir propostas).
 */
export function montarMensagem(blocos: Bloco[], livre: string, contexto: string[] = []): string {
  const partes = [
    ...contexto,
    ...blocos.flatMap((b) => [`[${b.titulo}]`, ...b.linhas.map((l) => `${l.rotulo}: ${l.valor}`)]),
  ];
  const detalhes = partes.join("\n");
  const texto = livre.trim();
  if (!texto) return detalhes.slice(0, MAX_MENSAGEM);
  if (!detalhes) return texto.slice(0, MAX_MENSAGEM);

  const prefixo = `${detalhes}\n\nMensagem:\n`;
  const espaco = MAX_MENSAGEM - prefixo.length;
  if (espaco <= 0) return detalhes.slice(0, MAX_MENSAGEM);
  return prefixo + (texto.length > espaco ? `${texto.slice(0, espaco - 1)}…` : texto);
}
