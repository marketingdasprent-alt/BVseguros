import type { ReactNode } from "react";
import Container from "./Container";
import Section from "./Section";
import Link from "../../app/Link";

/**
 * Shared shell for legal pages (privacy, terms, cookies). See
 * docs/design-system.md#legallayout for the contract.
 *
 * Header/Footer already wrap every route in App.tsx, so this only
 * owns the page-local header (back link, title, last-updated date)
 * and hands prose styling to `.legal-prose` in components.css.
 */
export type LegalLayoutProps = {
  title: string;
  updatedAt: string;
  children: ReactNode;
};

export default function LegalLayout({ title, updatedAt, children }: LegalLayoutProps) {
  return (
    <Section>
      <Container variant="narrow">
        <header className="legal-header">
          <Link href="/" className="legal-header__back">
            <span aria-hidden="true">&larr;</span> Voltar
          </Link>
          <h1 className="legal-header__title">{title}</h1>
          <p className="legal-header__updated">Última atualização: {updatedAt}</p>
        </header>

        <article className="legal-prose">{children}</article>
      </Container>
    </Section>
  );
}
