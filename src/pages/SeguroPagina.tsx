import Container from "../components/layout/Container";
import CardGrid from "../components/layout/CardGrid";
import Section from "../components/layout/Section";
import HeroFotos from "../components/layout/HeroFotos";
import FlowLines from "../components/ui/FlowLines";
import Button from "../components/ui/Button";
import Link from "../app/Link";
import PorConfirmar from "../components/ui/PorConfirmar";
import RamoIcon from "../components/ui/RamoIcon";
import ComparacaoNiveis from "../components/ui/ComparacaoNiveis";
import Breadcrumb from "../components/navigation/Breadcrumb";
import PageSubnav from "../components/navigation/PageSubnav";
import { abrirProposta, hrefProposta } from "../app/proposta";
import ApoioSecao from "../sections/ApoioSecao";
import ContactoSecao from "../sections/ContactoSecao";
import SeguradorasFaixa from "../sections/SeguradorasFaixa";
import { hrefSeguro, PASSOS, SEGUROS } from "../data/seguros";
import type { Seguro } from "../data/seguros";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { slidesDe } from "../data/fotosHero";

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
  ];

  return (
    <>
      <HeroFotos
        slides={slidesDe(seguro.key)}
        topo={
          <Breadcrumb
            itens={[
              { label: "Início", href: "/" },
              { label: "Seguros", href: "/seguros" },
              { label: seguro.nome },
            ]}
          />
        }
        rotulo={seguro.publico}
        titulo={seguro.titulo}
        lede={seguro.intro}
        acoes={
          <>
            <Button as={Link} href={hrefProposta(seguro.key)}>
              Pedir proposta
            </Button>
            <Button as="a" href={seguro.niveis ? "#niveis" : "#coberturas"} variant="secondary">
              {seguro.niveis ? "Comparar níveis" : "Ver coberturas"}
            </Button>
          </>
        }
      />

      <PageSubnav itens={subnav} acao={{ label: "Pedir proposta", onClick: () => abrirProposta(seguro.key) }} />

      <Section variant="compact" className="section-decor">
        <FlowLines variante="bordas" />
        <Container>
          <h2 className="reasons__title">
            Porquê tratar do seu {seguro.key === "outros" ? "seguro" : nomeSeguro} connosco
          </h2>
          <CardGrid as="ul" className="reasons" role="list">
            {RAZOES.map((r) => (
              <li key={r.titulo} className="reasons__item">
                <h3>{r.titulo}</h3>
                <p className="text-secondary">{r.descricao}</p>
              </li>
            ))}
          </CardGrid>
        </Container>
      </Section>

      {seguro.niveis && (
        <Section id="niveis" surface className="section-anchor section-decor">
          <FlowLines variante="laterais" />
          <Container>
            <div className="section-intro section-intro--wide">
              <h2>Escolha o nível de proteção.</h2>
              <p className="text-secondary">
                Níveis ilustrativos, para começar a conversa: diga-nos qual se
                aproxima mais do que procura e comparamos as propostas das
                seguradoras.
              </p>
            </div>
            <ComparacaoNiveis dados={seguro.niveis} onPedirProposta={(nivel) => abrirProposta(seguro.key, nivel)} />
          </Container>
        </Section>
      )}

      <Section id="coberturas" className="section-anchor section-decor">
        <FlowLines variante="lateraisAbertas" espelhado />
        <Container>
          <div className="section-intro section-intro--wide">
            <h2>O que pode ficar coberto.</h2>
            <p className="text-secondary">
              As coberturas mais comuns neste ramo. Cada seguradora combina-as
              à sua maneira: dizemos-lhe quais fazem sentido no seu caso.
            </p>
          </div>
          <CardGrid as="ul" className="coverage-grid" role="list">
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
          </CardGrid>
          <p className="text-caption text-center mt-lg">
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

      <Section id="como-funciona" variant="compact" className="section-anchor section-decor">
        <FlowLines variante="laterais" espelhado />
        <Container>
          <div className="como-funciona-box">
            <h2>Como pedimos a sua proposta.</h2>
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

      <SeguradorasFaixa ramo={seguro.key} />

      <div id="perguntas" className="section-anchor">
        <ApoioSecao perguntas={seguro.perguntas} titulo="Perguntas frequentes." />
      </div>

      <Section variant="compact" surface className="section-decor">
        <FlowLines variante="bordas" espelhado />
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
