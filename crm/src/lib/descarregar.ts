import { escreverCsv } from '@/lib/csv'

// Gera o ficheiro no browser (sem ir ao servidor) e oferece-o para guardar.
export function descarregarCsv(nomeFicheiro: string, linhas: string[][]) {
  const blob = new Blob([escreverCsv(linhas)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeFicheiro
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
