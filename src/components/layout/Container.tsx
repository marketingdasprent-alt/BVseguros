/**
 * Container: controls max-width, centering, and horizontal gutters.
 * The only place a page should set a content width. See
 * docs/design-system.md#container for the variant contract.
 */

import type { ElementType } from "react";
import type { PolymorphicProps } from "../../types/polymorphic";

const VARIANT_CLASS = {
  standard: "",
  narrow: "container--narrow",
  wide: "container--wide",
  full: "container--full",
};

export type ContainerProps<C extends ElementType = "div"> = PolymorphicProps<C, {
  variant?: keyof typeof VARIANT_CLASS;
}>;

export default function Container<C extends ElementType = "div">({
  as,
  variant = "standard",
  className = "",
  children,
  ...rest
}: ContainerProps<C>) {
  const Tag: ElementType = as ?? "div";
  const classes = ["container", VARIANT_CLASS[variant], className]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}
