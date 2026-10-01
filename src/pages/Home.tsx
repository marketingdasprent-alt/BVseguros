import Container from "../components/layout/Container";
import CardGrid from "../components/layout/CardGrid";
import Section from "../components/layout/Section";
import Button from "../components/ui/Button";
import Link from "../app/Link";
import { abrirProposta } from "../app/proposta";
import PorConfirmar from "../components/ui/PorConfirmar";
import FlowLines from "../components/ui/FlowLines";
import ApoioSecao from "../sections/ApoioSecao";
import ContactoPainel from "../sections/ContactoPainel";
import PedirPropostaPara from "../sections/PedirPropostaPara";
import SeguradorasFaixa from "../sections/SeguradorasFaixa";
import SegurosGrid from "../sections/SegurosGrid";
import { PASSOS } from "../data/seguros";
import { SEGUROS_POR_VOLTA, slidesPorSeguro } from "../data/fotosHero";
import useHeroFotos from "../hooks/useHeroFotos";

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
  onClick: () => abrirProposta(s.key),
}));

export default function Home() {
  const heroFotos = useHeroFotos(SLIDES, SEGUROS_POR_VOLTA);
  return (
    <>
      <Section className="hero-dark hero-fotos" variant="compact">
        {heroFotos.fundo}
        <Container>
          <div className="grid hero-fotos__grelha">
            <div style={{ gridColumn: "span 7" }}>
              <h1>
                <strong className="hero-titulo__destaque">Proteção a sério,</strong> de corretora independente.
              </h1>
              <p
                className="text-body-large text-secondary"
                style={{ marginTop: "var(--space-sm)" }}
              >
                Ajudamos famílias e empresas a escolher o seguro certo, sem
                letras miúdas por explicar e com alguém do outro lado quando
                precisar de usar a apólice.
              </p>
              <div className="cluster" style={{ marginTop: "var(--space-lg)" }}>
                <Button onClick={() => abrirProposta()}>
                  Pedir uma proposta
                </Button>
                <Button as={Link} href="/seguros" variant="secondary">
                  Ver seguros disponíveis
                </Button>
              </div>
              <p className="hero-garantia">
                <ShieldCheckIcon />
                <span>Aconselhamento independente</span>
                <span aria-hidden="true" className="hero-garantia__separador" />
                <span>Sem compromisso</span>
              </p>
            </div>
            <div className="hero-fotos__lado">{heroFotos.controlos}</div>
          </div>
          <PedirPropostaPara />
        </Container>
      </Section>


      <Section id="porque" className="section-decor">
        <FlowLines
          viewBox="0 0 1440 520"
          paths={[
            "M -60,120 C 260,10 420,280 760,160 S 1180,20 1500,200",
            "M -60,420 C 300,300 520,480 820,360 S 1220,220 1500,380",
          ]}
        />
        <Container>
          <div className="section-intro section-intro--wide">
            <h2>Três coisas que fazemos sempre.</h2>
          </div>
          <CardGrid style={{ marginTop: "var(--space-xl)" }}>
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
        <FlowLines
          viewBox="0 0 1440 360"
          paths={[
            "M -60,80 C 240,220 480,10 760,140 S 1200,260 1500,120",
            "M -60,300 C 260,180 520,340 800,240 S 1220,120 1500,260",
          ]}
        />
        <Container>
          <div className="grid" style={{ gap: "var(--space-xl)", alignItems: "center" }}>
            <div style={{ gridColumn: "span 6" }}>
              <h2>Corretora independente, ao lado do cliente.</h2>
            </div>
            <div style={{ gridColumn: "span 6" }}>
              <p className="text-secondary">
                A BV Seguros trabalha com várias seguradoras para encontrar a
                apólice que faz sentido para si, não a que rende mais
                comissão. Acompanhamos o cliente do primeiro orçamento à
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
        <FlowLines
          viewBox="0 0 1440 600"
          paths={[
            "M -60,140 C 300,40 560,260 860,150 S 1240,20 1500,180",
            "M -60,480 C 320,380 580,560 880,440 S 1260,300 1500,460",
          ]}
        />
        <Container>
          <div className="section-intro section-intro--wide">
            <h2>Um seguro para cada fase da vida.</h2>
          </div>
          <div style={{ marginTop: "var(--space-xl)" }}>
            <SegurosGrid />
          </div>
        </Container>
      </Section>

      <Section variant="compact" className="section-decor">
        <FlowLines
          viewBox="0 0 1440 360"
          paths={[
            "M -60,60 C 260,180 500,-20 780,120 S 1220,240 1500,90",
            "M -60,320 C 300,220 540,360 820,260 S 1240,140 1500,280",
          ]}
        />
        <Container>
          <div className="como-funciona-box">
            <div style={{ maxWidth: "var(--measure-intro-wide)" }}>
              <h2>Três passos, sem burocracia.</h2>
            </div>
            <CardGrid style={{ marginTop: "var(--space-xl)" }}>
              {PASSOS.map((passo, i) => (
                <div key={passo.titulo} className="steps-list__item">
                  <span
                    className="text-display"
                    style={{ color: "var(--color-accent)", fontSize: "var(--font-size-h1)" }}
                  >
                    {i + 1}
                  </span>
                  <h3 style={{ marginTop: "var(--space-2xs)" }}>{passo.titulo}</h3>
                  <p className="text-secondary">{passo.descricao}</p>
                </div>
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
