import { escreverCsv } from '@/lib/csv'

// Gera o ficheiro no browser (sem ir ao servidor) e oferece-o para guardar.
export function descarregarFicheiro(nomeFicheiro: string, conteudo: BlobPart, tipo: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }))
  const a = document.createElement('a')
  a.href = url
  a.download = nomeFicheiro
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function descarregarCsv(nomeFicheiro: string, linhas: string[][]) {
  descarregarFicheiro(nomeFicheiro, escreverCsv(linhas), 'text/csv;charset=utf-8')
}
