// Mensagem do pedido de proposta que segue para o CRM (src/utils/montarMensagem.ts).
// Os passos aqui são cópias mínimas dos de src/data/formularios.ts (o node --test não
// resolve os imports sem extensão desse ficheiro).
import { test } from "node:test";
import assert from "node:assert/strict";
import { blocosDosPassos, montarMensagem, MAX_MENSAGEM, euros } from "../src/utils/montarMensagem.ts";

const AUTO = [
  { id: "matricula", nome: "A matrícula", bloco: "Veículo", titulo: "", campos: [
    { nome: "matricula", rotulo: "Matrícula", tipo: "matricula", resumoValores: { "Ainda não tem": "Sem matrícula" } },
  ] },
  { id: "veiculo", nome: "O veículo", bloco: "Veículo", titulo: "", campos: [
    { nome: "tipo_veiculo", rotulo: "Tipo de veículo", resumo: "Tipo", tipo: "radio" },
    { nome: "uso", rotulo: "Uso do veículo", resumo: "Uso", tipo: "radio" },
    { nome: "importado", rotulo: "Veículo importado?", resumo: "Importado", tipo: "radio" },
    { nome: "atrelado", rotulo: "Leva atrelado ou reboque (bicicletas, pranchas, animais, mota)?", resumo: "Atrelado ou reboque", tipo: "radio" },
  ] },
  { id: "condutor", nome: "O condutor", bloco: "Condutor habitual", titulo: "", campos: [
    { nome: "nascimento_condutor", rotulo: "Data de nascimento do condutor habitual", resumo: "Data de nascimento", tipo: "data" },
    { nome: "data_carta", rotulo: "Data da carta de condução", resumo: "Carta desde", tipo: "data" },
    { nome: "seguro_em_nome", rotulo: "O seguro fica em nome do condutor habitual?", resumo: "Seguro em nome do condutor", tipo: "radio" },
  ] },
  { id: "protecao", nome: "A proteção", bloco: "Proteção", titulo: "", campos: [
    { nome: "protecao", rotulo: "Nível de proteção", resumo: "Nível", tipo: "cartoes" },
  ] },
];

const VALORES_AUTO = {
  matricula: "BT-84-HL", tipo_veiculo: "Ligeiro", uso: "Particular", importado: "Não", atrelado: "Não",
  nascimento_condutor: "2001-04-04", data_carta: "2020-04-04", seguro_em_nome: "Sim", protecao: "Essencial",
};
const QUEM_PEDE = { titulo: "Quem pede", linhas: [{ rotulo: "NIF", valor: "338437517" }, { rotulo: "Código postal", valor: "2410-232 Pousos, Leiria" }] };

test("automóvel: o pedido da captura de 02/10/2026 no formato novo", () => {
  const blocos = [...blocosDosPassos(AUTO, VALORES_AUTO, { curto: true }), QUEM_PEDE];
  const texto = montarMensagem(blocos, "", { destaques: ["Automóvel", "BT-84-HL", "Essencial"] });
  assert.equal(
    texto,
    [
      "Automóvel · BT-84-HL · Essencial",
      "",
      "[Veículo]",
      "Matrícula: BT-84-HL",
      "Tipo: Ligeiro",
      "Uso: Particular",
      "Importado: Não",
      "Atrelado ou reboque: Não",
      "",
      "[Condutor habitual]",
      "Data de nascimento: 04/04/2001",
      "Carta desde: 04/04/2020",
      "Seguro em nome do condutor: Sim",
      "",
      "[Proteção]",
      "Nível: Essencial",
      "",
      "[Quem pede]",
      "NIF: 338437517",
      "Código postal: 2410-232 Pousos, Leiria",
    ].join("\n")
  );
});

test("o ecrã do site mantém os títulos e rótulos do formulário", () => {
  const blocos = blocosDosPassos(AUTO, VALORES_AUTO);
  assert.deepEqual(blocos.map((b) => b.titulo), ["A matrícula", "O veículo", "O condutor", "A proteção"]);
  assert.equal(blocos[1].linhas[2].rotulo, "Veículo importado?");
});

test("sem rótulo de resumo: a pergunta sem o ? final", () => {
  const passos = [{ id: "p", nome: "P", titulo: "", campos: [{ nome: "x", rotulo: "Já tem seguro de saúde?", tipo: "radio" }] }];
  assert.equal(blocosDosPassos(passos, { x: "Sim" }, { curto: true })[0].linhas[0].rotulo, "Já tem seguro de saúde");
});

test("valores reescritos, euros e área", () => {
  const passos = [{ id: "p", nome: "P", bloco: "Empresa", titulo: "", campos: [
    { nome: "independente", rotulo: "Situação", tipo: "cartoes", resumoValores: { Sim: "Trabalhador independente" } },
    { nome: "massa", rotulo: "Massa salarial anual (€)", resumo: "Massa salarial anual", tipo: "numero" },
    { nome: "area", rotulo: "Área aproximada (m²)", resumo: "Área", tipo: "numero" },
    { nome: "matricula", rotulo: "Matrícula", tipo: "matricula", resumoValores: { "Ainda não tem": "Sem matrícula" } },
  ] }];
  const [bloco] = blocosDosPassos(passos, { independente: "Sim", massa: "180000", area: "120", matricula: "Ainda não tem" }, { curto: true });
  assert.deepEqual(bloco.linhas.map((l) => l.valor), ["Trabalhador independente", euros("180000"), "120 m²", "Sem matrícula"]);
  assert.match(euros("180000"), /^180\s000\s€$/);
});

test("nível da página: entra no bloco Proteção e no resumo quando o formulário não o pergunta", () => {
  const texto = montarMensagem([QUEM_PEDE], "", { destaques: ["Saúde", "2 pessoas"], nivel: "Intermédio" });
  assert.ok(texto.startsWith("Saúde · 2 pessoas · Intermédio\n\n[Proteção]\nNível: Intermédio\n\n[Quem pede]"));
});

test("nível da página não se repete quando o formulário já tem nível", () => {
  const blocos = blocosDosPassos(AUTO, VALORES_AUTO, { curto: true });
  const texto = montarMensagem(blocos, "", { destaques: ["Automóvel", "BT-84-HL", "Essencial"], nivel: "Essencial" });
  assert.equal(texto.match(/Nível:/g).length, 1);
  assert.equal(texto.split("\n")[0], "Automóvel · BT-84-HL · Essencial");
});

test("passa do limite: corta só a mensagem livre", () => {
  const blocos = [...blocosDosPassos(AUTO, VALORES_AUTO, { curto: true }), QUEM_PEDE];
  const texto = montarMensagem(blocos, "x".repeat(5000), { destaques: ["Automóvel"] });
  assert.equal(texto.length, MAX_MENSAGEM);
  assert.ok(texto.includes("[Quem pede]\nNIF: 338437517"));
  assert.ok(texto.endsWith("…"));
});

test("sem respostas do ramo: só a mensagem livre", () => {
  assert.equal(montarMensagem([], "  Quero um seguro de barco.  "), "Quero um seguro de barco.");
});
