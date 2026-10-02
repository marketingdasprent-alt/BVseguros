import Container from "../components/layout/Container";
import Section from "../components/layout/Section";
import Button from "../components/ui/Button";
import FlowLines from "../components/ui/FlowLines";
import LineIcon from "../components/ui/LineIcon";
import PorConfirmar from "../components/ui/PorConfirmar";
import Link from "../app/Link";
import { hrefProposta, hrefSinistro } from "../app/proposta";
import { FORMULARIOS } from "../data/formularios";
import type { Seguro } from "../data/seguros";

const PROMESSAS = [
  "Sem compromisso",
  "Propostas de várias seguradoras",
  "Os seus dados servem só para responder ao pedido",
];

const PROMESSAS_SINISTRO = [
  "Ajudamos a participar à seguradora",
  "Acompanhamos o processo consigo",
  "Os seus dados servem só para tratar o pedido",
];

/**
 * Fecho de página com o convite a pedir proposta. O formulário fica na
 * página do pedido (/pedir-proposta), para não quebrar a leitura desta. Com
 * `seguro`, leva ao formulário próprio desse ramo.
 */
export default function ContactoSecao({
  titulo = "Fale connosco sobre o seu seguro.",
  seguro,
  sinistro = false,
}: {
  titulo?: string;
  seguro?: Seguro;
  /** Fecho da página de sinistros: abre o pedido de sinistro em vez do de proposta. */
  sinistro?: boolean;
}) {
  const formulario = seguro ? FORMULARIOS[seguro.key] : undefined;
  return (
    <Section id="contacto" surface className="section-decor section-anchor">
      <FlowLines
        viewBox="0 0 1440 520"
        paths={[
          "M -60,14 C 300,34 540,0 820,18 S 1240,36 1500,12",
          "M -60,512 C 320,494 560,522 840,506 S 1260,490 1500,508",
        ]}
      />
      <Container>
        <div className="proposal-cta">
          <h2>{formulario?.titulo ?? titulo}</h2>
          <p className="text-secondary">
            {formulario?.texto ??
              (sinistro
                ? "Diga-nos o que aconteceu e com que seguro. Um mediador da BV contacta-o para tratar do processo."
                : "Deixe os seus dados e um mediador da BV fala consigo para perceber o que precisa.")}
          </p>
          <ul className="proposal-cta__promises" role="list">
            {(sinistro ? PROMESSAS_SINISTRO : PROMESSAS).map((p) => (
              <li key={p}>
                <LineIcon nome="check" size={18} />
                {p}
              </li>
            ))}
          </ul>
          {sinistro ? (
            <Button as={Link} href={hrefSinistro()}>
              Participar sinistro
            </Button>
          ) : (
            <Button as={Link} href={hrefProposta(seguro?.key ?? null)}>
              Pedir proposta
            </Button>
          )}
          <p className="text-caption text-muted">
            Mediação de seguros: <PorConfirmar>[nº de registo na ASF por confirmar]</PorConfirmar>
          </p>
        </div>
      </Container>
    </Section>
  );
}
