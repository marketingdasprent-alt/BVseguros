import { useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import Link from "../../app/Link";
import LineIcon from "../ui/LineIcon";
import type { PrimaryNavItem } from "../../data/navigation";

/**
 * Entrada do menu principal com mega-menu (desktop). O link continua a
 * navegar para a página do item; o botão ao lado abre o painel, para
 * teclado e toque. Com rato, abre também ao passar por cima.
 */
export default function MegaMenu({
  item,
  aberto,
  atual,
  onToggle,
}: {
  item: PrimaryNavItem & { submenu: NonNullable<PrimaryNavItem["submenu"]> };
  aberto: boolean;
  atual: boolean;
  onToggle: (aberto: boolean) => void;
}) {
  const raiz = useRef<HTMLDivElement>(null);
  const botao = useRef<HTMLButtonElement>(null);
  const fecharDepois = useRef<number | undefined>(undefined);
  const painelId = `mega-${item.href.replace(/\W/g, "")}`;

  useEffect(() => {
    if (!aberto) return;
    function onPointerDown(event: PointerEvent) {
      if (!raiz.current?.contains(event.target as Node)) onToggle(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      onToggle(false);
      botao.current?.focus();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [aberto, onToggle]);

  useEffect(() => () => window.clearTimeout(fecharDepois.current), []);

  // Pequeno atraso ao sair, para o rato poder atravessar a folga até ao painel.
  const abrirHover = (event: ReactPointerEvent) => {
    if (event.pointerType !== "mouse") return;
    window.clearTimeout(fecharDepois.current);
    onToggle(true);
  };
  const fecharHover = (event: ReactPointerEvent) => {
    if (event.pointerType !== "mouse") return;
    fecharDepois.current = window.setTimeout(() => onToggle(false), 150);
  };

  return (
    <div
      ref={raiz}
      className="mega"
      onPointerEnter={abrirHover}
      onPointerLeave={fecharHover}
      onBlur={(event) => {
        if (!raiz.current?.contains(event.relatedTarget as Node | null)) onToggle(false);
      }}
    >
      <div className="mega__trigger">
        <Link href={item.href} className="header__link" aria-current={atual ? "page" : undefined}>
          {item.label}
        </Link>
        <button
          ref={botao}
          type="button"
          className="mega__toggle"
          aria-expanded={aberto}
          aria-controls={painelId}
          aria-label={`${aberto ? "Fechar" : "Abrir"} submenu ${item.label}`}
          onClick={() => onToggle(!aberto)}
        >
          <LineIcon nome="chevron" size={16} />
        </button>
      </div>

      <div id={painelId} className="mega__panel" hidden={!aberto}>
        <div className="mega__inner">
          {item.submenu.map((grupo) => (
            <div key={grupo.heading} className="mega__group">
              <p className="mega__heading">{grupo.heading}</p>
              <ul className="mega__list" role="list">
                {grupo.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="mega__link">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="mega__aside">
            <p className="mega__aside-title">Não sabe qual precisa?</p>
            <p className="text-body-small text-secondary">
              Conte-nos o seu caso e comparamos as opções por si.
            </p>
            <Link href={item.href} className="mega__cta">
              Ver todos os seguros <LineIcon nome="seta" size={16} />
            </Link>
            <Link href="/sinistros" className="mega__cta">
              Participar sinistro <LineIcon nome="seta" size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
