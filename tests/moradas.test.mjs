// Testes do cliente da moradas.dev com fetch simulado: `npm test`. Nenhum pedido sai para a rede.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { consultarCodigoPostal, sugerirMoradas, resolverCodigoPostal, descreverLocal } from "../src/utils/moradas.ts";

let pedidos = [];
function simular(resposta) {
  globalThis.fetch = async (url) => {
    pedidos.push(String(url));
    if (resposta instanceof Error) throw resposta;
    const { status = 200, corpo = {} } = resposta;
    return new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } });
  };
}

beforeEach(() => {
  pedidos = [];
});

test("código postal: 200 devolve a localidade e fica em cache", async () => {
  simular({ corpo: { cp7: "1000-098", localidade: "Lisboa", concelho: "Lisboa", distrito: "Lisboa" } });
  const r = await consultarCodigoPostal("1000-098");
  assert.equal(r.estado, "ok");
  assert.equal(descreverLocal(r.local), "Lisboa, Lisboa");
  await consultarCodigoPostal("1000-098");
  assert.equal(pedidos.length, 1, "a segunda vez vem da cache");
});

test("código postal: 404 é inexistente", async () => {
  simular({ status: 404, corpo: { error: "CP7 not found" } });
  assert.deepEqual(await consultarCodigoPostal("9999-999"), { estado: "inexistente" });
});

test("código postal: 429 e falha de rede nunca bloqueiam", async () => {
  simular({ status: 429 });
  assert.deepEqual(await consultarCodigoPostal("4700-001"), { estado: "indisponivel" });
  simular(new TypeError("Failed to fetch"));
  assert.deepEqual(await consultarCodigoPostal("4700-002"), { estado: "indisponivel" });
});

test("código postal: formato errado nem chega a pedir", async () => {
  simular({ corpo: {} });
  assert.deepEqual(await consultarCodigoPostal("4700"), { estado: "inexistente" });
  assert.equal(pedidos.length, 0);
});

test("sugestões: rua com um código, rua com vários e menos de 3 letras", async () => {
  simular({
    corpo: {
      suggestions: [
        { value: "Rua A, Lisboa", data: { art_id: 1, kind: "street", street: "Rua A", localidade: "Lisboa", concelho: "Lisboa", cp7: "1200-008" } },
        { value: "Rua B, Lisboa", data: { art_id: 2, kind: "street", street: "Rua B", localidade: "Lisboa", concelho: "Lisboa", cp7: null, nseg: 2 } },
      ],
    },
  });
  const lista = await sugerirMoradas("rua lisboa");
  assert.equal(lista.length, 2);
  assert.equal(lista[0].cp7, "1200-008");
  assert.equal(lista[1].cp7, null, "vários códigos: falta o número de porta");
  assert.match(pedidos[0], /suggest\?q=rua%20lisboa&count=5/);
  assert.deepEqual(await sugerirMoradas("ru"), []);
  assert.equal(pedidos.length, 1);
});

test("sugestões: erro da API dá lista vazia", async () => {
  simular({ status: 500 });
  assert.deepEqual(await sugerirMoradas("av liberdade"), []);
});

test("resolver pelo número de porta", async () => {
  simular({ corpo: { resolved: { data: { cp7: "1200-007" } }, segments: [] } });
  assert.equal(await resolverCodigoPostal(2, "3"), "1200-007");
  simular({ corpo: { resolved: null, segments: [] } });
  assert.equal(await resolverCodigoPostal(2, "999"), null);
  assert.equal(await resolverCodigoPostal(2, ""), null);
});
