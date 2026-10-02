import type { RamoKey } from "../../data/seguros";
import { IconeTraco } from "./LineIcon";

// Círculos escritos como path (dois arcos), para todos os ícones usarem a mesma base.
const circulo = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

const PATHS: Record<RamoKey, string[]> = {
  auto: ["M4 16.5V12l2.2-5.5A2 2 0 0 1 8 5h8a2 2 0 0 1 1.8 1.5L20 12v4.5", "M3 16.5h18", circulo(7.5, 17, 1.6), circulo(16.5, 17, 1.6)],
  vida: ["M12 20s-7-4.35-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 5c-2.5 4.65-9.5 9-9.5 9Z"],
  saude: [circulo(12, 12, 9), "M12 8v8M8 12h8"],
  habitacao: ["M4 11 12 4l8 7", "M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9", "M10 20v-5h4v5"],
  trabalho: ["M4 13a8 8 0 0 1 16 0", "M3 13h18v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2Z", "M9 13V9a3 3 0 0 1 6 0v4"],
  outros: ["M4 12a8 8 0 0 1 16 0Z", "M12 12v7a1.5 1.5 0 0 1-3 0", "M12 4v2"],
};

/**
 * Ícones de traço mínimo (24x24, stroke="currentColor"), um por ramo.
 * Mesma base do LineIcon: herdam a cor via CSS, sem biblioteca de ícones.
 */
export default function RamoIcon({ tipo }: { tipo: RamoKey }) {
  return <IconeTraco paths={PATHS[tipo]} />;
}
