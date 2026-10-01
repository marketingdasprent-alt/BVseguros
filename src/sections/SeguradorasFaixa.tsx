import Container from "../components/layout/Container";
import Section from "../components/layout/Section";
import { SEGURADORAS } from "../data/seguradoras";
import type { RamoKey } from "../data/seguros";

/** Não renderiza nada enquanto a lista de seguradoras estiver por confirmar. */
export default function SeguradorasFaixa({ ramo }: { ramo?: RamoKey }) {
  const lista = ramo ? SEGURADORAS.filter((s) => s.ramos.includes(ramo)) : SEGURADORAS;
  if (lista.length === 0) return null;
  return (
    <Section variant="compact">
      <Container>
        <p className="text-label text-muted text-center">
          Seguradoras com quem trabalhamos
        </p>
        <ul className="insurer-strip" role="list">
          {lista.map((s) => (
            <li key={s.nome} className="insurer-strip__item">
              {s.nome}
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
