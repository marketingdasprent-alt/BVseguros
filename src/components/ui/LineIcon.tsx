/**
 * Ícones de traço mínimo (24x24, stroke="currentColor"), mesmo desenho
 * do RamoIcon: herdam a cor via CSS, sem biblioteca de ícones.
 */
export type LineIconName =
  | "telefone"
  | "email"
  | "morada"
  | "whatsapp"
  | "proposta"
  | "sinistro"
  | "seguros"
  | "perguntas"
  | "chevron"
  | "seta"
  | "check";

const PATHS: Record<LineIconName, string[]> = {
  telefone: ["M5 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v3a2 2 0 0 1-2 2C10.5 20 4 13.5 4 6a2 2 0 0 1 1-2Z"],
  email: ["M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z", "m4 7 8 6 8-6"],
  morada: ["M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12Z", "M12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"],
  whatsapp: ["M4 20l1.3-3.9A8 8 0 1 1 8 18.8Z", "M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1a3.5 3.5 0 0 1-2-2l1-1-1-2Z"],
  proposta: ["M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z", "M14 3v5h5", "M9 13h6M9 17h4"],
  sinistro: ["M12 3 2.5 20h19Z", "M12 10v4", "M12 17h.01"],
  seguros: ["M12 3c-2.7 1.8-5.4 2.2-8 2.5v6.5c0 5 3.2 8.4 8 10 4.8-1.6 8-5 8-10V5.5c-2.6-.3-5.3-.7-8-2.5Z"],
  perguntas: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14", "M12 17h.01"],
  chevron: ["m6 9 6 6 6-6"],
  seta: ["M5 12h14", "m13 6 6 6-6 6"],
  check: ["m5 12.5 4.5 4.5L19 7"],
};

export default function LineIcon({ nome, size = 24 }: { nome: LineIconName; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flex: "none" }}
    >
      {PATHS[nome].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
