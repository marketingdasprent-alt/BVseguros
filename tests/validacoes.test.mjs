// Testes das validações dos formulários: `npm test` (node --test, sem dependências;
// o Node 24 lê o .ts diretamente).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  nifValido, nifDeEmpresa, validarNif, validarTelefone, normalizarTelefone, validarEmail, validarNome,
  formatarCodigoPostal, validarCodigoPostal, formatarMatricula, validarMatricula, idade,
  validarNascimentoCondutor, validarIdades, validarCartaVsNascimento,
  validarNipc, formatarTelefone, sugestaoEmail, mascaraCodigoPostal, limparMatricula, repartirMatricula,
  naoFutura, diasDesde, hojeIso,
} from "../src/utils/validacoes.ts";

test("NIF: dígito de controlo módulo 11", () => {
  assert.equal(nifValido("123456789"), true);
  assert.equal(nifValido("123456788"), false, "último dígito errado");
  assert.equal(nifValido("500000000"), true, "empresa, resto 0");
  assert.equal(nifValido("111111110"), true);
  assert.equal(nifValido("111111111"), false);
  assert.equal(nifValido("401234567"), false, "série 4 só existe como 45");
  assert.equal(nifValido("12345678"), false, "8 dígitos");
});

test("NIF: singular ou empresa", () => {
  assert.equal(nifDeEmpresa("123456789"), false);
  assert.equal(nifDeEmpresa("500000000"), true);
  assert.equal(nifDeEmpresa("123456788"), false, "inválido nunca é empresa");
});

test("NIF: mensagens", () => {
  assert.equal(validarNif(""), null);
  assert.equal(validarNif("123 456 789"), null, "aceita espaços");
  assert.match(validarNif("1234"), /9 dígitos/);
  assert.match(validarNif("123456788"), /não é válido/);
});

test("telefone", () => {
  assert.equal(validarTelefone("912 345 678"), null);
  assert.equal(validarTelefone("+351 212 345 678"), null);
  assert.equal(validarTelefone("00351912345678"), null);
  assert.equal(validarTelefone("+44 20 7946 0958"), null, "estrangeiro");
  assert.match(validarTelefone("91234567"), /9 dígitos/);
  assert.match(validarTelefone("512345678"), /começa por 2, 3 ou 9/);
  assert.match(validarTelefone("91a345678"), /só dígitos/);
  assert.match(validarTelefone("+1234"), /indicativo/);
  assert.equal(normalizarTelefone("(+351) 91-234.56 78"), "+351912345678");
});

test("email e nome", () => {
  assert.equal(validarEmail("ana@exemplo.pt"), null);
  assert.ok(validarEmail("ana@exemplo"));
  assert.ok(validarEmail("ana@@exemplo.pt"));
  assert.ok(validarEmail("ana..silva@exemplo.pt"));
  assert.equal(validarNome("Ana Maria"), null);
  assert.equal(validarNome("João d'Ávila"), null);
  assert.ok(validarNome("12345"));
  assert.ok(validarNome("Ana 2"));
});

test("código postal", () => {
  assert.equal(formatarCodigoPostal("1000001"), "1000-001");
  assert.equal(formatarCodigoPostal("1000 001"), "1000-001");
  assert.equal(validarCodigoPostal("1000-001"), null);
  assert.equal(validarCodigoPostal("1000001"), null);
  assert.ok(validarCodigoPostal("0100-001"), "não começa por 0");
  assert.ok(validarCodigoPostal("1000"));
});

test("matrícula: os quatro formatos portugueses", () => {
  for (const m of ["AA-00-00", "00-00-AA", "00-AA-00", "AA-00-AA", "aa 00 aa", "12.AB.34"]) {
    assert.equal(validarMatricula(m), null, m);
  }
  assert.equal(formatarMatricula("aa00aa"), "AA-00-AA");
  assert.equal(formatarMatricula("12ab34"), "12-AB-34");
  assert.ok(validarMatricula("AAA-000"));
  assert.ok(validarMatricula("A0-00-00"));
});

test("datas e idades", () => {
  const hoje = new Date(2026, 8, 30);
  assert.equal(idade("2008-09-30", hoje), 18);
  assert.equal(idade("2008-10-01", hoje), 17, "faz anos amanhã");
  assert.ok(validarNascimentoCondutor("2020-01-01"));
  assert.equal(validarNascimentoCondutor("1980-05-10"), null);
  assert.equal(validarIdades("38, 36"), null);
  assert.equal(validarIdades("40 38 9"), null);
  assert.equal(validarIdades("38 e 36"), null);
  assert.ok(validarIdades("trinta"));
  assert.ok(validarIdades("150"));
  assert.ok(validarCartaVsNascimento("1995", "1990-01-01"), "carta aos 5 anos");
  assert.equal(validarCartaVsNascimento("2010", "1990-01-01"), null);
  assert.equal(validarCartaVsNascimento("", "1990-01-01"), null);
});

test("NIPC: só empresa", () => {
  assert.equal(validarNipc("500000000"), null);
  assert.match(validarNipc("123456789"), /não um NIF de pessoa/);
  assert.match(validarNipc("1234"), /NIPC tem 9 dígitos/);
  assert.equal(validarNipc(""), null);
});

test("telefone: formatação para mostrar", () => {
  assert.equal(formatarTelefone("912345678"), "912 345 678");
  assert.equal(formatarTelefone("+351912345678"), "+351 912 345 678");
  assert.equal(formatarTelefone("00351 212345678"), "+351 212 345 678");
  assert.equal(formatarTelefone("+44 20 7946 0958"), "+44 20 7946 0958", "estrangeiro fica como está");
});

test("email: sugestão de domínio", () => {
  assert.equal(sugestaoEmail("ana@gmial.com"), "ana@gmail.com", "letras trocadas");
  assert.equal(sugestaoEmail("ana@gmai.com"), "ana@gmail.com", "letra a menos");
  assert.equal(sugestaoEmail("ana@hotmaill.com"), "ana@hotmail.com", "letra a mais");
  assert.equal(sugestaoEmail("ana@sapo.pr"), "ana@sapo.pt");
  assert.equal(sugestaoEmail("ana@gmail.com"), null, "certo");
  assert.equal(sugestaoEmail("ana@empresa.pt"), null, "domínio desconhecido");
  assert.equal(sugestaoEmail("ana"), null);
});

test("código postal: máscara ao escrever", () => {
  assert.equal(mascaraCodigoPostal("1000"), "1000");
  assert.equal(mascaraCodigoPostal("10000"), "1000-0");
  assert.equal(mascaraCodigoPostal("1000001"), "1000-001");
  assert.equal(mascaraCodigoPostal("1000-0019"), "1000-001", "nunca mais de 7 dígitos");
  assert.equal(mascaraCodigoPostal("1a0b0"), "100");
});

test("matrícula: colar e repartir pelas três caixas", () => {
  for (const colado of ["aa00aa", "AA-00-AA", "aa 00 aa", "AA.00.AA", " aa-00-aa "]) {
    assert.deepEqual(repartirMatricula(colado), { partes: ["AA", "00", "AA"], sobra: false }, colado);
  }
  assert.deepEqual(repartirMatricula("00-aa-00").partes, ["00", "AA", "00"]);
  assert.deepEqual(repartirMatricula("aa0"), { partes: ["AA", "0", ""], sobra: false }, "incompleta");
  assert.deepEqual(repartirMatricula("AA-00-AA-12"), { partes: ["AA", "00", "AA"], sobra: true }, "texto a mais");
  assert.equal(limparMatricula("aa-00 aa"), "AA00AA");
  assert.equal(limparMatricula("aa00aa").length <= 6, true);
});

test("datas: futuro, dias e carta contra nascimento", () => {
  const hoje = new Date(2026, 9, 1);
  assert.equal(hojeIso(hoje), "2026-10-01");
  const naoDepois = naoFutura("futuro", hoje);
  assert.equal(naoDepois("2026-10-01"), null);
  assert.equal(naoDepois("2026-10-02"), "futuro");
  assert.equal(naoDepois(""), null);
  assert.equal(diasDesde("2026-09-21", hoje), 10);
  assert.equal(diasDesde("2026-08-01", hoje), 61);
  assert.ok(validarCartaVsNascimento("2005-06-01", "1990-01-01"), "carta aos 15 anos");
  assert.equal(validarCartaVsNascimento("2007-01-01", "1990-01-01"), null, "carta aos 17");
  assert.ok(validarCartaVsNascimento("2006-12-31", "1990-01-01"), "um dia antes dos 17");
});
