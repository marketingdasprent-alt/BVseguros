/**
 * Navigation data consumed by Header and Footer. Centralized so a
 * project can redefine its nav in one place instead of two.
 */

export type NavigationLink = { label: string; href: string };
export type LegalLink =
  | (NavigationLink & { action?: never })
  | { label: string; action: "cookie-preferences"; href?: never };

export const primaryNav: NavigationLink[] = [
  { label: "Sobre", href: "#sobre" },
  { label: "Seguros", href: "#servicos" },
  { label: "Porquê a BV", href: "#porque" },
];

export const footerNav = {
  seguros: {
    heading: "Seguros",
    links: [
      { label: "Automóvel", href: "#servicos" },
      { label: "Vida", href: "#servicos" },
      { label: "Saúde", href: "#servicos" },
      { label: "Multirriscos habitação", href: "#servicos" },
    ],
  },
  empresa: {
    heading: "Empresa",
    links: [
      { label: "Sobre a BV Seguros", href: "#sobre" },
      { label: "Porquê a BV", href: "#porque" },
      { label: "Contacto", href: "#contacto" },
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
