import type { RamoKey } from "../../data/seguros";

/**
 * Ícones de traço mínimo (24x24, stroke="currentColor"), um por ramo.
 * Reutilizados nos cartões de "O que cobrimos": herdam a cor via CSS,
 * sem depender de nenhuma biblioteca de ícones.
 */
export default function RamoIcon({ tipo }: { tipo: RamoKey }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (tipo) {
    case "auto":
      return (
        <svg {...common}>
          <path d="M4 16.5V12l2.2-5.5A2 2 0 0 1 8 5h8a2 2 0 0 1 1.8 1.5L20 12v4.5" />
          <path d="M3 16.5h18" />
          <circle cx="7.5" cy="17" r="1.6" />
          <circle cx="16.5" cy="17" r="1.6" />
        </svg>
      );
    case "vida":
      return (
        <svg {...common}>
          <path d="M12 20s-7-4.35-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 5c-2.5 4.65-9.5 9-9.5 9Z" />
        </svg>
      );
    case "saude":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      );
    case "habitacao":
      return (
        <svg {...common}>
          <path d="M4 11 12 4l8 7" />
          <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
          <path d="M10 20v-5h4v5" />
        </svg>
      );
    case "trabalho":
      return (
        <svg {...common}>
          <path d="M4 13a8 8 0 0 1 16 0" />
          <path d="M3 13h18v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2Z" />
          <path d="M9 13V9a3 3 0 0 1 6 0v4" />
        </svg>
      );
    case "outros":
      return (
        <svg {...common}>
          <path d="M4 12a8 8 0 0 1 16 0Z" />
          <path d="M12 12v7a1.5 1.5 0 0 1-3 0" />
          <path d="M12 4v2" />
        </svg>
      );
  }
}
