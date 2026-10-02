import { useEffect, useRef, useState } from "react";
import type { NavigationLink } from "../../data/navigation";
import Container from "../layout/Container";
import Button from "../ui/Button";
import Link from "../../app/Link";
import MegaMenu from "./MegaMenu";
import { usePathname } from "../../app/router";
import { primaryNav } from "../../data/navigation";
import useScrollState from "../../hooks/useScrollState";

/**
 * Header: sticky nav bar with a mobile menu. See
 * docs/design-system.md#header for the full contract (transparent
 * variant, CTA slot, keyboard behavior).
 */
/** CTA do header: um link (ex.: o pedido de proposta), ou uma ação. */
export type HeaderCta = NavigationLink | { label: string; onClick: () => void };

export default function Header({ transparent = false, cta }: { transparent?: boolean; cta?: HeaderCta }) {
  const scrolled = useScrollState();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [submenuAberto, setSubmenuAberto] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // A altura muda com a largura do ecrã (logótipo em tamanho fluido) e com
  // o menu móvel aberto: publicada em --header-offset para a subnavegação
  // e o scroll-margin das âncoras encostarem sempre ao header.
  useEffect(() => {
    const header = headerRef.current;
    if (!header || typeof ResizeObserver === "undefined") return;
    const publicar = () =>
      document.documentElement.style.setProperty("--header-offset", `${header.offsetHeight}px`);
    const observer = new ResizeObserver(publicar);
    observer.observe(header);
    publicar();
    return () => observer.disconnect();
  }, []);

  // Reset the mobile menu when the route changes. Adjusted during
  // render (React's recommended pattern for this) rather than in an
  // effect, so it doesn't cost an extra commit.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMenuOpen(false);
    setSubmenuAberto(false);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // "Seguros" continua marcado dentro de /seguros/<ramo>.
  const isAtual = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  const classes = [
    "header",
    scrolled ? "header--scrolled" : "",
    transparent ? "header--transparent" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={classes} ref={headerRef}>
      <Container>
        <div className="header__bar">
          <Link href="/" className="header__logo">
            <img src="/images/logo-icon-bv-seguros.png" alt="" className="header__logo-mark" />
            BV Seguros
          </Link>

          <nav className="header__nav" aria-label="Principal">
            {primaryNav.map((item) =>
              item.submenu ? (
                <MegaMenu
                  key={item.href}
                  item={{ ...item, submenu: item.submenu }}
                  aberto={submenuAberto}
                  atual={isAtual(item.href)}
                  onToggle={setSubmenuAberto}
                />
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="header__link"
                  aria-current={isAtual(item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>

          <div className="header__actions">
            {cta && "onClick" in cta && (
              <Button size="sm" onClick={cta.onClick}>
                {cta.label}
              </Button>
            )}
            {cta && "href" in cta && (
              <Button as={Link} href={cta.href} size="sm">
                {cta.label}
              </Button>
            )}
            <button
              type="button"
              className="header__toggle"
              aria-expanded={menuOpen}
              aria-controls="header-mobile-panel"
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span aria-hidden="true">{menuOpen ? "✕" : "☰"}</span>
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav
            id="header-mobile-panel"
            className="header__mobile-panel"
            aria-label="Menu móvel"
          >
            {primaryNav.map((item) =>
              item.submenu ? (
                <details key={item.href} className="header__mobile-group" open={isAtual(item.href)}>
                  <summary className="header__link header__mobile-summary">{item.label}</summary>
                  <Link href={item.href} className="header__mobile-sublink header__mobile-sublink--all">
                    Ver todos os {item.label.toLowerCase()}
                  </Link>
                  {item.submenu.map((grupo) => (
                    <div key={grupo.heading}>
                      <p className="header__mobile-heading">{grupo.heading}</p>
                      {grupo.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="header__mobile-sublink"
                          aria-current={pathname === link.href ? "page" : undefined}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </details>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="header__link"
                  aria-current={isAtual(item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              )
            )}
            <Link href="/sinistros" className="header__link">
              Participar sinistro
            </Link>
          </nav>
        )}
      </Container>
    </header>
  );
}
