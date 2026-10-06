/**
 * Dados da empresa, num só sítio. Enquanto `confirmado` for false o valor
 * aparece marcado com PorConfirmar; quando o cliente der o dado real, basta
 * trocar o valor e pôr `confirmado: true` (docs/questionario-cliente.md).
 * O `npm run qa` lista o que falta e falha se o site sair do noindex assim.
 */
export type Dado = { valor: string; confirmado: boolean };

export const EMPRESA = {
  nome: { valor: "BV Seguros", confirmado: true },
  denominacaoSocial: { valor: "[denominação social por confirmar]", confirmado: false },
  nipc: { valor: "[NIPC por confirmar]", confirmado: false },
  email: { valor: "geral@bvseguros.pt", confirmado: true },
  telefone: { valor: "+351 21 000 0000 (fictício, por confirmar)", confirmado: false },
  whatsapp: { valor: "Número por confirmar", confirmado: false },
  morada: { valor: "Rua das Flores, nº 123, 1200-192 Lisboa (fictício, por confirmar)", confirmado: false },
  registoAsf: { valor: "[nº de registo na ASF por confirmar]", confirmado: false },
  comarca: { valor: "Comarca de Lisboa (fictício, por confirmar)", confirmado: false },
} satisfies Record<string, Dado>;

export type CampoEmpresa = keyof typeof EMPRESA;

/** Link do dado, quando o tem (só depois de confirmado). */
export function hrefDado(campo: CampoEmpresa): string | undefined {
  const { valor, confirmado } = EMPRESA[campo];
  if (!confirmado) return undefined;
  if (campo === "email") return `mailto:${valor}`;
  if (campo === "telefone") return `tel:${valor.replace(/[^\d+]/g, "")}`;
  if (campo === "whatsapp") return `https://wa.me/${valor.replace(/\D/g, "")}`;
  return undefined;
}

/** Morada para o mapa: null até estar confirmada, para nunca mostrar a fictícia. */
export const MORADA_CONFIRMADA: string | null = EMPRESA.morada.confirmado ? EMPRESA.morada.valor : null;
