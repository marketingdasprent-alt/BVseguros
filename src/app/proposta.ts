import { navigate } from "./router";
import { SEGUROS } from "../data/seguros";
import type { RamoKey, Seguro } from "../data/seguros";

/**
 * Os pedidos (proposta e sinistro) são páginas inteiras, como o simulador da
 * Fidelidade, não um pop-up (João e Thiago, 01/10/2026): /pedir-proposta e
 * /participar-sinistro, com o ramo no caminho (/pedir-proposta/automovel).
 * O nível de proteção escolhido numa página de ramo segue em ?nivel=.
 */
export type ModoPedido = "proposta" | "sinistro";

export const CAMINHO_PEDIDO: Record<ModoPedido, string> = {
  proposta: "/pedir-proposta",
  sinistro: "/participar-sinistro",
};

const slugDe = (ramo: RamoKey | null | undefined) => (ramo ? SEGUROS.find((s) => s.key === ramo)?.slug : undefined);

/** Sem ramo: o pedido genérico, que começa pela escolha do seguro. */
export function hrefProposta(ramo: RamoKey | null = null, nivel?: string): string {
  const slug = slugDe(ramo);
  const base = slug ? `${CAMINHO_PEDIDO.proposta}/${slug}` : CAMINHO_PEDIDO.proposta;
  return nivel ? `${base}?nivel=${encodeURIComponent(nivel)}` : base;
}

/** Com ramo, o tipo de seguro já vem escolhido. */
export function hrefSinistro(ramo: RamoKey | null = null): string {
  const slug = slugDe(ramo);
  return slug ? `${CAMINHO_PEDIDO.sinistro}/${slug}` : CAMINHO_PEDIDO.sinistro;
}

/** Para botões que fazem outra coisa antes (ex.: marcar o nível escolhido). */
export function abrirProposta(ramo: RamoKey | null = null, nivel?: string) {
  navigate(hrefProposta(ramo, nivel));
}

export function abrirSinistro(ramo: RamoKey | null = null) {
  navigate(hrefSinistro(ramo));
}

/** Que pedido mostra um caminho: null se não for uma página de pedido (ou o ramo não existir). */
export function pedidoPorCaminho(pathname: string): { modo: ModoPedido; seguro?: Seguro } | null {
  const limpo = pathname.replace(/(.)\/+$/, "$1");
  for (const modo of ["proposta", "sinistro"] as const) {
    const base = CAMINHO_PEDIDO[modo];
    if (limpo === base) return { modo };
    if (limpo.startsWith(`${base}/`)) {
      const seguro = SEGUROS.find((s) => s.slug === limpo.slice(base.length + 1));
      return seguro ? { modo, seguro } : null;
    }
  }
  return null;
}
