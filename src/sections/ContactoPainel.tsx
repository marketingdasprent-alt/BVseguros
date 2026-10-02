import Container from "../components/layout/Container";
import Section from "../components/layout/Section";
import FlowLines from "../components/ui/FlowLines";
import Button from "../components/ui/Button";
import LineIcon from "../components/ui/LineIcon";
import MapaGoogle from "../components/ui/MapaGoogle";
import PorConfirmar from "../components/ui/PorConfirmar";
import Link from "../app/Link";
import { hrefProposta, hrefSinistro } from "../app/proposta";
import { CANAIS, MORADA_CONFIRMADA } from "../data/apoio";

/**
 * Contacto da Home, sem formulário (os formulários vivem nas páginas de
 * cada seguro). Composição da assinatura de email da BoomService:
 * fotografia cortada por uma faixa diagonal, contactos com ícones em
 * círculo ao lado. Mapa por baixo.
 */
export default function ContactoPainel() {
  return (
    <Section id="contacto" surface className="section-decor">
      <FlowLines variante="bordas" />
      <Container>
        <div className="signature-panel">
          <div className="signature-panel__media" aria-hidden="true">
            <img src="/images/porque-bv.jpg" alt="" loading="lazy" />
          </div>

          <div className="signature-panel__body">
            <h2 className="signature-panel__title">Fale com a BV Seguros.</h2>
            <p className="signature-panel__subtitle">
              <span>Corretora independente</span> <span>Particulares</span> <span>Empresas</span>
            </p>

            <ul className="signature-panel__contacts" role="list">
              {CANAIS.map((c) => (
                <li key={c.titulo}>
                  <span className="signature-panel__icon">
                    <LineIcon nome={c.icone} size={18} />
                  </span>
                  <span>
                    <span className="visually-hidden">{c.titulo}: </span>
                    {c.confirmado ? (
                      c.href ? <a href={c.href}>{c.valor}</a> : c.valor
                    ) : (
                      <PorConfirmar>{c.valor}</PorConfirmar>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            <div className="cluster mt-lg">
              <Button as={Link} href={hrefProposta()}>
                Pedir proposta
              </Button>
              <Button as={Link} href={hrefSinistro()} variant="secondary">
                Participar sinistro
              </Button>
            </div>
            <p className="text-caption text-muted mt-md">
              Mediação de seguros: <PorConfirmar>[nº de registo na ASF por confirmar]</PorConfirmar>
            </p>
          </div>
        </div>

        <div className="mt-xl">
          <MapaGoogle morada={MORADA_CONFIRMADA} />
        </div>
      </Container>
    </Section>
  );
}
