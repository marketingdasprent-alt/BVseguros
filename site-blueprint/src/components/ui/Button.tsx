/**
 * Button: see docs/design-system.md#button for the full state
 * contract (default, hover, focus-visible, active, disabled, loading).
 */

import type { ElementType } from "react";
import type { PolymorphicProps } from "../../types/polymorphic";

const VARIANT_CLASS = {
  primary: "btn--primary",
  secondary: "btn--secondary",
  ghost: "btn--ghost",
};

export type ButtonProps<C extends ElementType = "button"> = PolymorphicProps<C, {
  variant?: keyof typeof VARIANT_CLASS;
  size?: "sm";
  loading?: boolean;
  disabled?: boolean;
}>;

export default function Button<C extends ElementType = "button">({
  as,
  variant = "primary",
  size,
  loading = false,
  disabled = false,
  className = "",
  children,
  ...rest
}: ButtonProps<C>) {
  const Tag: ElementType = as ?? "button";
  const classes = [
    "btn",
    VARIANT_CLASS[variant],
    size === "sm" ? "btn--sm" : "",
    loading ? "btn--loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const isButtonTag = Tag === "button";

  return (
    <Tag
      className={classes}
      disabled={isButtonTag ? disabled || loading : undefined}
      aria-disabled={!isButtonTag && (disabled || loading) ? true : undefined}
      aria-busy={loading || undefined}
      {...rest}
    >
      {children}
      {loading && <span className="btn__spinner" aria-hidden="true" />}
    </Tag>
  );
}
