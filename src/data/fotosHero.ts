import { SEGUROS } from "./seguros";
import type { RamoKey, Seguro } from "./seguros";

export type SlideHero = {
  /** Caminho sem tamanho nem extensão: "/images/hero/auto-1". */
  foto: string;
  /** Legenda com ação (Home e Seguros): o seguro em destaque nesse banner. */
  legenda?: { titulo: string; acao: string; href?: string; onClick?: () => void };
};

/**
 * Fotografias de fundo dos heros: 4 por ramo e 4 para Sinistros, em
 * public/images/hero/<chave>-<n>-<960|1920>.webp. Stock do Pexels (licença
 * livre para uso comercial), não são fotos da BV Seguros. Nenhuma pode mostrar
 * matrículas legíveis (pedido do cliente, 01/10). IDs no Pexels, pela
 * ordem: auto 5021950 32299100 2705755 6234138 · habitacao 186077 323781
 * 8054853 39191159 · saude 7579831 5593720 39192384 7579823 · vida 27177631
 * 27176613 4173135 18379520 · trabalho 3680959 8961034 4956920 8961552 ·
 * outros 8475172 8475169 3906984 7679721 · sinistros 8441780 7735625 4173090
 * 7144235.
 */
export type ChaveFotosHero = RamoKey | "sinistros";

const POR_CHAVE = 4;

export function fotosHero(chave: ChaveFotosHero): string[] {
  return Array.from({ length: POR_CHAVE }, (_, i) => `/images/hero/${chave}-${i + 1}`);
}

/** As 4 fotos de uma página (um ramo ou Sinistros), sem legenda. */
export function slidesDe(chave: ChaveFotosHero): SlideHero[] {
  return fotosHero(chave).map((foto) => ({ foto }));
}

/**
 * Um banner por seguro (Home e Seguros): cada volta mostra os 6 ramos e a
 * volta seguinte usa outra foto de cada um, até passar pelas 24.
 */
export function slidesPorSeguro(legenda: (s: Seguro) => NonNullable<SlideHero["legenda"]>): SlideHero[] {
  return Array.from({ length: POR_CHAVE }, (_, volta) =>
    SEGUROS.map((s) => ({ foto: fotosHero(s.key)[volta], legenda: legenda(s) }))
  ).flat();
}

export const SEGUROS_POR_VOLTA = SEGUROS.length;
