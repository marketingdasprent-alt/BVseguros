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

/** NIPC: tem de ser de empresa (acidentes de trabalho com trabalhadores). */
export const validarNipc: Validador = (valor) => {
  const nif = soDigitos(valor);
  if (!nif) return null;
  if (nif.length !== 9) return "O NIPC tem 9 dígitos.";
  if (!nifValido(nif)) return "Este NIPC não é válido. Confirme os dígitos.";
  return nifDeEmpresa(nif) ? null : "Indique o NIPC da empresa, não um NIF de pessoa.";
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
  // 9 a 15 dígitos com o indicativo: o mesmo limite de criar_lead_site.
  const digitos = t.length - 1;
  return digitos >= 9 && digitos <= 15 ? null : "Confirme o número e o indicativo do país.";
};

// Itália, São Marino, Vaticano e Costa do Marfim mantêm o 0 depois do indicativo.
const MANTEM_ZERO = new Set(["39", "378", "379", "225"]);

/** Só os dígitos do número nacional, sem o 0 de chamada interna ("020 7946 0958" no Reino Unido dá "2079460958"). */
export function digitosNacionais(indicativo: string, nacional: string): string {
  const d = soDigitos(nacional);
  return MANTEM_ZERO.has(indicativo) ? d : d.replace(/^0+/, "");
}

/** Número escrito ao lado de um indicativo escolhido à parte (ex.: "351" e "912 345 678"). */
export function validarTelefoneComIndicativo(indicativo: string, nacional: string): string | null {
  const t = normalizarTelefone(nacional);
  if (!t) return null;
  if (!/^\d+$/.test(t)) return "Use só dígitos e espaços.";
  if (indicativo === "351") return validarTelefone(t);
  const total = indicativo.length + digitosNacionais(indicativo, t).length;
  if (total < 9) return "O número parece curto para este país. Confirme os dígitos.";
  if (total > 15) return "O número parece longo para este país. Confirme os dígitos.";
  return null;
}

/** Arruma o número ao sair do campo: Portugal em 3 3 3; os outros sem o 0 inicial e com os espaços de quem escreveu. */
export function formatarNacional(indicativo: string, nacional: string): string {
  if (indicativo === "351") return formatarTelefone(nacional);
  if (!/^[\d\s().-]+$/.test(nacional)) return nacional.trim();
  const semZeros = MANTEM_ZERO.has(indicativo) ? nacional : nacional.replace(/^[\s0().-]+/, "");
  return semZeros.replace(/[().-]/g, " ").replace(/\s+/g, " ").trim();
}

/** O que segue para o CRM: "+351 912 345 678", "+44 20 7946 0958". Vazio se não há número. */
export function telefoneCompleto(indicativo: string, nacional: string): string {
  const n = formatarNacional(indicativo, nacional);
  return n ? `+${indicativo} ${n}` : "";
}

/** Só para mostrar: "912345678" passa a "912 345 678" e "+351912345678" a "+351 912 345 678". */
export function formatarTelefone(valor: string): string {
  const m = /^(\+351)?([239]\d{8})$/.exec(normalizarTelefone(valor));
  if (!m) return valor.trim();
  const n = m[2];
  const nacional = `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
  return m[1] ? `+351 ${nacional}` : nacional;
}

// Igual à regra de criar_lead_site, mais um domínio com pelo menos 2 letras no fim.
export const validarEmail: Validador = (valor) => {
  const e = valor.trim();
  if (!e) return null;
  if (e.length > 254 || !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(e)) return "Confirme o email (ex.: nome@exemplo.pt).";
  if (/\.\.|@\.|\.@/.test(e)) return "Confirme o email: há pontos seguidos ou fora do sítio.";
  return null;
};

const DOMINIOS_COMUNS = [
  "gmail.com", "hotmail.com", "outlook.com", "outlook.pt", "sapo.pt",
  "yahoo.com", "icloud.com", "live.com.pt", "msn.com",
];

/** Distância de edição 1: uma letra trocada, a mais ou a menos, ou duas vizinhas trocadas. */
function aUmaLetra(a: string, b: string): boolean {
  if (a === b || Math.abs(a.length - b.length) > 1) return false;
  if (a.length === b.length) {
    const dif = [...a].map((c, i) => (c === b[i] ? -1 : i)).filter((i) => i >= 0);
    if (dif.length === 1) return true;
    return dif.length === 2 && dif[1] === dif[0] + 1 && a[dif[0]] === b[dif[1]] && a[dif[1]] === b[dif[0]];
  }
  const [curta, longa] = a.length < b.length ? [a, b] : [b, a];
  for (let i = 0; i < longa.length; i++) {
    if (longa.slice(0, i) + longa.slice(i + 1) === curta) return true;
  }
  return false;
}

/** "nome@gmial.com" devolve "nome@gmail.com"; se o domínio não parecer engano, null. */
export function sugestaoEmail(valor: string): string | null {
  const e = valor.trim();
  const arroba = e.lastIndexOf("@");
  if (arroba < 1) return null;
  const dominio = e.slice(arroba + 1).toLowerCase();
  if (DOMINIOS_COMUNS.includes(dominio)) return null;
  const certo = DOMINIOS_COMUNS.find((d) => aUmaLetra(dominio, d));
  return certo ? `${e.slice(0, arroba)}@${certo}` : null;
}

export const validarNome: Validador = (valor) => {
  const n = valor.trim();
  if (!n) return null;
  if ((n.match(/\p{L}/gu) ?? []).length < 2) return "Indique o nome com letras.";
  if (/\d/.test(n)) return "Escreva o nome sem números.";
  return null;
};

// ---------------------------------------------------------------- Código postal

/** Aceita "1000001" ou "1000 001" e devolve "1000-001"; o resto fica como está. */
export function formatarCodigoPostal(valor: string): string {
  const d = soDigitos(valor);
  return d.length === 7 ? `${d.slice(0, 4)}-${d.slice(4)}` : valor.trim();
}

/** Enquanto se escreve: só dígitos, e o hífen entra sozinho depois do 4.º ("10000" fica "1000-0"). */
export function mascaraCodigoPostal(valor: string): string {
  const d = soDigitos(valor).slice(0, 7);
  return d.length > 4 ? `${d.slice(0, 4)}-${d.slice(4)}` : d;
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

/** Maiúsculas e só letras e dígitos: "aa-00 aa" fica "AA00AA". */
export function limparMatricula(valor: string): string {
  return valor.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * Reparte o que se cola (ou o preenchimento automático) pelas três caixas
 * da matrícula, sempre a partir da primeira. `sobra` diz se havia mais de 6
 * caracteres, para avisar em vez de cortar em silêncio.
 */
export function repartirMatricula(valor: string): { partes: [string, string, string]; sobra: boolean } {
  const m = limparMatricula(valor);
  return { partes: [m.slice(0, 2), m.slice(2, 4), m.slice(4, 6)], sobra: m.length > 6 };
}

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

/** aaaa-mm-dd de hoje, na hora local (o toISOString daria o dia em UTC). */
export function hojeIso(hoje = new Date()): string {
  const m = String(hoje.getMonth() + 1).padStart(2, "0");
  const d = String(hoje.getDate()).padStart(2, "0");
  return `${hoje.getFullYear()}-${m}-${d}`;
}

/** Para datas (aaaa-mm-dd) e meses (aaaa-mm) que não podem ser depois de hoje. */
export function naoFutura(mensagem: string, hoje = new Date()): Validador {
  return (valor) => (valor && valor > hojeIso(hoje).slice(0, valor.length) ? mensagem : null);
}

/** Dias desde uma data aaaa-mm-dd, ou aaaa-mm (conta a partir do dia 1). */
export function diasDesde(data: string, hoje = new Date()): number | null {
  const [a, m, d = 1] = data.split("-").map(Number);
  if (!a || !m) return null;
  const inicio = Date.UTC(a, m - 1, d);
  const fim = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.floor((fim - inicio) / 86_400_000);
}

/** "38, 36" ou "40 38 9": cada idade entre 0 e 120. */
export const validarIdades: Validador = (valor) => {
  const t = valor.trim();
  if (!t) return null;
  const partes = t.split(/[\s,;e]+/).filter(Boolean);
  if (!partes.every((p) => /^\d{1,3}$/.test(p) && Number(p) <= 120)) return "Escreva só as idades, separadas por vírgulas (ex.: 38, 36).";
  return null;
};

// ---------------------------------------------------------------- Entre campos

/**
 * A carta B tira-se a partir dos 17 anos (condução acompanhada): antes disso,
 * não bate certo. Aceita o ano da carta ("2005") ou a data ("2005-06-01").
 */
export function validarCartaVsNascimento(carta: string, nascimento: string): string | null {
  if (!carta || !nascimento) return null;
  if (/^\d{4}$/.test(carta)) {
    const anoNascimento = Number(nascimento.slice(0, 4));
    if (!anoNascimento) return null;
    return Number(carta) - anoNascimento < 17 ? "O ano da carta não bate com a data de nascimento do condutor." : null;
  }
  const [a, m, d] = carta.split("-").map(Number);
  if (!a || !m || !d) return null;
  const anos = idade(nascimento, new Date(a, m - 1, d));
  if (anos === null) return null;
  return anos < 17 ? "A data da carta não bate com a data de nascimento: a carta tira-se a partir dos 17 anos." : null;
}
