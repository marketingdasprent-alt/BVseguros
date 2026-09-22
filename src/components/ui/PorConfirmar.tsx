import type { ReactNode } from "react";

/** Marks content that isn't confirmed yet, never disguised as a real fact. */
export default function PorConfirmar({ children }: { children: ReactNode }) {
  return <span className="placeholder-note">{children}</span>;
}
