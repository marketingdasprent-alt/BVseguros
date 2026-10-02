import Container from "../components/layout/Container";
import CardGrid from "../components/layout/CardGrid";
import Section from "../components/layout/Section";
import HeroFotos from "../components/layout/HeroFotos";
import Button from "../components/ui/Button";
import Link from "../app/Link";
import { hrefProposta } from "../app/proposta";
import PorConfirmar from "../components/ui/PorConfirmar";
import FlowLines from "../components/ui/FlowLines";
import ApoioSecao from "../sections/ApoioSecao";
import ContactoPainel from "../sections/ContactoPainel";
import PedirPropostaPara from "../sections/PedirPropostaPara";
import SeguradorasFaixa from "../sections/SeguradorasFaixa";
import SegurosGrid from "../sections/SegurosGrid";
import { PASSOS } from "../data/seguros";
import { SEGUROS_POR_VOLTA, slidesPorSeguro } from "../data/fotosHero";

const DIFERENCIAIS = [
  {
    titulo: "Comparamos por si",
    descricao: "Analisamos propostas de várias seguradoras antes de recomendar uma.",
  },
  {
    titulo: "Explicamos sem jargão",
    descricao: "Sabe exatamente o que está e o que não está coberto, antes de assinar.",
  },
  {
    titulo: "Ajudamos no sinistro",
    descricao: "Quando precisar de acionar o seguro, tratamos do acompanhamento consigo.",
  },
];

/** Escudo + check da linha "Aconselhamento independente · Sem compromisso" do hero. */
function ShieldCheckIcon() {
  return (
    <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true">
      <path
        d="M16 4c-3 2-6 2.5-9 2.8v8c0 6 3.6 10 9 12.2 5.4-2.2 9-6.2 9-12.2v-8c-3-.3-6-.8-9-2.8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M11.5 16.5l3 3 6-6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Marcador dos itens de "Porquê a BV": círculo cheio + check, cor accent. */
function CheckMark() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="20"
      height="20"
      style={{ flex: "none" }}
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="10" fill="var(--color-accent)" />
      <path
        d="M6 10.5l2.5 2.5 5.5-6"
        fill="none"
        stroke="var(--color-text-on-primary)"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const SLIDES = slidesPorSeguro((s) => ({
  acao: "Pedir proposta",
  titulo: s.nome,
  href: hrefProposta(s.key),
}));

export default function Home() {
  return (
    <>
      <HeroFotos
        slides={SLIDES}
        pontos={SEGUROS_POR_VOLTA}
        titulo={
          <>
            <strong className="hero-titulo__destaque">Proteção a sério,</strong> de corretora independente.
          </>
        }
        lede="Ajudamos famílias e empresas a escolher o seguro certo, sem letras miúdas por explicar e com alguém do outro lado quando precisar de usar a apólice."
        acoes={
          <>
            <Button as={Link} href={hrefProposta()}>
              Pedir proposta
            </Button>
            <Button as={Link} href="/seguros" variant="secondary">
              Ver todos os seguros
            </Button>
          </>
        }
        nota={
          <p className="hero-garantia">
            <ShieldCheckIcon />
            <span>Aconselhamento independente</span>
            <span aria-hidden="true" className="hero-garantia__separador" />
            <span>Sem compromisso</span>
          </p>
        }
      >
        <PedirPropostaPara />
      </HeroFotos>


      <Section id="porque" className="section-decor">
        <FlowLines variante="laterais" />
        <Container>
          <div className="section-intro section-intro--wide">
            <h2>Três coisas que fazemos sempre.</h2>
          </div>
          <CardGrid className="mt-xl">
            {DIFERENCIAIS.map((item, i) => (
              <div
                key={item.titulo}
                className={"spotlight-card" + (i === 1 ? " spotlight-card--dark" : "")}
              >
                <div className="spotlight-card__icon">
                  <CheckMark />
                </div>
                <h3>{item.titulo}</h3>
                <p className={i === 1 ? undefined : "text-secondary"}>{item.descricao}</p>
              </div>
            ))}
          </CardGrid>
        </Container>
      </Section>

      <Section id="sobre" variant="compact" className="section-decor">
        <FlowLines variante="lateraisAbertas" />
        <Container>
          <div className="grid" style={{ gap: "var(--space-xl)", alignItems: "center" }}>
            <div className="col-span-6">
              <h2>Corretora independente, ao lado do cliente.</h2>
            </div>
            <div className="col-span-6">
              <p className="text-secondary">
                A BV Seguros trabalha com várias seguradoras para encontrar a
                apólice que faz sentido para si, não a que rende mais
                comissão. Acompanhamos o cliente do primeiro pedido de proposta à
                participação de um sinistro.
              </p>
              <p>
                <PorConfirmar>
                  Por confirmar: ano de fundação, número de clientes/apólices
                  geridas, zona de atuação, e o que torna a BV Seguros
                  diferente de uma corretora genérica.
                </PorConfirmar>
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Section id="servicos" surface className="section-decor">
        <FlowLines variante="laterais" espelhado />
        <Container>
          <div className="section-intro section-intro--wide">
            <h2>Os seguros que tratamos.</h2>
          </div>
          <div className="mt-xl">
            <SegurosGrid />
          </div>
        </Container>
      </Section>

      <Section variant="compact" className="section-decor">
        <FlowLines variante="bordas" />
        <Container>
          <div className="como-funciona-box">
            <h2>Três passos, sem burocracia.</h2>
            <CardGrid as="ol" className="steps-list" role="list">
              {PASSOS.map((passo, i) => (
                <li key={passo.titulo} className="steps-list__item">
                  <span className="text-display steps-list__number">{i + 1}</span>
                  <h3>{passo.titulo}</h3>
                  <p className="text-secondary">{passo.descricao}</p>
                </li>
              ))}
            </CardGrid>
          </div>
        </Container>
      </Section>

      <SeguradorasFaixa />

      {/* Os canais já estão no painel de contacto logo a seguir. */}
      <ApoioSecao mostrarCanais={false} />

      <ContactoPainel />
    </>
  );
}
