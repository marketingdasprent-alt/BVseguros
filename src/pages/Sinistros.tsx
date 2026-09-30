import Container from "../components/layout/Container";
import Section from "../components/layout/Section";
import Button from "../components/ui/Button";
import PorConfirmar from "../components/ui/PorConfirmar";
import RamoIcon from "../components/ui/RamoIcon";
import Breadcrumb from "../components/navigation/Breadcrumb";
import ApoioSecao from "../sections/ApoioSecao";
import ContactoSecao from "../sections/ContactoSecao";
import type { Pergunta } from "../data/apoio";
import type { RamoKey } from "../data/seguros";
import useDocumentTitle from "../hooks/useDocumentTitle";

const PRIMEIROS_PASSOS = [
  { titulo: "Garanta a segurança", descricao: "Se houver feridos ou perigo, ligue 112 antes de tudo." },
  { titulo: "Registe o que aconteceu", descricao: "Fotografias, data, hora, local e contactos de quem estava presente." },
  { titulo: "Evite agravar os danos", descricao: "Feche a água ou o gás, proteja o que ficou exposto. Não deite nada fora." },
  { titulo: "Fale connosco", descricao: "Dizemos-lhe o que participar, como e em que prazo." },
];

// Orientação geral por ramo; o que cada apólice exige está nas suas condições.
const POR_RAMO: { key: RamoKey; titulo: string; passos: string[] }[] = [
  {
    key: "auto",
    titulo: "Acidente de automóvel",
    passos: [
      "Sinalize o local: colete refletor e triângulo.",
      "Preencha a Declaração Amigável com o outro condutor, se estiverem de acordo sobre o que aconteceu.",
      "Fotografe a posição dos carros, os danos e as matrículas.",
      "Anote os dados de testemunhas, se houver.",
    ],
  },
  {
    key: "habitacao",
    titulo: "Danos em casa",
    passos: [
      "Pare a origem do problema, por exemplo fechando a água.",
      "Fotografe os danos antes de limpar ou reparar.",
      "Guarde os bens danificados e as faturas que tiver.",
      "Em caso de furto, apresente queixa às autoridades e guarde o comprovativo.",
    ],
  },
  {
    key: "saude",
    titulo: "Despesas de saúde",
    passos: [
      "Na rede convencionada, apresente o cartão do seguro no atendimento.",
      "Fora da rede, peça fatura com o seu NIF e o relatório médico para pedir o reembolso.",
      "Para cirurgias ou internamentos programados, confirme antes a autorização prévia.",
    ],
  },
  {
    key: "trabalho",
    titulo: "Acidente de trabalho",
    passos: [
      "Preste assistência ao trabalhador e encaminhe-o para tratamento.",
      "A entidade empregadora participa o acidente à seguradora no prazo previsto na lei.",
      "Guarde os relatórios médicos e o registo do que aconteceu.",
    ],
  },
  {
    key: "vida",
    titulo: "Seguro de vida",
    passos: [
      "Fale connosco: indicamos os documentos que a seguradora pede.",
      "Ajudamos os beneficiários a reunir e entregar a documentação.",
    ],
  },
];

const PERGUNTAS_SINISTRO: Pergunta[] = [
  {
    pergunta: "Qual o prazo para participar um sinistro?",
    resposta:
      "Em regra, 8 dias a partir do momento em que teve conhecimento do sinistro, salvo prazo diferente no contrato. Nos acidentes de trabalho aplicam-se os prazos da lei própria. Quanto mais cedo participar, melhor.",
  },
  {
    pergunta: "Posso mandar reparar antes de a seguradora ver os danos?",
    resposta:
      "Só o que for urgente para evitar danos maiores. Para o resto, espere pela peritagem ou pela autorização da seguradora, e guarde fotografias e faturas.",
  },
  {
    pergunta: "O seguro não é na BV. Podem ajudar?",
    resposta:
      "Podemos explicar os passos gerais, mas o acompanhamento do processo é feito pelo mediador ou pela seguradora da apólice. Se quiser, analisamos os seus seguros para o futuro.",
  },
];

export default function Sinistros() {
  useDocumentTitle(
    "Participar sinistro | BV Seguros",
    "O que fazer em caso de acidente, danos em casa ou despesas de saúde, e como a BV Seguros acompanha a participação do sinistro."
  );

  return (
    <>
      <Section className="hero-dark" variant="compact">
        <Container>
          <Breadcrumb itens={[{ label: "Início", href: "/" }, { label: "Sinistros" }]} />
          <div style={{ maxWidth: "var(--measure-intro-wide)", marginTop: "var(--space-md)" }}>
            <h1>Teve um sinistro? Ajudamos a tratar de tudo.</h1>
            <p className="text-body-large text-secondary" style={{ marginTop: "var(--space-sm)" }}>
              Veja o que fazer nas primeiras horas e fale connosco: participamos
              à seguradora consigo e acompanhamos o processo até ao fim.
            </p>
            <div className="cluster" style={{ marginTop: "var(--space-lg)" }}>
              <Button as="a" href="#contacto">
                Pedir ajuda com um sinistro
              </Button>
              <Button as="a" href="#por-ramo" variant="secondary">
                O que fazer por tipo de seguro
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      <Section variant="compact">
        <Container>
          <h2 className="reasons__title">Nas primeiras horas</h2>
          <ol className="reasons" role="list">
            {PRIMEIROS_PASSOS.map((p, i) => (
              <li key={p.titulo} className="reasons__item">
                <span className="reasons__number">{String(i + 1).padStart(2, "0")}</span>
                <h3>{p.titulo}</h3>
                <p className="text-secondary">{p.descricao}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section id="por-ramo" surface className="section-anchor">
        <Container>
          <div className="section-intro section-intro--wide">
            <h2>O que fazer, por tipo de seguro.</h2>
            <p className="text-secondary">
              Orientação geral. O que a sua apólice exige está nas condições
              do contrato, e confirmamos consigo.
            </p>
          </div>
          <ul className="claim-grid" role="list">
            {POR_RAMO.map((r) => (
              <li key={r.key} className="claim-card">
                <span className="claim-card__icon">
                  <RamoIcon tipo={r.key} />
                </span>
                <h3>{r.titulo}</h3>
                <ul className="claim-card__steps">
                  {r.passos.map((passo) => (
                    <li key={passo}>{passo}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <p className="text-caption" style={{ marginTop: "var(--space-lg)", textAlign: "center" }}>
            <PorConfirmar>
              Por confirmar: linhas de assistência 24 horas das seguradoras com
              quem a BV trabalha.
            </PorConfirmar>
          </p>
        </Container>
      </Section>

      <ApoioSecao perguntas={PERGUNTAS_SINISTRO} titulo="Perguntas sobre sinistros." />

      <ContactoSecao titulo="Conte-nos o que aconteceu." />
    </>
  );
}
