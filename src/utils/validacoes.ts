/**
 * Validações dos formulários do site, feitas no browser antes de enviar.
 * Cada função devolve a mensagem de erro para o visitante, ou null se o
 * valor serve. Campo vazio é sempre válido aqui: o "obrigatório" fica com
 * o atributo required. As funções no Supabase voltam a validar o essencial.
 */

export type Validador = (valor: string) => string | null;

const soDigitos = (v: string) => v.replace(/\D/g, "");

// ---------------------------------------------------------------- NIF

/**
 * NIF/NIPC português: 9 dígitos, primeiro dígito (ou os dois primeiros)
 * de uma série atribuída, e dígito de controlo módulo 11.
 */
export function nifValido(nif: string): boolean {
  if (!/^([1235689]\d{8}|(45|7[0-9])\d{7})$/.test(nif)) return false;
  const soma = [...nif.slice(0, 8)].reduce((s, d, i) => s + Number(d) * (9 - i), 0);
  const resto = soma % 11;
  return (resto < 2 ? 0 : 11 - resto) === Number(nif[8]);
}

/** 1, 2, 3 e 45: pessoa singular. O resto (5, 6, 7x, 8, 9): empresa, entidade pública ou outra. */
export function nifDeEmpresa(nif: string): boolean {
  return nifValido(nif) && !/^([123]|45)/.test(nif);
}

export const validarNif: Validador = (valor) => {
  const nif = soDigitos(valor);
  if (!nif) return null;
  if (nif.length !== 9) return "O NIF tem 9 dígitos.";
  if (!nifValido(nif)) return "Este NIF não é válido. Confirme os dígitos.";
  return null;
};

// ---------------------------------------------------------------- Contactos

/**
 * Portugal: 9 dígitos a começar por 2 (fixo), 3 (VoIP) ou 9 (móvel), com ou
 * sem +351/00351. Outro país: indicativo com + e 8 a 15 dígitos no total.
 */
export function normalizarTelefone(valor: string): string {
  return valor.replace(/[\s().-]/g, "").replace(/^00/, "+");
}

export const validarTelefone: Validador = (valor) => {
  const t = normalizarTelefone(valor);
  if (!t) return null;
  if (!/^\+?\d+$/.test(t)) return "Use só dígitos, espaços e o + do indicativo.";
  const nacional = t.replace(/^\+351/, "");
  if (!t.startsWith("+") || t.startsWith("+351")) {
    if (nacional.length !== 9) return "Um número português tem 9 dígitos.";
    if (!/^[239]/.test(nacional)) return "Um número português começa por 2, 3 ou 9.";
    return null;
  }
  const digitos = t.length - 1;
  return digitos >= 8 && digitos <= 15 ? null : "Confirme o número e o indicativo do país.";
};

// Igual à regra de criar_lead_site, mais um domínio com pelo menos 2 letras no fim.
export const validarEmail: Validador = (valor) => {
  const e = valor.trim();
  if (!e) return null;
  if (e.length > 254 || !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(e)) return "Confirme o email (ex.: nome@exemplo.pt).";
  if (/\.\.|@\.|\.@/.test(e)) return "Confirme o email: há pontos seguidos ou fora do sítio.";
  return null;
};

export const validarNome: Validador = (valor) => {
  const n = valor.trim();
  if (!n) return null;
  if ((n.match(/\p{L}/gu) ?? []).length < 2) return "Indique o nome com letras.";
  if (/\d/.test(n)) return "O nome não leva números.";
  return null;
};

// ---------------------------------------------------------------- Código postal

/** Aceita "1000001" ou "1000 001" e devolve "1000-001"; o resto fica como está. */
export function formatarCodigoPostal(valor: string): string {
  const d = soDigitos(valor);
  return d.length === 7 ? `${d.slice(0, 4)}-${d.slice(4)}` : valor.trim();
}

export const validarCodigoPostal: Validador = (valor) => {
  const cp = formatarCodigoPostal(valor);
  if (!cp) return null;
  return /^[1-9]\d{3}-\d{3}$/.test(cp) ? null : "O código postal tem o formato 0000-000.";
};

// ---------------------------------------------------------------- Matrícula

// Os quatro formatos portugueses, por ordem de época: AA-00-00, 00-00-AA, 00-AA-00, AA-00-AA.
const FORMATOS_MATRICULA = [/^[A-Z]{2}\d{4}$/, /^\d{4}[A-Z]{2}$/, /^\d{2}[A-Z]{2}\d{2}$/, /^[A-Z]{2}\d{2}[A-Z]{2}$/];

/** "aa00aa", "AA 00 AA" ou "AA.00.AA" passam a "AA-00-AA"; o que não for matrícula fica igual. */
export function formatarMatricula(valor: string): string {
  const m = valor.toUpperCase().replace(/[\s.-]/g, "");
  if (!FORMATOS_MATRICULA.some((f) => f.test(m))) return valor.trim();
  return `${m.slice(0, 2)}-${m.slice(2, 4)}-${m.slice(4)}`;
}

export const validarMatricula: Validador = (valor) => {
  const m = valor.toUpperCase().replace(/[\s.-]/g, "");
  if (!m) return null;
  return FORMATOS_MATRICULA.some((f) => f.test(m)) ? null : "Confirme a matrícula (ex.: AA-00-AA ou 00-AA-00).";
};

// ---------------------------------------------------------------- Datas e idades

/** Idade em anos completos numa data (aaaa-mm-dd, como devolve o input type="date"). */
export function idade(nascimento: string, hoje = new Date()): number | null {
  const [a, m, d] = nascimento.split("-").map(Number);
  if (!a || !m || !d) return null;
  let anos = hoje.getFullYear() - a;
  if (hoje.getMonth() + 1 < m || (hoje.getMonth() + 1 === m && hoje.getDate() < d)) anos -= 1;
  return anos;
}

export const validarNascimentoCondutor: Validador = (valor) => {
  if (!valor) return null;
  const anos = idade(valor);
  if (anos === null) return "Confirme a data.";
  if (anos < 17) return "O condutor habitual tem de ter pelo menos 17 anos.";
  if (anos > 100) return "Confirme o ano de nascimento.";
  return null;
};

/** "38, 36" ou "40 38 9": cada idade entre 0 e 120. */
export const validarIdades: Validador = (valor) => {
  const t = valor.trim();
  if (!t) return null;
  const partes = t.split(/[\s,;e]+/).filter(Boolean);
  if (!partes.every((p) => /^\d{1,3}$/.test(p) && Number(p) <= 120)) return "Escreva só as idades, separadas por vírgulas (ex.: 38, 36).";
  return null;
};

// ---------------------------------------------------------------- Entre campos

/** A carta B tira-se a partir dos 17 anos (condução acompanhada): antes disso, não bate certo. */
export function validarCartaVsNascimento(anoCarta: string, nascimento: string): string | null {
  const ano = Number(anoCarta);
  const anoNascimento = Number(nascimento.slice(0, 4));
  if (!ano || !anoNascimento) return null;
  return ano - anoNascimento < 17 ? "O ano da carta não bate com a data de nascimento do condutor." : null;
}
