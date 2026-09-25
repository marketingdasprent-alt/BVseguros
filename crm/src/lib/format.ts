const moeda = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' })

export function formatarMoeda(valor: number): string {
  return moeda.format(valor)
}

export function formatarData(data: string): string {
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

const hora = new Intl.DateTimeFormat('pt-PT', { hour: '2-digit', minute: '2-digit' })
const dataHora = new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short', timeStyle: 'short' })

// "Hoje, 05:49" / "Ontem, 18:02" / "20/09/26, 10:00", na hora local de quem vê.
export function formatarDataRelativa(iso: string, agora: Date = new Date()): string {
  const data = new Date(iso)
  const inicioDoDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const dias = Math.round((inicioDoDia(agora) - inicioDoDia(data)) / 86_400_000)
  if (dias === 0) return `Hoje, ${hora.format(data)}`
  if (dias === 1) return `Ontem, ${hora.format(data)}`
  return dataHora.format(data)
}

// Data local em "aaaa-mm-dd". toISOString() dava a data UTC: entre a meia-noite e a
// 01:00 em Portugal (verão) o "hoje" ainda era ontem.
export function dataLocalIso(data: Date = new Date()): string {
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${data.getFullYear()}-${mes}-${dia}`
}

export function somarDias(data: Date, dias: number): Date {
  const resultado = new Date(data)
  resultado.setDate(resultado.getDate() + dias)
  return resultado
}
