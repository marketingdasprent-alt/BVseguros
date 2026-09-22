import { useEffect, useState } from "react";
import type { NavigationLink } from "../../data/navigation";
import Container from "../layout/Container";
import Button from "../ui/Button";
import Link from "../../app/Link";
import { usePathname } from "../../app/router";
import { primaryNav } from "../../data/navigation";
import useScrollState from "../../hooks/useScrollState";

/**
 * Header: sticky nav bar with a mobile menu. See
 * docs/design-system.md#header for the full contract (transparent
 * variant, CTA slot, keyboard behavior).
 */
export default function Header({ transparent = false, cta }: { transparent?: boolean; cta?: NavigationLink }) {
  const scrolled = useScrollState();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Reset the mobile menu when the route changes. Adjusted during
  // render (React's recommended pattern for this) rather than in an
  // effect, so it doesn't cost an extra commit.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const classes = [
    "header",
    scrolled ? "header--scrolled" : "",
    transparent ? "header--transparent" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={classes}>
      <Container>
        <div className="header__bar">
          <Link href="/" className="header__logo">
            <img src="/images/logo-icon-bv-seguros.png" alt="" className="header__logo-mark" />
            BV Seguros
          </Link>

          <nav className="header__nav" aria-label="Principal">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="header__link"
                aria-current={pathname === item.href ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="header__actions">
            {cta && (
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
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="header__link"
                aria-current={pathname === item.href ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </Container>
    </header>
  );
}
