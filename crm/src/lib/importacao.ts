import { lerCsv } from '@/lib/csv'
import { normalizar } from '@/lib/pesquisa'
import { ESTADOS_APOLICE, RAMOS } from '@/lib/types'
import type { EstadoApolice, Ramo } from '@/lib/types'

export type TipoImportacao = 'clientes' | 'apolices'

export interface LinhaCliente {
  nome: string
  telefone: string
  email: string | null
  nif: string | null
  morada: string | null
  responsavel_email: string | null
}

export interface LinhaApolice {
  nif_cliente: string
  numero_apolice: string
  ramo: Ramo
  seguradora: string
  premio_anual: number | null
  data_inicio: string
  data_fim: string | null
  estado: EstadoApolice
}

export interface ErroLinha {
  linha: number
  mensagem: string
}

export interface ResultadoLeitura<T> {
  validas: { linha: number; dados: T }[]
  erros: ErroLinha[]
  total: number
}

// Cabeçalhos dos modelos para descarregar (a ordem é a das colunas).
export const MODELOS: Record<TipoImportacao, { cabecalho: string[]; exemplo: string[] }> = {
  clientes: {
    cabecalho: ['nome', 'telefone', 'email', 'nif', 'morada', 'responsavel_email'],
    exemplo: ['Nome e apelido', '912345678', 'cliente@exemplo.pt', '123456789', 'Rua, nº, código postal, localidade', 'mediador@bvseguros.pt'],
  },
  apolices: {
    cabecalho: ['nif_cliente', 'numero_apolice', 'ramo', 'seguradora', 'premio_anual', 'data_inicio', 'data_fim', 'estado'],
    exemplo: ['123456789', 'AP-0001', 'Automóvel', 'Nome da seguradora', '450,00', '01/01/2026', '31/12/2026', 'Ativa'],
  },
}

// Nomes alternativos que aparecem em exportações de outros sistemas.
const SINONIMOS: Record<string, string> = {
  telemovel: 'telefone', tel: 'telefone', contacto: 'telefone',
  'e-mail': 'email', mail: 'email',
  contribuinte: 'nif', nif_cliente: 'nif_cliente', 'nif do cliente': 'nif_cliente',
  endereco: 'morada',
  responsavel: 'responsavel_email', mediador: 'responsavel_email',
  apolice: 'numero_apolice', 'n apolice': 'numero_apolice', 'numero da apolice': 'numero_apolice', numero: 'numero_apolice',
  companhia: 'seguradora',
  premio: 'premio_anual', 'premio anual': 'premio_anual',
  inicio: 'data_inicio', 'data de inicio': 'data_inicio',
  fim: 'data_fim', 'data de fim': 'data_fim', vencimento: 'data_fim',
}

function chaveCabecalho(c: string): string {
  const n = normalizar(c).replace(/[º°.]/g, '').replace(/\s+/g, ' ').trim()
  return SINONIMOS[n] ?? SINONIMOS[n.replace(/_/g, ' ')] ?? n.replace(/\s+/g, '_')
}

// NIF português: 9 dígitos com dígito de controlo (módulo 11).
export function nifValido(nif: string): boolean {
  if (!/^[1235689]\d{8}$|^(45|7[0-9])\d{7}$/.test(nif)) return false
  const soma = [...nif.slice(0, 8)].reduce((s, d, i) => s + Number(d) * (9 - i), 0)
  const resto = soma % 11
  const controlo = resto < 2 ? 0 : 11 - resto
  return controlo === Number(nif[8])
}

export function limparTelefone(t: string): string {
  return t.replace(/[\s().-]/g, '')
}

// Aceita dd/mm/aaaa, dd-mm-aaaa, dd.mm.aaaa e aaaa-mm-dd; devolve aaaa-mm-dd ou null.
export function lerData(v: string): string | null {
  const t = v.trim()
  let a: number, m: number, d: number
  const pt = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(t)
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t)
  if (pt) [d, m, a] = [Number(pt[1]), Number(pt[2]), Number(pt[3])]
  else if (iso) [a, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])]
  else return null
  const data = new Date(a, m - 1, d)
  if (data.getFullYear() !== a || data.getMonth() !== m - 1 || data.getDate() !== d) return null
  return `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

// "1.234,56", "1234,56", "1234.56", "1 234,56 €" → número; "" → null; inválido → NaN.
export function lerValor(v: string): number | null {
  let t = v.replace(/[€\s]/g, '')
  if (!t) return null
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.')
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '')
  return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : NaN
}

function porRotuloOuValor<T extends string>(lista: { valor: T; rotulo: string }[], v: string): T | null {
  const n = normalizar(v)
  return lista.find((i) => normalizar(i.valor) === n || normalizar(i.rotulo) === n)?.valor ?? null
}

// Primeira linha = cabeçalho. Números de linha como no Excel (cabeçalho = linha 1).
export function lerImportacao(tipo: 'clientes', conteudo: string): ResultadoLeitura<LinhaCliente>
export function lerImportacao(tipo: 'apolices', conteudo: string): ResultadoLeitura<LinhaApolice>
export function lerImportacao(tipo: TipoImportacao, conteudo: string): ResultadoLeitura<LinhaCliente | LinhaApolice> {
  const [cabecalho, ...linhas] = lerCsv(conteudo)
  if (!cabecalho) return { validas: [], erros: [{ linha: 1, mensagem: 'O ficheiro está vazio.' }], total: 0 }

  const colunas = cabecalho.map(chaveCabecalho)
  const obrigatorias = tipo === 'clientes' ? ['nome', 'telefone'] : ['nif_cliente', 'numero_apolice', 'ramo', 'seguradora', 'data_inicio']
  // Num CSV de apólices a coluna pode chamar-se só "nif".
  if (tipo === 'apolices') colunas.forEach((c, i) => { if (c === 'nif' && !colunas.includes('nif_cliente')) colunas[i] = 'nif_cliente' })
  const emFalta = obrigatorias.filter((o) => !colunas.includes(o))
  if (emFalta.length) {
    return { validas: [], erros: [{ linha: 1, mensagem: `Faltam as colunas: ${emFalta.join(', ')}. Use o modelo.` }], total: linhas.length }
  }

  const validas: { linha: number; dados: LinhaCliente | LinhaApolice }[] = []
  const erros: ErroLinha[] = []
  const vistos = new Set<string>()

  linhas.forEach((celulas, i) => {
    const linha = i + 2
    const v = (col: string) => (celulas[colunas.indexOf(col)] ?? '').trim()
    const problemas: string[] = []

    if (tipo === 'clientes') {
      const nif = v('nif').replace(/\s/g, '')
      const telefone = limparTelefone(v('telefone'))
      const email = v('email').toLowerCase()
      if (v('nome').length < 2) problemas.push('nome em falta')
      if (!/^\+?\d{9,15}$/.test(telefone)) problemas.push('telefone inválido')
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) problemas.push('email inválido')
      if (nif && !nifValido(nif)) problemas.push(`NIF ${nif} inválido`)
      if (nif && vistos.has(nif)) problemas.push(`NIF ${nif} repetido no ficheiro`)
      if (problemas.length) return erros.push({ linha, mensagem: problemas.join('; ') })
      if (nif) vistos.add(nif)
      validas.push({ linha, dados: {
        nome: v('nome'), telefone, email: email || null, nif: nif || null, morada: v('morada') || null,
        responsavel_email: v('responsavel_email').toLowerCase() || null,
      } })
      return
    }

    const nif = v('nif_cliente').replace(/\s/g, '')
    const numero = v('numero_apolice')
    const ramo = porRotuloOuValor(RAMOS, v('ramo'))
    const estado = v('estado') ? porRotuloOuValor(ESTADOS_APOLICE, v('estado')) : 'ativa'
    const premio = lerValor(v('premio_anual'))
    const inicio = lerData(v('data_inicio'))
    const fim = v('data_fim') ? lerData(v('data_fim')) : null
    if (!nifValido(nif)) problemas.push(`NIF do cliente ${nif || '(vazio)'} inválido`)
    if (!numero) problemas.push('nº de apólice em falta')
    if (numero && vistos.has(numero)) problemas.push(`apólice ${numero} repetida no ficheiro`)
    if (!ramo) problemas.push(`ramo "${v('ramo')}" desconhecido`)
    if (!v('seguradora')) problemas.push('seguradora em falta')
    if (Number.isNaN(premio) || (premio !== null && premio < 0)) problemas.push(`prémio "${v('premio_anual')}" inválido`)
    if (!inicio) problemas.push(`data de início "${v('data_inicio')}" inválida`)
    if (v('data_fim') && !fim) problemas.push(`data de fim "${v('data_fim')}" inválida`)
    if (inicio && fim && fim < inicio) problemas.push('data de fim anterior à de início')
    if (!estado) problemas.push(`estado "${v('estado')}" desconhecido`)
    if (problemas.length) return erros.push({ linha, mensagem: problemas.join('; ') })
    vistos.add(numero)
    validas.push({ linha, dados: {
      nif_cliente: nif, numero_apolice: numero, ramo: ramo as Ramo, seguradora: v('seguradora'),
      premio_anual: premio, data_inicio: inicio as string, data_fim: fim, estado: estado as EstadoApolice,
    } })
  })

  return { validas, erros, total: linhas.length }
}
