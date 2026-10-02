import type { Campo, PassoRamo, Valores } from "../data/formularios";

/** Limite de `p_mensagem` na função criar_lead_site (crm/supabase/schema.sql). */
export const MAX_MENSAGEM = 2000;

/** Um bloco do resumo e da mensagem do CRM: um passo, com as suas respostas. */
export type Bloco = { titulo: string; passo?: string; linhas: { rotulo: string; valor: string }[] };

/** input type="date" devolve aaaa-mm-dd; no CRM e no resumo lê-se melhor em dd/mm/aaaa. */
export function dataPt(valor: string): string {
  const [a, m, d] = valor.split("-");
  return a && m && d ? `${d}/${m}/${a}` : valor;
}

const formatoEuros = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

/** "150000" passa a "150 000 €"; texto que não é número fica como está. */
export function euros(valor: string | undefined): string | undefined {
  if (!valor) return undefined;
  const n = Number(valor);
  return Number.isFinite(n) ? formatoEuros.format(n) : valor;
}

function valorLegivel(campo: Campo, valores: Valores, curto: boolean): string {
  const v = (valores[campo.nome] ?? "").trim();
  if (!v) return "";
  if (campo.tipo === "data") return dataPt(v);
  if (campo.tipo === "codigo_postal") {
    const local = (valores[`${campo.nome}_local`] ?? "").trim();
    if (!local) return v;
    return curto ? `${v} ${local}` : `${v} (${local})`;
  }
  if (!curto) return v;
  if (campo.resumoValores?.[v]) return campo.resumoValores[v];
  if (campo.tipo === "numero" && campo.rotulo.includes("(€)")) return euros(v) ?? v;
  if (campo.tipo === "numero" && campo.rotulo.includes("(m²)")) return `${v} m²`;
  return v;
}

/** No CRM: o rótulo curto, ou a pergunta sem "?" final. */
function rotuloCurto(campo: Campo): string {
  return campo.resumo ?? campo.rotulo.replace(/\?\s*$/, "");
}

/**
 * Os passos do ramo como blocos "Rótulo: valor", só com o que foi respondido.
 * `curto`: títulos e rótulos de resumo para o CRM (passos seguidos com o mesmo
 * `bloco` juntam-se); sem ele, os do formulário, para o ecrã "Confirme o pedido".
 */
export function blocosDosPassos(passos: PassoRamo[], valores: Valores, { curto = false } = {}): Bloco[] {
  const blocos = passos
    .map((p) => ({
      titulo: curto ? (p.bloco ?? p.nome) : p.nome,
      passo: p.id,
      linhas: p.campos
        .map((c) => ({ rotulo: curto ? rotuloCurto(c) : c.rotulo, valor: valorLegivel(c, valores, curto) }))
        .filter((l) => l.valor !== ""),
    }))
    .filter((b) => b.linhas.length > 0);
  if (!curto) return blocos;
  return blocos.reduce<Bloco[]>((juntos, b) => {
    const anterior = juntos[juntos.length - 1];
    if (anterior && anterior.titulo === b.titulo) anterior.linhas.push(...b.linhas);
    else juntos.push({ ...b, linhas: [...b.linhas] });
    return juntos;
  }, []);
}

export type Cabecalho = {
  /** Nome do ramo e o essencial do pedido, por ordem (vazios saem). */
  destaques?: (string | undefined)[];
  /** Nível escolhido na página do ramo, para quando o formulário não pergunta o nível. */
  nivel?: string | null;
};

/**
 * A mensagem do lead, em texto simples que se lê sozinho e que o CRM interpreta:
 * uma linha de resumo ("Automóvel · BT-84-HL · Essencial"), depois os blocos
 * "[Título]" com "Rótulo: valor", separados por uma linha em branco, e por fim a
 * mensagem livre. Se passar do limite, corta-se a mensagem livre: as respostas
 * do ramo são o que a BV precisa para pedir propostas.
 */
export function montarMensagem(blocos: Bloco[], livre: string, { destaques = [], nivel }: Cabecalho = {}): string {
  const comNivel = [...blocos];
  const temNivel = blocos.some((b) => b.linhas.some((l) => l.rotulo === "Nível"));
  if (nivel && !temNivel) {
    const antesDoFim = comNivel.length && comNivel[comNivel.length - 1].titulo === "Quem pede" ? comNivel.length - 1 : comNivel.length;
    comNivel.splice(antesDoFim, 0, { titulo: "Proteção", linhas: [{ rotulo: "Nível", valor: nivel }] });
  }

  const resumo = [...destaques, temNivel ? undefined : (nivel ?? undefined)]
    .filter((d): d is string => Boolean(d?.trim()))
    .filter((d, i, todos) => todos.indexOf(d) === i)
    .join(" · ");
  const partes = [
    ...(resumo ? [resumo] : []),
    ...comNivel.map((b) => [`[${b.titulo}]`, ...b.linhas.map((l) => `${l.rotulo}: ${l.valor}`)].join("\n")),
  ];
  const detalhes = partes.join("\n\n");
  const texto = livre.trim();
  if (!texto) return detalhes.slice(0, MAX_MENSAGEM);
  if (!detalhes) return texto.slice(0, MAX_MENSAGEM);

  const prefixo = `${detalhes}\n\nMensagem:\n`;
  const espaco = MAX_MENSAGEM - prefixo.length;
  if (espaco <= 0) return detalhes.slice(0, MAX_MENSAGEM);
  return prefixo + (texto.length > espaco ? `${texto.slice(0, espaco - 1)}…` : texto);
}
