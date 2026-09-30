import type { Seguro } from "../data/seguros";

/** Frase para o leitor de ecrã quando aparecem as perguntas de um ramo. */
export function anuncioPerguntas(n: number, seguro: Seguro | undefined): string {
  if (!seguro || n === 0) return "";
  const perguntas = n === 1 ? "Mais 1 pergunta" : `Mais ${n} perguntas`;
  const sobre = seguro.key === "outros" ? "sobre este seguro" : `sobre o seguro ${seguro.nome.toLowerCase()}`;
  return `${perguntas} ${sobre}.`;
}
