import Container from "../components/layout/Container";
import Section from "../components/layout/Section";
import FlowLines from "../components/ui/FlowLines";
import Breadcrumb from "../components/navigation/Breadcrumb";
import ApoioSecao from "../sections/ApoioSecao";
import ContactoSecao from "../sections/ContactoSecao";
import SegurosGrid from "../sections/SegurosGrid";
import useDocumentTitle from "../hooks/useDocumentTitle";

/** Hub dos ramos: a entrada do menu "Seguros" e ponto de partida para cada página de ramo. */
export default function Seguros() {
  useDocumentTitle(
    "Seguros | BV Seguros",
    "Seguros automóvel, vida, saúde, habitação, acidentes de trabalho e outros, para particulares e empresas. Comparamos propostas de várias seguradoras."
  );

  return (
    <>
      <Section className="hero-dark" variant="compact">
        <Container>
          <Breadcrumb itens={[{ label: "Início", href: "/" }, { label: "Seguros" }]} />
          <div style={{ maxWidth: "var(--measure-intro-wide)", marginTop: "var(--space-md)" }}>
            <h1>Seguros para particulares e empresas.</h1>
            <p className="text-body-large text-secondary" style={{ marginTop: "var(--space-sm)" }}>
              Escolha o ramo para ver as coberturas mais comuns e as perguntas
              que nos fazem com mais frequência. Em todos, comparamos
              propostas de várias seguradoras antes de recomendar uma.
            </p>
          </div>
        </Container>
      </Section>

      <Section className="section-decor">
        <FlowLines variante="lateraisAbertas" espelhado />
        <Container>
          <SegurosGrid headingLevel="h2" mostrarPublico />
        </Container>
      </Section>

      <ApoioSecao />

      <ContactoSecao titulo="Não sabe qual precisa? Fale connosco." />
    </>
  );
}
