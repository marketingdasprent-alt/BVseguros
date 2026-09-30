import { useEffect, useRef } from "react";
import Container from "../layout/Container";
import useSecaoAtiva from "../../hooks/useSecaoAtiva";

/**
 * Subnavegação fixa por âncoras. Marca a secção a ser lida e, quando a
 * barra faz scroll horizontal (mobile), traz o item ativo para a vista.
 */
export default function PageSubnav({ itens }: { itens: { id: string; label: string }[] }) {
  const ativa = useSecaoAtiva(itens.map((i) => i.id));
  const lista = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const barra = lista.current;
    const link = barra?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!barra || !link || barra.scrollWidth <= barra.clientWidth) return;
    barra.scrollTo({ left: link.offsetLeft - barra.clientWidth / 2 + link.offsetWidth / 2, behavior: "smooth" });
  }, [ativa]);

  return (
    <nav className="page-subnav" aria-label="Nesta página">
      <Container>
        <div className="page-subnav__list" ref={lista}>
          {itens.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="page-subnav__link"
              aria-current={ativa === item.id ? "true" : undefined}
            >
              {item.label}
            </a>
          ))}
        </div>
      </Container>
    </nav>
  );
}
