import { useEffect, useRef } from "react";
import Container from "./Container";
import Link from "../../app/Link";
import { footerNav, legalNav, socialLinks } from "../../data/navigation";
import { OPEN_PREFERENCES_EVENT } from "../../hooks/useCookieConsent";

/**
 * Footer: see docs/design-system.md#footer for the contract
 * (branding, nav columns, social, legal, copyright).
 *
 * Toggles `body.has-footer-visible` while it intersects the viewport, so
 * fixed bottom-of-screen elements (BackToTop) can avoid covering it
 * instead of overlapping its links. See DECISIONS.md.
 */
export default function Footer() {
  const year = new Date().getFullYear();
  const columns = Object.values(footerNav);
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = footerRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) =>
        document.body.classList.toggle("has-footer-visible", entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      document.body.classList.remove("has-footer-visible");
    };
  }, []);

  return (
    <footer className="footer" ref={footerRef}>
      <Container>
        <div className="footer__grid">
          <div className="footer__brand">
            <span className="footer__logo">BV Seguros</span>
            <p className="footer__description">
              Corretora de seguros independente. Comparamos propostas de
              várias seguradoras e acompanhamos o cliente do orçamento ao
              sinistro.
            </p>
            {socialLinks.length > 0 && (
              <div className="footer__social">
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="footer__social-link"
                    aria-label={link.label}
                  >
                    {link.label[0]}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="footer__columns">
            {columns.map((column) => (
              <div key={column.heading}>
                <p className="footer__heading">{column.heading}</p>
                <ul className="footer__list">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="footer__link">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="footer__bottom">
          <p>&copy; {year} BV Seguros. Todos os direitos reservados.</p>
          <div className="footer__legal">
            {legalNav.map((link) =>
              link.action === "cookie-preferences" ? (
                <button
                  key={link.label}
                  type="button"
                  className="footer__legal-link"
                  onClick={(event) =>
                    window.dispatchEvent(
                      new CustomEvent(OPEN_PREFERENCES_EVENT, {
                        detail: { trigger: event.currentTarget },
                      })
                    )
                  }
                >
                  {link.label}
                </button>
              ) : (
                <a key={link.label} href={link.href} className="footer__legal-link">
                  {link.label}
                </a>
              )
            )}
          </div>
        </div>
      </Container>
    </footer>
  );
}
