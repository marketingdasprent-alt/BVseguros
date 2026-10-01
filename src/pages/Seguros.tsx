import Container from "../components/layout/Container";
import Section from "../components/layout/Section";
import FlowLines from "../components/ui/FlowLines";
import Breadcrumb from "../components/navigation/Breadcrumb";
import ApoioSecao from "../sections/ApoioSecao";
import ContactoSecao from "../sections/ContactoSecao";
import SegurosGrid from "../sections/SegurosGrid";
import useDocumentTitle from "../hooks/useDocumentTitle";
import useHeroFotos from "../hooks/useHeroFotos";
import { SEGUROS_POR_VOLTA, slidesPorSeguro } from "../data/fotosHero";
import { hrefSeguro } from "../data/seguros";

const SLIDES = slidesPorSeguro((s) => ({ acao: "Ver seguro", titulo: s.nome, href: hrefSeguro(s) }));

/** Hub dos ramos: a entrada do menu "Seguros" e ponto de partida para cada página de ramo. */
export default function Seguros() {
  useDocumentTitle(
    "Seguros | BV Seguros",
    "Seguros automóvel, vida, saúde, habitação, acidentes de trabalho e outros, para particulares e empresas. Comparamos propostas de várias seguradoras."
  );
  const heroFotos = useHeroFotos(SLIDES, SEGUROS_POR_VOLTA);

  return (
    <>
      <Section className="hero-dark hero-fotos" variant="compact">
        {heroFotos.fundo}
        <Container>
          <Breadcrumb itens={[{ label: "Início", href: "/" }, { label: "Seguros" }]} />
          <div className="grid hero-fotos__grelha" style={{ marginTop: "var(--space-md)" }}>
            <div style={{ gridColumn: "span 7" }}>
              <h1>Seguros para particulares e empresas.</h1>
              <p className="text-body-large text-secondary" style={{ marginTop: "var(--space-sm)" }}>
                Escolha o ramo para ver as coberturas mais comuns e as perguntas
                que nos fazem com mais frequência. Em todos, comparamos
                propostas de várias seguradoras antes de recomendar uma.
              </p>
            </div>
            <div className="hero-fotos__lado">{heroFotos.controlos}</div>
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
