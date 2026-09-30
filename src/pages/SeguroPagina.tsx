import type { CSSProperties } from "react";
import Container from "../components/layout/Container";
import Section from "../components/layout/Section";
import Button from "../components/ui/Button";
import Link from "../app/Link";
import PorConfirmar from "../components/ui/PorConfirmar";
import RamoIcon from "../components/ui/RamoIcon";
import ComparacaoNiveis from "../components/ui/ComparacaoNiveis";
import Breadcrumb from "../components/navigation/Breadcrumb";
import PageSubnav from "../components/navigation/PageSubnav";
import ApoioSecao from "../sections/ApoioSecao";
import ContactoSecao from "../sections/ContactoSecao";
import SeguradorasFaixa from "../sections/SeguradorasFaixa";
import { hrefSeguro, PASSOS, SEGUROS } from "../data/seguros";
import type { Seguro } from "../data/seguros";
import useDocumentTitle from "../hooks/useDocumentTitle";

const RAZOES = [
  { titulo: "Várias seguradoras", descricao: "Comparamos propostas antes de recomendar uma, em vez de vender um só produto." },
  { titulo: "Coberturas explicadas", descricao: "Sabe o que está e o que não está coberto antes de assinar." },
  { titulo: "Apoio no sinistro", descricao: "Quando precisar de usar o seguro, acompanhamos o processo consigo." },
];

/**
 * Página de um ramo, com a estrutura das páginas de produto das
 * seguradoras (hero, subnavegação, razões, níveis, coberturas, FAQ,
 * canais, contacto) e o ângulo de corretora: comparamos, não vendemos
 * um produto.
 */
export default function SeguroPagina({ seguro }: { seguro: Seguro }) {
  const nomeSeguro = seguro.key === "outros" ? "outros seguros" : `seguro ${seguro.nome.toLowerCase()}`;
  useDocumentTitle(`${nomeSeguro[0].toUpperCase()}${nomeSeguro.slice(1)} | BV Seguros`, seguro.intro);
  const outros = SEGUROS.filter((s) => s.key !== seguro.key);

  const subnav = [
    ...(seguro.niveis ? [{ id: "niveis", label: "Níveis de proteção" }] : []),
    { id: "coberturas", label: "Coberturas" },
    { id: "como-funciona", label: "Como funciona" },
    { id: "perguntas", label: "Perguntas frequentes" },
    { id: "contacto", label: "Pedir proposta" },
  ];

  return (
    <>
      <Section className="hero-dark" variant="compact">
        <Container>
          <Breadcrumb
            itens={[
              { label: "Início", href: "/" },
              { label: "Seguros", href: "/seguros" },
              { label: seguro.nome },
            ]}
          />
          <div className="grid" style={{ gap: "var(--space-xl)", alignItems: "center", marginTop: "var(--space-md)" }}>
            <div style={{ gridColumn: "span 7" }}>
              <p className="text-label">{seguro.publico}</p>
              <h1 style={{ marginTop: "var(--space-2xs)" }}>{seguro.titulo}</h1>
              <p className="text-body-large text-secondary" style={{ marginTop: "var(--space-sm)" }}>
                {seguro.intro}
              </p>
              <div className="cluster" style={{ marginTop: "var(--space-lg)" }}>
                <Button as="a" href="#contacto">
                  Pedir proposta
                </Button>
                <Button as="a" href={seguro.niveis ? "#niveis" : "#coberturas"} variant="secondary">
                  {seguro.niveis ? "Comparar níveis" : "Ver coberturas"}
                </Button>
              </div>
            </div>
            <div style={{ gridColumn: "span 5" }}>
              <img src={seguro.imagem} alt="" className="hero-photo" style={{ objectPosition: seguro.imagemFoco }} />
            </div>
          </div>
        </Container>
      </Section>

      <PageSubnav itens={subnav} />

      <Section variant="compact">
        <Container>
          <h2 className="reasons__title">
            Porquê tratar do seu {seguro.key === "outros" ? "seguro" : nomeSeguro} connosco
          </h2>
          <ul className="reasons" role="list">
            {RAZOES.map((r, i) => (
              <li key={r.titulo} className="reasons__item">
                <span className="reasons__number">{String(i + 1).padStart(2, "0")}</span>
                <h3>{r.titulo}</h3>
                <p className="text-secondary">{r.descricao}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {seguro.niveis && (
        <Section id="niveis" surface className="section-anchor">
          <Container>
            <div className="section-intro section-intro--wide">
              <h2>Escolha o nível de proteção.</h2>
              <p className="text-secondary">
                Uma forma simples de começar a conversa: diga-nos qual se
                aproxima mais do que procura e comparamos as propostas.
              </p>
            </div>
            <ComparacaoNiveis dados={seguro.niveis} />
          </Container>
        </Section>
      )}

      <Section id="coberturas" className="section-anchor">
        <Container>
          <div className="section-intro section-intro--wide">
            <h2>O que pode ficar coberto.</h2>
            <p className="text-secondary">
              As coberturas mais comuns neste ramo. Cada seguradora combina-as
              à sua maneira: dizemos-lhe quais fazem sentido no seu caso.
            </p>
          </div>
          <ul
            className="coverage-grid"
            role="list"
            // 4 ou 8 coberturas ficam em linhas de 4; o resto em linhas de 3.
            style={{ "--colunas": seguro.coberturas.length % 4 === 0 ? 4 : 3 } as CSSProperties}
          >
            {seguro.coberturas.map((c) => (
              <li key={c.titulo} className="coverage-item">
                <svg className="coverage-item__icon" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M5 10.5l3 3 7-7" />
                </svg>
                <div>
                  <h3>{c.titulo}</h3>
                  <p className="text-secondary">{c.descricao}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-caption" style={{ marginTop: "var(--space-lg)", textAlign: "center" }}>
            <PorConfirmar>
              Por confirmar: seguradoras com quem a BV trabalha neste ramo e
              coberturas que coloca.
            </PorConfirmar>
          </p>
        </Container>
      </Section>

      {seguro.destaque && (
        <Section variant="compact">
          <Container>
            <div className="feature-band">
              <div className="feature-band__icon">
                <RamoIcon tipo={seguro.key} />
              </div>
              <div>
                <h2 className="feature-band__title">{seguro.destaque.titulo}</h2>
                <p className="feature-band__text">{seguro.destaque.texto}</p>
              </div>
              <ul className="feature-band__points" role="list">
                {seguro.destaque.pontos.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          </Container>
        </Section>
      )}

      <Section id="como-funciona" variant="compact" className="section-anchor">
        <Container>
          <div className="como-funciona-box">
            <h2>Como pedimos a sua proposta.</h2>
            <ol className="steps-list" role="list">
              {PASSOS.map((passo, i) => (
                <li key={passo.titulo} className="steps-list__item">
                  <span className="text-display steps-list__number">{i + 1}</span>
                  <h3>{passo.titulo}</h3>
                  <p className="text-secondary">{passo.descricao}</p>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </Section>

      <SeguradorasFaixa ramo={seguro.key} />

      <div id="perguntas" className="section-anchor">
        <ApoioSecao perguntas={seguro.perguntas} titulo="Perguntas frequentes." />
      </div>

      <Section variant="compact" surface>
        <Container>
          <h2 className="related-heading">Outros seguros</h2>
          <ul className="related-list" role="list">
            {outros.map((s) => (
              <li key={s.key}>
                <Link href={hrefSeguro(s)} className="related-link">
                  <span className="related-link__icon">
                    <RamoIcon tipo={s.key} />
                  </span>
                  {s.nome}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <ContactoSecao seguro={seguro} />
    </>
  );
}
