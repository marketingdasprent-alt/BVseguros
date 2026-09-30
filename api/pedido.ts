import { createHash } from "node:crypto";

/**
 * Função da Vercel por onde passam os formulários do site (pedido de proposta e de
 * sinistro). Confirma o Cloudflare Turnstile, cifra o IP para o limite de pedidos e só
 * então chama a função do Supabase com a service_role, que o browser nunca vê.
 * As funções do Supabase deixaram de aceitar a anon key (migração 2026-09-30_formularios_site.sql).
 */

type Cabecalhos = Record<string, string | string[] | undefined>;
export type Pedido = { method?: string; headers: Cabecalhos; body?: unknown };
export type Resposta = {
  status(codigo: number): Resposta;
  json(dados: unknown): void;
  setHeader(nome: string, valor: string): void;
};
type Env = Record<string, string | undefined>;

// O que o browser pode mandar para cada função. O resto é ignorado (nunca o p_ip_hash).
const FUNCOES = {
  lead: {
    nome: "criar_lead_site",
    parametros: ["p_nome", "p_email", "p_telefone", "p_ramo", "p_mensagem", "p_consentimento"],
  },
  sinistro: {
    nome: "criar_pedido_sinistro_site",
    parametros: [
      "p_nome", "p_email", "p_telefone", "p_ramo", "p_numero_apolice", "p_seguradora",
      "p_data_ocorrencia", "p_local", "p_descricao", "p_detalhes", "p_consentimento",
    ],
  },
} as const;

type Tipo = keyof typeof FUNCOES;

// Motivos que as funções do Supabase devolvem e que o site sabe explicar ao visitante.
const MOTIVOS = new Set(["dados_invalidos", "limite_excedido", "consentimento_em_falta"]);
const TAMANHO_MAXIMO = 20_000;

const primeiro = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Na Vercel, x-real-ip e x-forwarded-for são escritos pela plataforma, não pelo visitante. */
export function ipDoPedido(headers: Cabecalhos): string {
  return primeiro(headers["x-real-ip"]).trim() || primeiro(headers["x-forwarded-for"]).split(",")[0].trim();
}

/** sha256 com segredo: dá para contar pedidos do mesmo IP sem guardar o IP. */
export function cifrarIp(ip: string, segredo: string): string {
  return createHash("sha256").update(`${segredo}:${ip}`).digest("hex");
}

export function createHandler({ env = process.env as Env, fetchImpl = fetch }: { env?: Env; fetchImpl?: typeof fetch } = {}) {
  return async function handler(req: Pedido, res: Resposta) {
    res.setHeader("Cache-Control", "no-store");
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ erro: "falha_envio" });
    }

    const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
    const chave = env.SUPABASE_SERVICE_ROLE_KEY;
    const segredoTurnstile = env.TURNSTILE_SECRET_KEY;
    const segredoIp = env.IP_HASH_SEGREDO;
    if (!url || !chave || !segredoTurnstile || !segredoIp) {
      console.error("api/pedido: falta configuração (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TURNSTILE_SECRET_KEY ou IP_HASH_SEGREDO).");
      return res.status(503).json({ erro: "falha_envio" });
    }

    let corpo: { tipo?: unknown; token?: unknown; parametros?: unknown };
    try {
      const bruto = typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {});
      if (bruto.length > TAMANHO_MAXIMO) return res.status(413).json({ erro: "dados_invalidos" });
      corpo = JSON.parse(bruto);
    } catch {
      return res.status(400).json({ erro: "dados_invalidos" });
    }

    const tipo = corpo?.tipo;
    if (tipo !== "lead" && tipo !== "sinistro") return res.status(400).json({ erro: "dados_invalidos" });
    const token = corpo.token;
    if (typeof token !== "string" || !token || token.length > 2048) return res.status(403).json({ erro: "verificacao_falhou" });
    const recebidos = corpo.parametros;
    if (typeof recebidos !== "object" || recebidos === null || Array.isArray(recebidos)) {
      return res.status(400).json({ erro: "dados_invalidos" });
    }

    const ip = ipDoPedido(req.headers);
    if (!ip) return res.status(400).json({ erro: "dados_invalidos" });

    // 1. Turnstile: sem esta confirmação no servidor, o widget no browser não protege nada.
    const verificacao = await fetchImpl("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: segredoTurnstile, response: token, remoteip: ip }),
    })
      .then((r) => r.json() as Promise<{ success?: boolean }>)
      .catch(() => null);
    if (!verificacao) return res.status(502).json({ erro: "falha_envio" });
    if (verificacao.success !== true) return res.status(403).json({ erro: "verificacao_falhou" });

    // 2. Só os parâmetros previstos, mais o IP cifrado para o limite por IP.
    const funcao = FUNCOES[tipo as Tipo];
    const parametros: Record<string, unknown> = Object.fromEntries(
      funcao.parametros.map((p) => [p, (recebidos as Record<string, unknown>)[p] ?? null])
    );
    parametros.p_ip_hash = cifrarIp(ip, segredoIp);

    const resposta = await fetchImpl(`${url.replace(/\/$/, "")}/rest/v1/rpc/${funcao.nome}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: chave, Authorization: `Bearer ${chave}` },
      body: JSON.stringify(parametros),
    }).catch(() => null);
    if (!resposta) return res.status(502).json({ erro: "falha_envio" });
    if (resposta.ok) return res.status(200).json({ ok: true });

    const erro = (await resposta.json().catch(() => null)) as { message?: string } | null;
    const motivo = erro?.message && MOTIVOS.has(erro.message) ? erro.message : null;
    if (!motivo) {
      console.error(`api/pedido: ${funcao.nome} respondeu ${resposta.status}.`);
      return res.status(502).json({ erro: "falha_envio" });
    }
    return res.status(motivo === "limite_excedido" ? 429 : 400).json({ erro: motivo === "consentimento_em_falta" ? "dados_invalidos" : motivo });
  };
}

export default createHandler();
