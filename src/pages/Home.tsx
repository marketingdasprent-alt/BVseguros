import type { ReactNode } from "react";
import Container from "../components/layout/Container";
import Section from "../components/layout/Section";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/forms/Input";

type RamoKey = "auto" | "vida" | "saude" | "habitacao" | "trabalho" | "outros";

const RAMOS: { key: RamoKey; nome: string; descricao: string }[] = [
  {
    key: "auto",
    nome: "Automóvel",
    descricao: "Responsabilidade civil, danos próprios e assistência em viagem.",
  },
  {
    key: "vida",
    nome: "Vida",
    descricao: "Proteção financeira para quem depende de si, ajustada à sua fase de vida.",
  },
  {
    key: "saude",
    nome: "Saúde",
    descricao: "Acesso a rede de cuidados privados, com e sem internamento.",
  },
  {
    key: "habitacao",
    nome: "Multirriscos habitação",
    descricao: "Casa própria ou arrendada, conteúdo e responsabilidade civil incluídos.",
  },
  {
    key: "trabalho",
    nome: "Acidentes de trabalho",
    descricao: "Obrigatório para quem tem trabalhadores a cargo. Tratamos do processo todo.",
  },
  {
    key: "outros",
    nome: "Outros seguros",
    descricao: "Responsabilidade civil, viagem e situações à medida. Fale connosco.",
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

/**
 * Ilustração do Hero: reinterpretação em traço do motivo escudo + check do
 * logótipo (ver brand/), não uma cópia do PNG. Composição deliberadamente
 * assimétrica (círculos desalinhados, escudo deslocado) para não cair no
 * cliché "ícone perfeito dentro de um círculo perfeito, tudo centrado"
 * (ver docs/anti-ai.md).
 */
function HeroMark() {
  return (
    <svg
      viewBox="0 0 340 340"
      width="100%"
      role="img"
      aria-label="Símbolo BV Seguros: escudo com verificação"
      style={{ maxWidth: 320 }}
    >
      <circle cx="255" cy="95" r="105" fill="var(--color-primary)" fillOpacity="0.07" />
      <circle cx="70" cy="255" r="54" fill="var(--color-accent)" fillOpacity="0.1" />
      <circle cx="288" cy="272" r="14" fill="var(--color-accent)" fillOpacity="0.35" />
      <path
        d="M158 46c-30 18-56 25-79 27v78c0 55 32 92 79 110 47-18 79-55 79-110V73c-23-2-49-9-79-27Z"
        fill="var(--color-surface)"
        stroke="var(--color-primary)"
        strokeWidth="7"
        strokeLinejoin="round"
      />
      <path
        d="M120 158l26 26 52-56"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <>
      <Section>
        <Container>
          <div className="grid" style={{ gap: "var(--space-xl)", alignItems: "center" }}>
            <div style={{ gridColumn: "span 7" }}>
              <p className="text-label text-muted">Seguros e Soluções</p>
              <h1>Proteção a sério, explicada em português simples.</h1>
              <p
                className="text-body-large text-secondary"
                style={{ marginTop: "var(--space-sm)" }}
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
            <div
              style={{
                gridColumn: "span 5",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <HeroMark />
            </div>
          </div>
        </Container>
      </Section>

      <Section id="sobre" variant="compact">
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

      <Section id="servicos" surface>
        <Container>
          <div className="section-intro section-intro--wide">
            <p className="text-label text-muted">O que cobrimos</p>
            <h2>Um seguro para cada fase da vida.</h2>
          </div>
          <div
            className="grid-auto grid--center"
            style={{ marginTop: "var(--space-xl)" }}
          >
            {RAMOS.map((ramo) => (
              <Card key={ramo.key} center>
                <div
                  style={{
                    color: "var(--color-accent)",
                    width: 36,
                    height: 36,
                    marginInline: "auto",
                    marginBottom: "var(--space-2xs)",
                  }}
                >
                  <RamoIcon tipo={ramo.key} />
                </div>
                <h3>{ramo.nome}</h3>
                <p className="text-secondary">{ramo.descricao}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section id="porque">
        <Container>
          <div className="section-intro">
            <p className="text-label text-muted">Porquê a BV Seguros</p>
            <h2>Três coisas que fazemos sempre.</h2>
          </div>
          <div
            className="grid-auto grid--center"
            style={{ marginTop: "var(--space-xl)" }}
          >
            {DIFERENCIAIS.map((item) => (
              <Card key={item.titulo} center>
                <h3>{item.titulo}</h3>
                <p className="text-secondary">{item.descricao}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section variant="compact" surface>
        <Container>
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
        </Container>
      </Section>

      <Section id="contacto">
        <Container>
          <div className="grid" style={{ gap: "var(--space-xl)", alignItems: "start" }}>
            <div style={{ gridColumn: "span 5" }}>
              <p className="text-label text-muted">Contacto</p>
              <h2>Fale connosco sobre o seu seguro.</h2>
              <p className="text-secondary" style={{ marginTop: "var(--space-md)" }}>
                Telefone: <PorConfirmar>[telefone por confirmar]</PorConfirmar>
                <br />
                Email: <a href="mailto:geral@bvseguros.pt">geral@bvseguros.pt</a>
                <br />
                Morada: <PorConfirmar>[morada por confirmar]</PorConfirmar>
              </p>
              <p className="text-caption" style={{ marginTop: "var(--space-md)" }}>
                Mediação de seguros:{" "}
                <PorConfirmar>[nº de registo na ASF por confirmar]</PorConfirmar>
              </p>
            </div>

            <div style={{ gridColumn: "span 7" }}>
              <form
                action="mailto:geral@bvseguros.pt"
                method="post"
                encType="text/plain"
                className="stack"
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
