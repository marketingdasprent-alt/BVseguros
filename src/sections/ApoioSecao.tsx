import Container from "../components/layout/Container";
import CardGrid from "../components/layout/CardGrid";
import Section from "../components/layout/Section";
import FlowLines from "../components/ui/FlowLines";
import Accordion from "../components/ui/Accordion";
import LineIcon from "../components/ui/LineIcon";
import PorConfirmar from "../components/ui/PorConfirmar";
import { CANAIS, PERGUNTAS_GERAIS } from "../data/apoio";
import type { Pergunta } from "../data/apoio";

/** "Dúvidas? Nós ajudamos": FAQ + canais de contacto, no fim das páginas antes do formulário. */
export default function ApoioSecao({
  perguntas = PERGUNTAS_GERAIS,
  titulo = "Dúvidas? Nós ajudamos.",
  mostrarCanais = true,
}: {
  perguntas?: Pergunta[];
  titulo?: string;
  mostrarCanais?: boolean;
}) {
  return (
    <Section id="apoio" className="section-anchor section-decor">
      <FlowLines variante="lateraisAbertas" />
      <Container>
        <div className="section-intro">
          <h2>{titulo}</h2>
        </div>
        <div className="faq-wrap">
          <Accordion itens={perguntas} />
        </div>

        {mostrarCanais && (
          <>
            <h3 className="channels__title">
              Escolha como prefere falar connosco
            </h3>
            <CardGrid as="ul" className="channels" role="list" cols={4}>
              {CANAIS.map((c) => (
                <li key={c.titulo} className="channel-card">
                  <span className="channel-card__icon">
                    <LineIcon nome={c.icone} />
                  </span>
                  <p className="channel-card__title">{c.titulo}</p>
                  <p className="text-body-small text-secondary">
                    {c.descricao}
                  </p>
                  <p className="channel-card__value">
                    {c.confirmado ? (
                      c.href ? (
                        <a href={c.href}>{c.valor}</a>
                      ) : (
                        c.valor
                      )
                    ) : (
                      <PorConfirmar>{c.valor}</PorConfirmar>
                    )}
                  </p>
                </li>
              ))}
            </CardGrid>
          </>
        )}
      </Container>
    </Section>
  );
}
