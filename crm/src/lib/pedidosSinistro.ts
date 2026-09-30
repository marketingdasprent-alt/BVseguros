import { normalizar } from '@/lib/pesquisa'
import type { Apolice, Cliente, PedidoSinistro } from '@/lib/types'

// Rótulos das respostas próprias de cada ramo, tal como o site as pergunta
// (src/data/formulariosSinistro.ts na raiz do repositório).
export const ROTULOS_DETALHES: Record<string, string> = {
  matricula: 'Matrícula',
  outro_veiculo: 'Outro veículo envolvido',
  declaracao_amigavel: 'Declaração Amigável preenchida',
  feridos: 'Houve feridos',
  autoridades: 'Autoridades no local',
  tipo_dano: 'Tipo de dano',
  queixa: 'Queixa às autoridades',
  habitavel: 'A casa está habitável',
  tipo_pedido: 'Tipo de pedido',
  empresa: 'Empresa',
  onde_ocorreu: 'Onde ocorreu',
  assistido: 'O trabalhador já foi assistido',
  relacao: 'Relação com a pessoa segura',
  tipo_seguro: 'Tipo de seguro',
}

// Uma chave nova do site aparece legível mesmo antes de ter rótulo aqui.
export function rotuloDetalhe(chave: string): string {
  if (ROTULOS_DETALHES[chave]) return ROTULOS_DETALHES[chave]
  const texto = chave.replace(/_/g, ' ')
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

const soDigitos = (t: string | null | undefined) => (t ?? '').replace(/\D/g, '').replace(/^351(?=\d{9}$)/, '')
const numeroApolice = (t: string | null | undefined) => normalizar(t ?? '').replace(/[\s.-]/g, '')

export interface ClienteSugerido {
  cliente: Cliente
  motivos: string[]
}

// Clientes que podem ser quem fez o pedido: mesmo nº de apólice, email ou telefone.
// Ordem: mais motivos primeiro (nº de apólice conta mais do que um contacto).
export function sugerirClientes(pedido: PedidoSinistro, clientes: Cliente[], apolices: Apolice[]): ClienteSugerido[] {
  const email = normalizar(pedido.email)
  const telefone = soDigitos(pedido.telefone)
  const apolice = numeroApolice(pedido.numero_apolice)
  const donosDaApolice = new Set(apolice ? apolices.filter((a) => numeroApolice(a.numero_apolice) === apolice).map((a) => a.cliente_id) : [])

  return clientes
    .map((cliente) => {
      const motivos: string[] = []
      if (donosDaApolice.has(cliente.id)) motivos.push('nº de apólice')
      if (email && normalizar(cliente.email ?? '') === email) motivos.push('email')
      if (telefone && soDigitos(cliente.telefone) === telefone) motivos.push('telefone')
      return { cliente, motivos }
    })
    .filter((s) => s.motivos.length > 0)
    .sort((a, b) => Number(b.motivos.includes('nº de apólice')) - Number(a.motivos.includes('nº de apólice')) || b.motivos.length - a.motivos.length)
}

// Apólice a pré-selecionar entre as do cliente: a do nº indicado, senão a única do mesmo ramo.
export function apoliceSugerida(pedido: PedidoSinistro, apolicesDoCliente: Apolice[]): Apolice | null {
  const numero = numeroApolice(pedido.numero_apolice)
  const porNumero = numero ? apolicesDoCliente.find((a) => numeroApolice(a.numero_apolice) === numero) : undefined
  if (porNumero) return porNumero
  const mesmoRamo = apolicesDoCliente.filter((a) => a.ramo === pedido.ramo)
  return mesmoRamo.length === 1 ? mesmoRamo[0] : null
}
