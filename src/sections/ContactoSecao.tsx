import Container from "../components/layout/Container";
import Section from "../components/layout/Section";
import FlowLines from "../components/ui/FlowLines";
import PorConfirmar from "../components/ui/PorConfirmar";
import ContactoForm from "./ContactoForm";
import { SEGUROS_FORMULARIO } from "../data/seguros";
import { FORMULARIOS } from "../data/formularios";
import LineIcon from "../components/ui/LineIcon";
import type { Seguro } from "../data/seguros";

const PROMESSAS = [
  "Sem compromisso",
  "Propostas de várias seguradoras",
  "Os seus dados servem só para responder ao pedido",
];

/**
 * Formulário de contacto no fim da página. Com `seguro`, usa o
 * formulário próprio desse ramo (título, texto e campos em
 * src/data/formularios.ts); sem ele, o genérico com a escolha do ramo.
 */
export default function ContactoSecao({
  titulo = "Fale connosco sobre o seu seguro.",
  seguro,
}: {
  titulo?: string;
  seguro?: Seguro;
}) {
  const formulario = seguro ? FORMULARIOS[seguro.key] : undefined;
  return (
    <Section id="contacto" surface className="section-decor">
      <FlowLines
        viewBox="0 0 1440 520"
        paths={[
          "M -60,14 C 300,34 540,0 820,18 S 1240,36 1500,12",
          "M -60,512 C 320,494 560,522 840,506 S 1260,490 1500,508",
        ]}
      />
      <Container>
        <div className="grid" style={{ gap: "var(--space-xl)", alignItems: "start" }}>
          <div style={{ gridColumn: "span 5" }}>
            <h2>{formulario?.titulo ?? titulo}</h2>
            <p className="text-secondary" style={{ marginTop: "var(--space-sm)" }}>
              {formulario?.texto ??
                "Deixe os seus dados e um mediador da BV fala consigo para perceber o que precisa."}
            </p>
            <ul className="contact-promises" role="list">
              {PROMESSAS.map((p) => (
                <li key={p}>
                  <LineIcon nome="check" size={20} />
                  {p}
                </li>
              ))}
            </ul>
            <p className="text-caption" style={{ marginTop: "var(--space-lg)" }}>
              Mediação de seguros:{" "}
              <PorConfirmar>[nº de registo na ASF por confirmar]</PorConfirmar>
            </p>
          </div>

          <div style={{ gridColumn: "span 7" }}>
            <ContactoForm
              key={seguro?.key ?? "geral"}
              ramos={SEGUROS_FORMULARIO}
              ramoFixo={seguro && formulario ? { valor: seguro.ramoCrm, formulario } : undefined}
            />
          </div>
        </div>
      </Container>
    </Section>
  );
}
