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
 * logótipo (ver brand/), não uma cópia do PNG. Substitui o hero só-texto
 * que pesava contra nós nas 4 referências (todas têm foto ou ilustração).
 */
function HeroMark() {
  return (
    <svg
      viewBox="0 0 120 120"
      width="96"
      height="96"
      role="img"
      aria-label="Símbolo BV Seguros: escudo com verificação"
    >
      <circle cx="60" cy="60" r="58" fill="var(--color-primary)" fillOpacity="0.06" />
      <path
        d="M60 14c-13 8-24 11-34 12v34c0 24 14 40 34 48 20-8 34-24 34-48V26c-10-1-21-4-34-12Z"
        fill="var(--color-surface)"
        stroke="var(--color-primary)"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M42 60l12 12 24-26"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="7"
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
          <div className="section-intro">
            <HeroMark />
            <p className="text-label text-muted" style={{ marginTop: "var(--space-sm)" }}>
              Seguros e Soluções
            </p>
            <h1>Proteção a sério, explicada em português simples.</h1>
            <p className="text-body-large text-secondary">
              Ajudamos famílias e empresas a escolher o seguro certo, sem
              letras miúdas por explicar e com alguém do outro lado quando
              precisar de usar a apólice.
            </p>
            <div className="cluster cluster--center">
              <Button as="a" href="#contacto">
                Pedir uma proposta
              </Button>
              <Button as="a" href="#servicos" variant="secondary">
                Ver seguros disponíveis
              </Button>
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
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 44,
                    height: 44,
                    borderRadius: "var(--radius-full)",
                    background: "var(--color-accent)",
                    color: "var(--color-text-on-primary)",
                    marginInline: "auto",
                    marginBottom: "var(--space-xs)",
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
          <div className="section-intro">
            <p className="text-label text-muted">Como funciona</p>
            <h2>Três passos, sem burocracia.</h2>
          </div>
          <div
            className="grid"
            style={{ gap: "var(--space-lg)", marginTop: "var(--space-xl)" }}
          >
            {PASSOS.map((passo, i) => (
              <div key={passo.titulo} style={{ gridColumn: "span 4" }}>
                <div
                  className="text-label"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 32,
                    height: 32,
                    borderRadius: "var(--radius-full)",
                    border: "var(--border-width-thick) solid var(--color-primary)",
                    color: "var(--color-primary)",
                    marginBottom: "var(--space-sm)",
                  }}
                >
                  {i + 1}
                </div>
                <h3>{passo.titulo}</h3>
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
