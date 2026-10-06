// Escrita de .xlsx no browser (modelo e relatório da importação, exportação RGPD).
// A biblioteca só se descarrega quando é precisa.

export type Folhas = Parameters<typeof import('write-excel-file/browser').default>[0]

export async function guardarXlsx(nome: string, folhas: Folhas) {
  const { default: writeXlsxFile } = await import('write-excel-file/browser')
  await writeXlsxFile(folhas).toFile(nome)
}

export const titulo = (value: string) => ({ value, fontWeight: 'bold' as const })
