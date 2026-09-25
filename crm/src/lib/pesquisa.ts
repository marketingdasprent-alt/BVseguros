// Sem maiúsculas nem acentos: "joao" encontra "João", "apolice" encontra "Apólice".
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

// Todas as palavras do termo têm de aparecer em algum dos campos (ordem livre).
export function corresponde(campos: (string | null | undefined)[], termo: string): boolean {
  const palavras = normalizar(termo).split(/\s+/).filter(Boolean)
  if (palavras.length === 0) return true
  const texto = normalizar(campos.filter(Boolean).join(' '))
  return palavras.every((p) => texto.includes(p))
}
