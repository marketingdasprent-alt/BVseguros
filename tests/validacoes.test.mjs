// Testes das validações dos formulários: `npm test` (node --test, sem dependências;
// o Node 24 lê o .ts diretamente).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  nifValido, nifDeEmpresa, validarNif, validarTelefone, normalizarTelefone, validarEmail, validarNome,
  formatarCodigoPostal, validarCodigoPostal, formatarMatricula, validarMatricula, idade,
  validarNascimentoCondutor, validarIdades, validarCartaVsNascimento,
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
