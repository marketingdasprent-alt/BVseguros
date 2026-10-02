/**
 * Código postal e morada pela moradas.dev (grátis, sem chave, CORS aberto;
 * https://moradas.dev/docs). É só ajuda: se a API falhar ou demorar, o
 * formulário segue com a validação de formato e nunca fica bloqueado.
 */

const BASE = "https://moradas.dev";
const ESPERA_MAXIMA_MS = 3000;

export type Localidade = { localidade: string; concelho: string; distrito: string };

export type ResultadoCodigoPostal =
  | { estado: "ok"; local: Localidade }
  | { estado: "inexistente" }
  | { estado: "indisponivel" };

export type SugestaoMorada = {
  texto: string;
  rua: string;
  localidade: string;
  concelho: string;
  /** null quando a rua tem vários códigos postais e falta o número de porta. */
  cp7: string | null;
  /** Efémero: muda a cada atualização da API. Usar logo, nunca guardar. */
  artId: number;
  tipo: "street" | "loc";
};

type DadosSugestao = {
  art_id: number;
  kind: "street" | "loc";
  street?: string;
  localidade: string;
  concelho: string;
  cp7: string | null;
  resolved_cp7?: string | null;
};

const cacheCp = new Map<string, ResultadoCodigoPostal>();

/** fetch com tempo limite; junta o sinal de quem chama (para cancelar) ao do tempo. */
async function pedir(caminho: string, sinal?: AbortSignal): Promise<Response> {
  const tempo = AbortSignal.timeout(ESPERA_MAXIMA_MS);
  const juntos = sinal ? AbortSignal.any([sinal, tempo]) : tempo;
  return fetch(`${BASE}${caminho}`, { signal: juntos });
}

export async function consultarCodigoPostal(cp7: string, sinal?: AbortSignal): Promise<ResultadoCodigoPostal> {
  if (!/^\d{4}-\d{3}$/.test(cp7)) return { estado: "inexistente" };
  const guardado = cacheCp.get(cp7);
  if (guardado) return guardado;
  try {
    const r = await pedir(`/cp/${cp7}`, sinal);
    if (r.status === 404) {
      const resultado: ResultadoCodigoPostal = { estado: "inexistente" };
      cacheCp.set(cp7, resultado);
      return resultado;
    }
    if (!r.ok) return { estado: "indisponivel" };
    const d = (await r.json()) as Partial<Localidade>;
    if (!d.localidade) return { estado: "indisponivel" };
    const resultado: ResultadoCodigoPostal = {
      estado: "ok",
      local: { localidade: d.localidade, concelho: d.concelho ?? "", distrito: d.distrito ?? "" },
    };
    cacheCp.set(cp7, resultado);
    return resultado;
  } catch (erro: unknown) {
    // Cancelado por quem chamou: deixa subir, para não pintar um resultado velho.
    if (sinal?.aborted) throw erro;
    return { estado: "indisponivel" };
  }
}

/** "Lisboa, Lisboa" ou só "Braga" quando localidade e concelho coincidem com o distrito vazio. */
export function descreverLocal(local: Localidade): string {
  return [local.localidade, local.concelho].filter(Boolean).join(", ");
}

/** Sugestões para o texto escrito. Erro ou limite de pedidos: lista vazia. */
export async function sugerirMoradas(texto: string, sinal?: AbortSignal): Promise<SugestaoMorada[]> {
  const q = texto.trim();
  if (q.length < 3) return [];
  try {
    const r = await pedir(`/suggest?q=${encodeURIComponent(q)}&count=5`, sinal);
    if (!r.ok) return [];
    const corpo = (await r.json()) as { suggestions?: { value: string; data: DadosSugestao }[] };
    return (corpo.suggestions ?? []).map(({ value, data }) => ({
      texto: value,
      rua: data.street ?? "",
      localidade: data.localidade,
      concelho: data.concelho,
      cp7: data.resolved_cp7 ?? data.cp7,
      artId: data.art_id,
      tipo: data.kind,
    }));
  } catch (erro: unknown) {
    if (sinal?.aborted) throw erro;
    return [];
  }
}

/** Código postal exato de uma rua com vários, pelo número de porta. null se não decidir. */
export async function resolverCodigoPostal(artId: number, numero: string): Promise<string | null> {
  if (!artId || !numero.trim()) return null;
  try {
    const r = await pedir(`/resolve?art=${artId}&numero=${encodeURIComponent(numero.trim())}`);
    if (!r.ok) return null;
    const corpo = (await r.json()) as { resolved?: { data?: { cp7?: string | null } } | null };
    return corpo.resolved?.data?.cp7 ?? null;
  } catch {
    // Sem resposta: a pessoa escreve o código postal à mão.
    return null;
  }
}
