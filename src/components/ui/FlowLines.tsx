/**
 * Linhas azuis decorativas em SVG, a pedido direto do cliente (esboço
 * anotado por cima do site). Decorativas só: aria-hidden, sem interação,
 * sempre atrás do conteúdo (section-decor). Cada secção tem o seu
 * traçado: `paths` próprios, ou uma `variante` (com `espelhado` para a
 * mesma variante não se repetir igual na mesma página).
 *
 * As variantes correm nas margens (arcos laterais, ondas junto às
 * bordas), para preencher o espaço à volta do conteúdo centrado sem
 * atravessar o texto.
 */
const VIEWBOX = "0 0 1440 600";

const VARIANTES = {
  // Arcos nas margens esquerda e direita: enchem as laterais vazias.
  laterais: [
    "M -60,40 C 140,70 210,200 150,320 S 20,520 -60,590",
    "M 1500,20 C 1300,90 1250,240 1310,360 S 1440,540 1500,610",
  ],
  lateraisAbertas: [
    "M -60,120 C 90,60 260,140 230,290 S 80,470 150,640",
    "M 1500,-20 C 1330,40 1190,160 1250,300 S 1400,440 1330,640",
  ],
  // Ondas rente ao topo e ao fundo da secção.
  bordas: [
    "M -60,30 C 300,70 620,-10 940,40 S 1300,80 1500,20",
    "M -60,570 C 280,540 600,610 900,570 S 1280,530 1500,580",
  ],
} as const;

export type VarianteLinhas = keyof typeof VARIANTES;

type Props =
  | { paths: string[]; viewBox: string; variante?: never; espelhado?: never }
  | { variante: VarianteLinhas; espelhado?: boolean; paths?: never; viewBox?: never };

export default function FlowLines(props: Props) {
  const paths = props.variante ? VARIANTES[props.variante] : props.paths;
  const viewBox = props.variante ? VIEWBOX : props.viewBox;
  return (
    <svg
      aria-hidden="true"
      className={"section-lines" + (props.espelhado ? " section-lines--mirror" : "")}
      viewBox={viewBox}
      preserveAspectRatio="none"
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
