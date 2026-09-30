import { useState } from "react";
import Link from "../app/Link";
import CardGrid from "../components/layout/CardGrid";
import Button from "../components/ui/Button";
import { abrirProposta } from "../app/proposta";
import RamoIcon from "../components/ui/RamoIcon";
import LineIcon from "../components/ui/LineIcon";
import SegmentTabs from "../components/navigation/SegmentTabs";
import { hrefSeguro, SEGMENTOS, SEGUROS } from "../data/seguros";
import type { Segmento } from "../data/seguros";

type Filtro = "todos" | Segmento;

const TABS: { valor: Filtro; label: string }[] = [
  { valor: "todos", label: "Todos" },
  ...SEGMENTOS.map((s) => ({ valor: s.valor, label: s.nome })),
];

/** Cartões dos ramos com separador Particulares/Empresas (Home e /seguros). */
export default function SegurosGrid({
  headingLevel = "h3",
  mostrarPublico = false,
}: {
  headingLevel?: "h2" | "h3";
  /** No hub mostra "Particulares/Empresas" por cartão; na Home os separadores já o dizem. */
  mostrarPublico?: boolean;
}) {
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const Heading = headingLevel;
  const visiveis = filtro === "todos" ? SEGUROS : SEGUROS.filter((s) => s.segmentos.includes(filtro));

  return (
    <>
      <div className="segment-tabs-wrap">
        <SegmentTabs id="seguros" label="Filtrar seguros" tabs={TABS} ativo={filtro} onChange={setFiltro} />
      </div>
      <CardGrid
        id="seguros-painel"
        role="tabpanel"
        aria-labelledby={`seguros-tab-${filtro}`}
        style={{ marginTop: "var(--space-lg)" }}
      >
        {visiveis.map((seguro) => (
          <article
            key={seguro.key}
            className="media-card media-card--interactive"
          >
            {/* Foto e título levam à página do ramo; os botões são as duas ações do cartão. */}
            <Link href={hrefSeguro(seguro)} tabIndex={-1} aria-hidden="true" className="media-card__media-link">
              <img
                src={seguro.imagem}
                alt=""
                className="media-card__media"
                loading="lazy"
                style={{ objectPosition: seguro.imagemFoco }}
              />
            </Link>
            <div className="media-card__body">
              <div className="media-card__icon-chip">
                <RamoIcon tipo={seguro.key} />
              </div>
              {mostrarPublico && <p className="text-label text-muted">{seguro.publico}</p>}
              <Heading className="media-card__title">
                <Link href={hrefSeguro(seguro)} className="media-card__title-link">
                  {seguro.nome}
                </Link>
              </Heading>
              <p className="text-secondary">{seguro.descricao}</p>
              <div className="media-card__actions">
                <Button size="sm" onClick={() => abrirProposta(seguro.key)} aria-label={`Simular seguro ${seguro.nome.toLowerCase()}`}>
                  Simular
                </Button>
                <Button
                  as={Link}
                  href={hrefSeguro(seguro)}
                  size="sm"
                  variant="secondary"
                  aria-label={`Ver detalhes: ${seguro.nome}`}
                >
                  Ver detalhes
                  <LineIcon nome="seta" size={16} />
                </Button>
              </div>
            </div>
          </article>
        ))}
      </CardGrid>
    </>
  );
}
