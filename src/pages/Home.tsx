import type { ReactNode } from "react";
import Container from "../components/layout/Container";
import Section from "../components/layout/Section";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/forms/Input";

const RAMOS = [
  {
    nome: "Automóvel",
    descricao: "Responsabilidade civil, danos próprios e assistência em viagem.",
  },
  {
    nome: "Vida",
    descricao: "Proteção financeira para quem depende de si, ajustada à sua fase de vida.",
  },
  {
    nome: "Saúde",
    descricao: "Acesso a rede de cuidados privados, com e sem internamento.",
  },
  {
    nome: "Multirriscos habitação",
    descricao: "Casa própria ou arrendada, conteúdo e responsabilidade civil incluídos.",
  },
  {
    nome: "Acidentes de trabalho",
    descricao: "Obrigatório para quem tem trabalhadores a cargo. Tratamos do processo todo.",
  },
  {
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

/** Marca visível de conteúdo por confirmar, nunca disfarçada de facto real. */
function PorConfirmar({ children }: { children: ReactNode }) {
  return <span className="placeholder-note">{children}</span>;
}

export default function Home() {
  return (
    <>
      <Section>
        <Container>
          <div className="section-intro">
            <p className="text-label text-muted">Seguros e Soluções</p>
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
          <div className="grid" style={{ gap: "var(--space-xl)", alignItems: "start" }}>
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
              <Card key={ramo.nome} center>
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

      <Section id="contacto" surface>
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
                      <option key={ramo.nome}>{ramo.nome}</option>
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
