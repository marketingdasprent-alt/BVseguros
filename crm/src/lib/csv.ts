// Leitor de CSV sem dependências. O Excel em PT exporta com ";" e às vezes com BOM;
// campos entre aspas podem ter separadores, quebras de linha e aspas duplicadas ("").
export function detetarSeparador(texto: string): ';' | ',' {
  const primeira = texto.split(/\r?\n/, 1)[0] ?? ''
  let pontoVirgula = 0
  let virgula = 0
  let entreAspas = false
  for (const ch of primeira) {
    if (ch === '"') entreAspas = !entreAspas
    else if (!entreAspas && ch === ';') pontoVirgula++
    else if (!entreAspas && ch === ',') virgula++
  }
  return pontoVirgula >= virgula ? ';' : ','
}

export function lerCsv(conteudo: string): string[][] {
  const texto = conteudo.replace(/^﻿/, '')
  const sep = detetarSeparador(texto)
  const linhas: string[][] = []
  let linha: string[] = []
  let campo = ''
  let entreAspas = false

  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i]
    if (entreAspas) {
      if (ch === '"' && texto[i + 1] === '"') { campo += '"'; i++ }
      else if (ch === '"') entreAspas = false
      else campo += ch
    } else if (ch === '"') entreAspas = true
    else if (ch === sep) { linha.push(campo); campo = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && texto[i + 1] === '\n') i++
      linha.push(campo)
      linhas.push(linha)
      linha = []
      campo = ''
    } else campo += ch
  }
  if (campo !== '' || linha.length > 0) { linha.push(campo); linhas.push(linha) }

  // Linhas totalmente vazias (comuns no fim de ficheiros do Excel) não contam.
  return linhas.filter((l) => l.some((c) => c.trim() !== ''))
}

export function escreverCsv(linhas: string[][]): string {
  const escapar = (v: string) => (/[;"\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  // BOM para o Excel abrir os acentos certos.
  return '﻿' + linhas.map((l) => l.map(escapar).join(';')).join('\r\n') + '\r\n'
}
