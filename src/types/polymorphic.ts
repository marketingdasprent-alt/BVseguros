import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

/** Preserve native/custom component props when changing the rendered element. */
export type PolymorphicProps<C extends ElementType, OwnProps = object> =
  OwnProps & {
    as?: C;
    children?: ReactNode;
    className?: string;
  } & Omit<ComponentPropsWithoutRef<C>, keyof OwnProps | "as" | "children" | "className">;
