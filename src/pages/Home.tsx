import type { ReactNode } from "react";
import Container from "../components/layout/Container";
import Section from "../components/layout/Section";
import Button from "../components/ui/Button";
import Input from "../components/forms/Input";

type RamoKey = "auto" | "vida" | "saude" | "habitacao" | "trabalho" | "outros";

/**
 * Fotografias de stock (Pexels, licença livre para uso comercial, sem
 * ligação real à BV Seguros): placeholders visuais, ver docs/anti-ai.md
 * #content-integrity. Não confundir com fotografia própria da empresa.
 */
const RAMOS: { key: RamoKey; nome: string; descricao: string; imagem: string }[] = [
  {
    key: "auto",
    nome: "Automóvel",
    descricao: "Responsabilidade civil, danos próprios e assistência em viagem.",
    imagem: "/images/ramos/auto.jpg",
  },
  {
    key: "vida",
    nome: "Vida",
    descricao: "Proteção financeira para quem depende de si, ajustada à sua fase de vida.",
    imagem: "/images/ramos/vida.jpg",
  },
  {
    key: "saude",
    nome: "Saúde",
    descricao: "Acesso a rede de cuidados privados, com e sem internamento.",
    imagem: "/images/ramos/saude.jpg",
  },
  {
    key: "habitacao",
    nome: "Multirriscos habitação",
    descricao: "Casa própria ou arrendada, conteúdo e responsabilidade civil incluídos.",
    imagem: "/images/ramos/habitacao.jpg",
  },
  {
    key: "trabalho",
    nome: "Acidentes de trabalho",
    descricao: "Obrigatório para quem tem trabalhadores a cargo. Tratamos do processo todo.",
    imagem: "/images/ramos/trabalho.jpg",
  },
  {
    key: "outros",
    nome: "Outros seguros",
    descricao: "Responsabilidade civil, viagem e situações à medida. Fale connosco.",
    imagem: "/images/ramos/outros.jpg",
  },
];

const DIFERENCIAIS = [
  {
    titulo: "Comparamos por si",
    descricao: "Analisamos propostas de várias seguradoras antes de recomendar uma.",
  },
  {
    titulo: "Explicamos sem jargão",
    descricao: "Sabe exatamente o que está e o que não está coberto, antes de assinar.",
  },
  {
    titulo: "Ajudamos no sinistro",
    descricao: "Quando precisar de acionar o seguro, tratamos do acompanhamento consigo.",
  },
];

const PASSOS = [
  {
    titulo: "Conta-nos o que precisa",
    descricao: "Preenche o formulário ou liga-nos. Sem compromisso, sem letras miúdas.",
  },
  {
    titulo: "Comparamos por si",
    descricao: "Analisamos propostas de várias seguradoras para o seu caso concreto.",
  },
  {
    titulo: "Escolhe com confiança",
    descricao: "Explicamos as opções em português simples. Você decide, nós tratamos do resto.",
  },
];

/** Marca visível de conteúdo por confirmar, nunca disfarçada de facto real. */
function PorConfirmar({ children }: { children: ReactNode }) {
  return <span className="placeholder-note">{children}</span>;
}

/**
 * Ícones de traço mínimo (24x24, stroke="currentColor"), um por ramo.
 * Reutilizados nos cartões de "O que cobrimos": herdam a cor via CSS,
 * sem depender de nenhuma biblioteca de ícones.
 */
function RamoIcon({ tipo }: { tipo: RamoKey }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (tipo) {
    case "auto":
      return (
        <svg {...common}>
          <path d="M4 16V12l2-5h12l2 5v4" />
          <path d="M3 16h18v3a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1v-1H6.5v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3Z" />
          <circle cx="7.5" cy="16" r="1.5" />
          <circle cx="16.5" cy="16" r="1.5" />
        </svg>
      );
    case "vida":
      return (
        <svg {...common}>
          <path d="M12 20s-7-4.35-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 5c-2.5 4.65-9.5 9-9.5 9Z" />
        </svg>
      );
    case "saude":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      );
    case "habitacao":
      return (
        <svg {...common}>
          <path d="M4 11 12 4l8 7" />
          <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
          <path d="M10 20v-5h4v5" />
        </svg>
      );
    case "trabalho":
      return (
        <svg {...common}>
          <path d="M4 13a8 8 0 0 1 16 0" />
          <path d="M3 13h18v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2Z" />
          <path d="M9 13V9a3 3 0 0 1 6 0v4" />
        </svg>
      );
    case "outros":
      return (
        <svg {...common}>
          <path d="M4 12a8 8 0 0 1 16 0Z" />
          <path d="M12 12v7a1.5 1.5 0 0 1-3 0" />
          <path d="M12 4v2" />
        </svg>
      );
  }
}

/** Ícone pequeno (escudo + check) para o cartão flutuante do Hero, cor accent. */
function ShieldCheckIcon() {
  return (
    <svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
      <path
        d="M16 4c-3 2-6 2.5-9 2.8v8c0 6 3.6 10 9 12.2 5.4-2.2 9-6.2 9-12.2v-8c-3-.3-6-.8-9-2.8Z"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M11.5 16.5l3 3 6-6.5"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Ícones de contacto (telefone, email, localização): mesmo traço mínimo do RamoIcon. */
function ContactIcon({ tipo }: { tipo: "telefone" | "email" | "morada" }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (tipo === "telefone") {
    return (
      <svg {...common}>
        <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v3a2 2 0 0 1-2 2C10.5 20 4 13.5 4 6a2 2 0 0 1 1-2Z" />
      </svg>
    );
  }
  if (tipo === "email") {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.5" />
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

/**
 * Linhas azuis decorativas em SVG, a pedido direto do cliente (esboço
 * anotado por cima do site). Substituem as manchas circulares
 * anteriores. Decorativas só: aria-hidden, sem interação, sempre atrás
 * do conteúdo (section-decor dá z-index:1 ao Container). Cada secção
 * recebe o seu próprio par de curvas (viewBox e traçado próprios) em
 * vez de um preset repetido, para não ler como o mesmo carimbo cinco
 * vezes.
 */
function FlowLines({ paths, viewBox }: { paths: string[]; viewBox: string }) {
  return (
    <svg aria-hidden="true" className="section-lines" viewBox={viewBox} preserveAspectRatio="none">
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

export default function Home() {
  return (
    <>
      <Section className="hero-dark">
        <Container>
          <div className="grid" style={{ gap: "var(--space-xl)", alignItems: "center" }}>
            <div style={{ gridColumn: "span 7" }}>
              <p className="text-label">Seguros e Soluções</p>
              <h1>Proteção a sério, explicada em português simples.</h1>
              <p
                className="text-body-large text-secondary"
                style={{ marginTop: "var(--space-sm)", textAlign: "justify" }}
              >
                Ajudamos famílias e empresas a escolher o seguro certo, sem
                letras miúdas por explicar e com alguém do outro lado quando
                precisar de usar a apólice.
              </p>
              <div className="cluster" style={{ marginTop: "var(--space-lg)" }}>
                <Button as="a" href="#contacto">
                  Pedir uma proposta
                </Button>
                <Button as="a" href="#servicos" variant="secondary">
                  Ver seguros disponíveis
                </Button>
              </div>
            </div>
            <div style={{ gridColumn: "span 5", position: "relative" }}>
              <img
                src="/images/porque-bv.jpg"
                alt="Agente da BV Seguros em reunião com uma cliente"
                className="hero-photo"
              />
              <div className="hero-floating-card">
                <div className="hero-floating-card__icon">
                  <ShieldCheckIcon />
                </div>
                <div>
                  <p className="hero-floating-card__title">Aconselhamento independente</p>
                  <p className="hero-floating-card__sub">Sem compromisso</p>
                </div>
              </div>
            </div>
          </div>
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
          <div className="section-intro">
            <p className="text-label text-muted">Porquê a BV Seguros</p>
            <h2>Três coisas que fazemos sempre.</h2>
          </div>
          <div
            className="grid"
            style={{ gap: "var(--space-lg)", marginTop: "var(--space-xl)" }}
          >
            {DIFERENCIAIS.map((item, i) => (
              <div
                key={item.titulo}
                className={"spotlight-card" + (i === 1 ? " spotlight-card--dark" : "")}
                style={{ gridColumn: "span 4" }}
              >
                <div className="spotlight-card__icon">
                  <CheckMark />
                </div>
                <h3>{item.titulo}</h3>
                <p className={i === 1 ? undefined : "text-secondary"}>{item.descricao}</p>
              </div>
            ))}
          </div>
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
            <div style={{ gridColumn: "span 5" }}>
              <p className="text-label text-muted">Sobre a BV Seguros</p>
              <h2>Corretora independente, ao lado do cliente.</h2>
            </div>
            <div style={{ gridColumn: "span 7" }}>
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
            <p className="text-label text-muted">O que cobrimos</p>
            <h2>Um seguro para cada fase da vida.</h2>
          </div>
          <div className="grid" style={{ gap: "var(--space-lg)", marginTop: "var(--space-xl)" }}>
            {RAMOS.map((ramo) => (
              <article
                key={ramo.key}
                className="media-card media-card--interactive"
                style={{ gridColumn: "span 4" }}
              >
                <img
                  src={ramo.imagem}
                  alt=""
                  className="media-card__media"
                  loading="lazy"
                />
                <div className="media-card__body">
                  <div className="media-card__icon-chip">
                    <RamoIcon tipo={ramo.key} />
                  </div>
                  <h3>{ramo.nome}</h3>
                  <p className="text-secondary">{ramo.descricao}</p>
                </div>
              </article>
            ))}
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
              <p className="text-label text-muted">Como funciona</p>
              <h2>Três passos, sem burocracia.</h2>
            </div>
            <div
              className="grid"
              style={{ gap: "var(--space-lg)", marginTop: "var(--space-xl)" }}
            >
              {PASSOS.map((passo, i) => (
                <div
                  key={passo.titulo}
                  style={{
                    gridColumn: "span 4",
                    borderTop: "var(--border-width-thick) solid var(--color-primary)",
                    paddingTop: "var(--space-sm)",
                  }}
                >
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
            </div>
          </div>
        </Container>
      </Section>

      <Section id="contacto" surface className="section-decor">
        <FlowLines
          viewBox="0 0 1440 520"
          paths={[
            "M -60,100 C 300,220 540,20 820,150 S 1240,280 1500,110",
            "M -60,420 C 320,320 560,480 840,380 S 1260,240 1500,400",
          ]}
        />
        <Container>
          <div className="grid" style={{ gap: "var(--space-xl)", alignItems: "start" }}>
            <div style={{ gridColumn: "span 5" }}>
              <p className="text-label text-muted">Contacto</p>
              <h2>Fale connosco sobre o seu seguro.</h2>
              <div
                className="stack"
                style={{ marginTop: "var(--space-lg)", gap: "var(--space-sm)" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                  <div style={{ width: 20, height: 20, flex: "none", color: "var(--color-accent)" }}>
                    <ContactIcon tipo="telefone" />
                  </div>
                  <p className="text-secondary">
                    <PorConfirmar>[telefone por confirmar]</PorConfirmar>
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                  <div style={{ width: 20, height: 20, flex: "none", color: "var(--color-accent)" }}>
                    <ContactIcon tipo="email" />
                  </div>
                  <p className="text-secondary">
                    <a href="mailto:geral@bvseguros.pt">geral@bvseguros.pt</a>
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                  <div style={{ width: 20, height: 20, flex: "none", color: "var(--color-accent)" }}>
                    <ContactIcon tipo="morada" />
                  </div>
                  <p className="text-secondary">
                    <PorConfirmar>[morada por confirmar]</PorConfirmar>
                  </p>
                </div>
              </div>
              <p className="text-caption" style={{ marginTop: "var(--space-lg)" }}>
                Mediação de seguros:{" "}
                <PorConfirmar>[nº de registo na ASF por confirmar]</PorConfirmar>
              </p>
            </div>

            <div style={{ gridColumn: "span 7" }}>
              <form
                action="mailto:geral@bvseguros.pt"
                method="post"
                encType="text/plain"
                className="stack contact-form-card"
              >
                <Input label="Nome" name="nome" type="text" required />
                <Input label="Email" name="email" type="email" required />
                <Input label="Telefone" name="telefone" type="tel" />

                <div className="field">
                  <label className="field__label" htmlFor="ramo">
                    Em que seguro está interessado?
                  </label>
                  <select id="ramo" name="ramo" className="field__control">
                    {RAMOS.map((ramo) => (
                      <option key={ramo.key}>{ramo.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label className="field__label" htmlFor="mensagem">
                    Mensagem
                  </label>
                  <textarea
                    id="mensagem"
                    name="mensagem"
                    rows={4}
                    className="field__control"
                  />
                </div>

                <Button type="submit">Enviar pedido</Button>
              </form>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
