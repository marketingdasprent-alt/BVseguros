import { useState } from "react";
import Link from "../app/Link";
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
      <div
        id="seguros-painel"
        role="tabpanel"
        aria-labelledby={`seguros-tab-${filtro}`}
        className="grid grid--services"
        style={{ gap: "var(--space-lg)", marginTop: "var(--space-lg)" }}
      >
        {visiveis.map((seguro) => (
          <Link
            key={seguro.key}
            href={hrefSeguro(seguro)}
            className="media-card media-card--interactive media-card--link"
            style={{ gridColumn: "span 4" }}
          >
            <img
              src={seguro.imagem}
              alt=""
              className="media-card__media"
              loading="lazy"
              style={{ objectPosition: seguro.imagemFoco }}
            />
            <div className="media-card__body">
              <div className="media-card__icon-chip">
                <RamoIcon tipo={seguro.key} />
              </div>
              {mostrarPublico && <p className="text-label text-muted">{seguro.publico}</p>}
              <Heading className="media-card__title">{seguro.nome}</Heading>
              <p className="text-secondary">{seguro.descricao}</p>
              <span className="media-card__more" aria-hidden="true">
                Ver coberturas
                <LineIcon nome="seta" size={16} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
