import Link from "../app/Link";
import LineIcon from "../components/ui/LineIcon";
import { ACESSOS_RAPIDOS } from "../data/apoio";

/** Faixa de atalhos por baixo do hero, como nos sites das seguradoras. */
export default function AcessosRapidos() {
  return (
    <nav aria-label="Acessos rápidos" className="quick-actions">
      <ul className="quick-actions__list" role="list">
        {ACESSOS_RAPIDOS.map((a) => (
          <li key={a.label}>
            <Link href={a.href} className="quick-actions__item">
              <span className="quick-actions__icon">
                <LineIcon nome={a.icone} />
              </span>
              <span>
                <span className="quick-actions__label">{a.label}</span>
                <span className="quick-actions__sub">{a.descricao}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
