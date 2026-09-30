/**
 * Linhas azuis decorativas em SVG, a pedido direto do cliente (esboço
 * anotado por cima do site). Substituem as manchas circulares
 * anteriores. Decorativas só: aria-hidden, sem interação, sempre atrás
 * do conteúdo (section-decor dá z-index:1 ao Container). Cada secção
 * recebe o seu próprio par de curvas (viewBox e traçado próprios) em
 * vez de um preset repetido, para não ler como o mesmo carimbo cinco
 * vezes.
 */
export default function FlowLines({ paths, viewBox }: { paths: string[]; viewBox: string }) {
  return (
    <svg aria-hidden="true" className="section-lines" viewBox={viewBox} preserveAspectRatio="none">
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
