import Container from "../components/layout/Container";
import Section from "../components/layout/Section";
import HeroFotos from "../components/layout/HeroFotos";
import FlowLines from "../components/ui/FlowLines";
import Breadcrumb from "../components/navigation/Breadcrumb";
import ApoioSecao from "../sections/ApoioSecao";
import ContactoSecao from "../sections/ContactoSecao";
import SegurosGrid from "../sections/SegurosGrid";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { SEGUROS_POR_VOLTA, slidesPorSeguro } from "../data/fotosHero";
import { hrefSeguro } from "../data/seguros";

const SLIDES = slidesPorSeguro((s) => ({ acao: "Ver seguro", titulo: s.nome, href: hrefSeguro(s) }));

/** Hub dos ramos: a entrada do menu "Seguros" e ponto de partida para cada página de ramo. */
export default function Seguros() {
  useDocumentTitle(
    "Seguros | BV Seguros",
    "Seguros automóvel, vida, saúde, habitação, acidentes de trabalho e outros, para particulares e empresas. Comparamos propostas de várias seguradoras."
  );

  return (
    <>
      <HeroFotos
        slides={SLIDES}
        pontos={SEGUROS_POR_VOLTA}
        topo={<Breadcrumb itens={[{ label: "Início", href: "/" }, { label: "Seguros" }]} />}
        titulo="Seguros para particulares e empresas."
        lede="Escolha o ramo para ver as coberturas mais comuns e as perguntas que nos fazem com mais frequência. Em todos, comparamos propostas de várias seguradoras antes de recomendar uma."
      />

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
