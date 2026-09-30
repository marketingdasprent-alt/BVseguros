// Testes de api/pedido.ts com o Turnstile e o Supabase simulados: `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHandler, cifrarIp, ipDoPedido } from "../api/pedido.ts";

const ENV = {
  SUPABASE_URL: "https://exemplo.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "chave-servico",
  TURNSTILE_SECRET_KEY: "segredo-turnstile",
  IP_HASH_SEGREDO: "segredo-ip",
};

const LEAD = { p_nome: "Ana Silva", p_email: "ana@exemplo.pt", p_telefone: "+351912345678", p_ramo: "auto", p_mensagem: "", p_consentimento: true };

// Resposta falsa ao estilo da Vercel: guarda o código e o JSON.
function resposta() {
  const r = { codigo: 0, dados: null, cabecalhos: {} };
  r.status = (c) => { r.codigo = c; return r; };
  r.json = (d) => { r.dados = d; };
  r.setHeader = (n, v) => { r.cabecalhos[n] = v; };
  return r;
}

// fetch falso: Turnstile responde `turnstile`; Supabase responde `supabase`. Regista as chamadas.
function falsoFetch({ turnstile = { success: true }, supabase = { status: 204, corpo: "" } } = {}) {
  const chamadas = [];
  const impl = async (url, opcoes) => {
    chamadas.push({ url: String(url), opcoes });
    if (String(url).includes("turnstile")) return new Response(JSON.stringify(turnstile), { status: 200 });
    return new Response(supabase.status === 204 ? null : supabase.corpo, { status: supabase.status });
  };
  return { impl, chamadas };
}

const pedido = (body, headers = { "x-real-ip": "203.0.113.7" }) => ({ method: "POST", headers, body });

test("pedido válido: confirma o Turnstile, cifra o IP e chama a função certa com a service_role", async () => {
  const f = falsoFetch();
  const r = resposta();
  await createHandler({ env: ENV, fetchImpl: f.impl })(pedido({ tipo: "lead", token: "tok", parametros: { ...LEAD, p_ip_hash: "forjado", extra: "x" } }), r);
  assert.equal(r.codigo, 200);
  assert.equal(f.chamadas.length, 2);
  const turnstile = new URLSearchParams(f.chamadas[0].opcoes.body.toString());
  assert.equal(turnstile.get("secret"), "segredo-turnstile");
  assert.equal(turnstile.get("remoteip"), "203.0.113.7");
  assert.equal(f.chamadas[1].url, "https://exemplo.supabase.co/rest/v1/rpc/criar_lead_site");
  assert.equal(f.chamadas[1].opcoes.headers.Authorization, "Bearer chave-servico");
  const enviado = JSON.parse(f.chamadas[1].opcoes.body);
  assert.equal(enviado.p_ip_hash, cifrarIp("203.0.113.7", "segredo-ip"), "o p_ip_hash do browser é ignorado");
  assert.match(enviado.p_ip_hash, /^[0-9a-f]{64}$/);
  assert.equal("extra" in enviado, false, "campos não previstos não passam");
  assert.equal(JSON.stringify(enviado).includes("203.0.113.7"), false, "o IP em claro não vai para a base de dados");
});

test("sem Turnstile válido, nada chega ao Supabase", async () => {
  for (const [body, turnstile] of [
    [{ tipo: "lead", parametros: LEAD }, { success: true }],
    [{ tipo: "lead", token: "tok", parametros: LEAD }, { success: false, "error-codes": ["invalid-input-response"] }],
  ]) {
    const f = falsoFetch({ turnstile });
    const r = resposta();
    await createHandler({ env: ENV, fetchImpl: f.impl })(pedido(body), r);
    assert.equal(r.codigo, 403);
    assert.deepEqual(r.dados, { erro: "verificacao_falhou" });
    assert.equal(f.chamadas.some((c) => c.url.includes("supabase")), false);
  }
});

test("limite por IP e dados inválidos voltam com o motivo para o site explicar", async () => {
  for (const [mensagem, codigo, erro] of [["limite_excedido", 429, "limite_excedido"], ["dados_invalidos", 400, "dados_invalidos"], ["consentimento_em_falta", 400, "dados_invalidos"]]) {
    const f = falsoFetch({ supabase: { status: 400, corpo: JSON.stringify({ message: mensagem }) } });
    const r = resposta();
    await createHandler({ env: ENV, fetchImpl: f.impl })(pedido({ tipo: "lead", token: "tok", parametros: LEAD }), r);
    assert.equal(r.codigo, codigo);
    assert.deepEqual(r.dados, { erro });
  }
});

test("erro técnico do Supabase não passa para o visitante", async () => {
  const f = falsoFetch({ supabase: { status: 500, corpo: JSON.stringify({ message: "relation leads does not exist" }) } });
  const r = resposta();
  const erros = console.error;
  console.error = () => {};
  try {
    await createHandler({ env: ENV, fetchImpl: f.impl })(pedido({ tipo: "lead", token: "tok", parametros: LEAD }), r);
  } finally {
    console.error = erros;
  }
  assert.equal(r.codigo, 502);
  assert.deepEqual(r.dados, { erro: "falha_envio" });
});

test("SUPABASE_URL errado (página HTML ou redirecionamento) não conta como enviado", async () => {
  const casos = [
    new Response("<!doctype html><title>Supabase</title>", { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }),
    new Response(null, { status: 307, headers: { location: "https://supabase.com/dashboard/sign-in" } }),
  ];
  for (const falsa of casos) {
    const chamadas = [];
    const impl = async (url, opcoes) => {
      chamadas.push({ url: String(url), opcoes });
      return String(url).includes("turnstile") ? new Response(JSON.stringify({ success: true }), { status: 200 }) : falsa;
    };
    const r = resposta();
    const erros = console.error;
    console.error = () => {};
    try {
      await createHandler({ env: { ...ENV, SUPABASE_URL: "https://supabase.com/dashboard/project/x" }, fetchImpl: impl })(pedido({ tipo: "lead", token: "tok", parametros: LEAD }), r);
    } finally {
      console.error = erros;
    }
    assert.equal(r.codigo, 502);
    assert.deepEqual(r.dados, { erro: "falha_envio" });
    assert.equal(chamadas[1].opcoes.redirect, "manual", "não segue redirecionamentos");
  }
});

test("recusa método, tipo e corpo inválidos, e falta de configuração", async () => {
  const f = falsoFetch();
  const h = createHandler({ env: ENV, fetchImpl: f.impl });
  let r = resposta();
  await h({ method: "GET", headers: {} }, r);
  assert.equal(r.codigo, 405);
  r = resposta();
  await h(pedido({ tipo: "apagar_tudo", token: "tok", parametros: {} }), r);
  assert.equal(r.codigo, 400);
  r = resposta();
  await h(pedido("{isto não é json"), r);
  assert.equal(r.codigo, 400);
  r = resposta();
  await h(pedido({ tipo: "lead", token: "tok", parametros: { p_mensagem: "x".repeat(30_000) } }), r);
  assert.equal(r.codigo, 413);
  r = resposta();
  await h(pedido({ tipo: "lead", token: "tok", parametros: LEAD }, {}), r);
  assert.equal(r.codigo, 400, "sem IP");
  r = resposta();
  const erros = console.error;
  console.error = () => {};
  try {
    await createHandler({ env: {}, fetchImpl: f.impl })(pedido({ tipo: "lead", token: "tok", parametros: LEAD }), r);
  } finally {
    console.error = erros;
  }
  assert.equal(r.codigo, 503);
  assert.equal(f.chamadas.length, 0);
});

test("IP: x-real-ip primeiro, senão o primeiro do x-forwarded-for", () => {
  assert.equal(ipDoPedido({ "x-real-ip": "1.1.1.1", "x-forwarded-for": "2.2.2.2" }), "1.1.1.1");
  assert.equal(ipDoPedido({ "x-forwarded-for": "2.2.2.2, 10.0.0.1" }), "2.2.2.2");
  assert.equal(ipDoPedido({}), "");
  assert.notEqual(cifrarIp("1.1.1.1", "a"), cifrarIp("1.1.1.1", "b"), "outro segredo, outro código");
});
