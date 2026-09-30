import Container from "../components/layout/Container";
import Section from "../components/layout/Section";
import Link from "../app/Link";
import RamoIcon from "../components/ui/RamoIcon";
import { hrefSeguro, SEGUROS } from "../data/seguros";

/** "Quero pedir proposta para...": leva direto ao formulário da página do ramo, já com o ramo escolhido. */
export default function PedirPropostaPara() {
  return (
    <Section variant="compact">
      <Container>
        <div className="ramo-picker">
          <h2 className="ramo-picker__title">Quero pedir proposta para</h2>
          <ul className="ramo-picker__list" role="list">
            {SEGUROS.map((s) => (
              <li key={s.key}>
                <Link href={`${hrefSeguro(s)}#contacto`} className="ramo-picker__option">
                  <span className="ramo-picker__icon">
                    <RamoIcon tipo={s.key} />
                  </span>
                  {s.nome}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}
