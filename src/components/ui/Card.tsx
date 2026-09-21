/**
 * Card: generic content surface. Not every block of content needs
 * to be a card (see docs/anti-ai.md): reach for this only when the
 * content is genuinely a discrete, self-contained unit.
 */

import type { ElementType } from "react";
import type { PolymorphicProps } from "../../types/polymorphic";

export type CardProps<C extends ElementType = "div"> = PolymorphicProps<C, {
  interactive?: boolean;
  selected?: boolean;
  center?: boolean;
}>;

export default function Card<C extends ElementType = "div">({
  as,
  interactive = false,
  selected = false,
  center = false,
  className = "",
  children,
  ...rest
}: CardProps<C>) {
  const Tag: ElementType = as ?? "div";
  const classes = [
    "card",
    interactive ? "card--interactive" : "",
    selected ? "card--selected" : "",
    center ? "card--center" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const interactiveProps = interactive
    ? { tabIndex: rest.tabIndex ?? 0, role: rest.role ?? "button" }
    : {};

  return (
    <Tag className={classes} {...interactiveProps} {...rest}>
      {children}
    </Tag>
  );
}
