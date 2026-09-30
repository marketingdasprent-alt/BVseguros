/**
 * CardGrid: the component form of .card-grid (layout.css). It counts
 * its children and picks the column count so rows come out balanced:
 * an even count fills equal rows (4 -> 2+2, 6 -> 3+3, 8 -> 4+4); an odd
 * count that can't be split evenly keeps the centred "V" (5 -> 3+2).
 * See docs/design-system.md#card-grid and DECISIONS.md 2026-09-30.
 */

import { Children } from "react";
import type { CSSProperties, ElementType } from "react";
import type { PolymorphicProps } from "../../types/polymorphic";
import { colunasEquilibradas } from "../../utils/colunasEquilibradas";

export type CardGridProps<C extends ElementType = "div"> = PolymorphicProps<C, {
  /** Boxes per row on desktop (default 3). */
  cols?: number;
  /** Boxes per row below 1024px (default 2). Below 640px it is always 1. */
  colsTablet?: number;
}>;

export default function CardGrid<C extends ElementType = "div">({
  as,
  cols = 3,
  colsTablet = 2,
  className = "",
  style,
  children,
  ...rest
}: CardGridProps<C>) {
  const Tag: ElementType = as ?? "div";
  const n = Children.toArray(children).length;
  const vars = {
    // --cols-alvo keeps each box at its usual width when fewer columns are used.
    "--cols-alvo": cols,
    "--cols": colunasEquilibradas(n, cols),
    "--cols-tablet": colunasEquilibradas(n, colsTablet),
  } as CSSProperties;

  return (
    <Tag className={["card-grid", className].filter(Boolean).join(" ")} style={{ ...vars, ...style }} {...rest}>
      {children}
    </Tag>
  );
}
