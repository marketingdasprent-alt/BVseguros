/**
 * Section: controls vertical rhythm between page blocks. Backgrounds
 * can run full-bleed via `surface`/className while content stays
 * aligned by nesting a <Container /> inside. See
 * docs/design-system.md#section for the variant contract.
 */

import type { ElementType } from "react";
import type { PolymorphicProps } from "../../types/polymorphic";

const VARIANT_CLASS = {
  normal: "",
  compact: "section--compact",
  spacious: "section--spacious",
  immersive: "section--immersive",
};

export type SectionProps<C extends ElementType = "section"> = PolymorphicProps<C, {
  variant?: keyof typeof VARIANT_CLASS;
  surface?: boolean;
}>;

export default function Section<C extends ElementType = "section">({
  as,
  variant = "normal",
  surface = false,
  className = "",
  children,
  ...rest
}: SectionProps<C>) {
  const Tag: ElementType = as ?? "section";
  const classes = [
    "section",
    VARIANT_CLASS[variant],
    surface ? "section--surface" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}
