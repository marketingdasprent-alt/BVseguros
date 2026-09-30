/**
 * Navigation data consumed by Header and Footer. Centralized so a
 * project can redefine its nav in one place instead of two.
 */

import { hrefSeguro, SEGMENTOS, segurosDoSegmento } from "./seguros";

export type NavigationLink = { label: string; href: string };
export type NavigationGroup = { heading: string; links: NavigationLink[] };
/** `submenu` abre o mega-menu no desktop e um acordeão no menu móvel. */
export type PrimaryNavItem = NavigationLink & { submenu?: NavigationGroup[] };
export type LegalLink =
  | (NavigationLink & { action?: never })
  | { label: string; action: "cookie-preferences"; href?: never };

const gruposSeguros: NavigationGroup[] = SEGMENTOS.map((segmento) => ({
  heading: segmento.nome,
  links: segurosDoSegmento(segmento.valor).map((s) => ({ label: s.nome, href: hrefSeguro(s) })),
}));

export const primaryNav: PrimaryNavItem[] = [
  { label: "Início", href: "/" },
  { label: "Seguros", href: "/seguros", submenu: gruposSeguros },
];

export const footerNav: Record<string, NavigationGroup> = {
  particulares: { heading: "Particulares", links: gruposSeguros[0].links },
  empresas: { heading: "Empresas", links: gruposSeguros[1].links },
  apoio: {
    heading: "Apoio",
    links: [
      { label: "Participar sinistro", href: "/sinistros" },
      { label: "Perguntas frequentes", href: "/#apoio" },
      { label: "Contacto", href: "/#contacto" },
    ],
  },
  empresa: {
    heading: "Empresa",
    links: [
      { label: "Sobre a BV Seguros", href: "/#sobre" },
      { label: "Porquê a BV", href: "/#porque" },
    ],
  },
};

/**
 * `action` is an alternative to `href` for entries that trigger
 * in-page behavior instead of navigating (see Footer.tsx and
 * DECISIONS.md for the CookieConsent trigger pattern).
 */
export const legalNav: LegalLink[] = [
  { label: "Privacidade", href: "/privacy" },
  { label: "Termos", href: "/terms" },
  { label: "Cookies", action: "cookie-preferences" },
];

/**
 * No confirmed social presence for BV Seguros yet. An empty array
 * degrades gracefully in Footer rather than linking to "#" (see
 * docs/anti-ai.md#content-integrity). Fill in when real profiles exist.
 */
export const socialLinks: { label: string; href: string }[] = [];
