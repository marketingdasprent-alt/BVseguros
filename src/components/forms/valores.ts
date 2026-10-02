import type { Valores } from "../../data/formularios";

/** Prefixo nos `name` para nunca colidir com os campos base (nome, email, o honeypot "empresa"). */
export const PREFIXO_CAMPO = "d_";

/**
 * Lê as respostas dos campos do ramo (os que têm o prefixo) dentro de um
 * elemento. Rádios e caixas só contam marcados; várias escolhas juntam-se
 * por ", ". Campos desativados ficam de fora, como no envio.
 */
export function lerValores(raiz: ParentNode): Valores {
  const valores: Valores = {};
  raiz.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("[name]").forEach((el) => {
    if (!el.name.startsWith(PREFIXO_CAMPO) || el.disabled) return;
    const nome = el.name.slice(PREFIXO_CAMPO.length);
    if (el instanceof HTMLInputElement && (el.type === "radio" || el.type === "checkbox")) {
      if (!el.checked) return;
      valores[nome] = valores[nome] ? `${valores[nome]}, ${el.value}` : el.value;
      return;
    }
    valores[nome] = el.value;
  });
  return valores;
}
