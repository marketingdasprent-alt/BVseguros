const moeda = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' })

export function formatarMoeda(valor: number): string {
  return moeda.format(valor)
}

export function formatarData(data: string): string {
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}
