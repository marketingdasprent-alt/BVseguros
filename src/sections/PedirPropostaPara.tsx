import Link from "../app/Link";
import { abrirProposta } from "../app/proposta";
import LineIcon from "../components/ui/LineIcon";
import RamoIcon from "../components/ui/RamoIcon";
import { ACESSOS_RAPIDOS } from "../data/apoio";
import { SEGUROS } from "../data/seguros";

/**
 * "Vamos encontrar o seu seguro": cartão dentro do hero da Home, para estar
 * logo no primeiro ecrã. Cada ramo abre o pop-up com o formulário desse
 * ramo; por baixo, os atalhos para o resto do site.
 */
export default function PedirPropostaPara() {
  return (
    <div className="ramo-picker ramo-picker--hero">
      <h2 className="ramo-picker__title">Vamos encontrar o seu seguro</h2>
      <p className="ramo-picker__subtitle text-center">Escolha o tipo de seguro para pedir uma proposta.</p>
      <ul className="ramo-picker__list" role="list">
        {SEGUROS.map((s) => (
          <li key={s.key}>
            <button type="button" className="ramo-picker__option" onClick={() => abrirProposta(s.key)}>
              <span className="ramo-picker__icon">
                <RamoIcon tipo={s.key} />
              </span>
              {s.nome}
            </button>
          </li>
        ))}
      </ul>
      <nav aria-label="Atalhos" className="ramo-picker__shortcuts">
        {ACESSOS_RAPIDOS.map((a) => (
          <Link key={a.label} href={a.href} className="ramo-picker__shortcut">
            <LineIcon nome={a.icone} size={18} />
            {a.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
