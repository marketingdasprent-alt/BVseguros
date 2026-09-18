import { useState, type FormEvent } from 'react'
import { RAMOS } from '@/lib/types'
import type { ApoliceInsert, Cliente, Ramo } from '@/lib/types'

interface NovoApoliceFormProps {
  clientes: Cliente[]
  aCriar: boolean
  onCriar: (apolice: ApoliceInsert) => Promise<void>
}

export function NovoApoliceForm({ clientes, aCriar, onCriar }: NovoApoliceFormProps) {
  const [clienteId, setClienteId] = useState(clientes[0]?.id ?? '')
  const [numero, setNumero] = useState('')
  const [ramo, setRamo] = useState<Ramo>('auto')
  const [seguradora, setSeguradora] = useState('')
  const [premio, setPremio] = useState('')
  const [dataInicio, setDataInicio] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await onCriar({
      cliente_id: clienteId,
      numero_apolice: numero,
      ramo,
      seguradora,
      premio_anual: premio ? Number(premio) : null,
      data_inicio: dataInicio,
      data_fim: null,
      estado: 'ativa',
    })
    setNumero('')
    setSeguradora('')
    setPremio('')
    setDataInicio('')
  }

  if (clientes.length === 0) {
    return (
      <p className="bg-white rounded-xl p-4 shadow-sm text-sm text-ink/50">
        Cria primeiro um cliente para poderes associar uma apólice.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 shadow-sm grid grid-cols-2 md:grid-cols-3 gap-3">
      <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="rounded-lg border border-ink/15 px-3 py-2 text-sm">
        {clientes.map((c) => (
          <option key={c.id} value={c.id}>{c.nome}</option>
        ))}
      </select>
      <input required placeholder="Nº apólice" value={numero} onChange={(e) => setNumero(e.target.value)} className="rounded-lg border border-ink/15 px-3 py-2 text-sm" />
      <select value={ramo} onChange={(e) => setRamo(e.target.value as Ramo)} className="rounded-lg border border-ink/15 px-3 py-2 text-sm">
        {RAMOS.map((r) => (
          <option key={r.valor} value={r.valor}>{r.rotulo}</option>
        ))}
      </select>
      <input required placeholder="Seguradora" value={seguradora} onChange={(e) => setSeguradora(e.target.value)} className="rounded-lg border border-ink/15 px-3 py-2 text-sm" />
      <input placeholder="Prémio anual (€)" type="number" step="0.01" value={premio} onChange={(e) => setPremio(e.target.value)} className="rounded-lg border border-ink/15 px-3 py-2 text-sm" />
      <input required type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="rounded-lg border border-ink/15 px-3 py-2 text-sm" />
      <button type="submit" disabled={aCriar} className="col-span-2 md:col-span-3 rounded-lg bg-navy text-white py-2 text-sm font-medium disabled:opacity-50">
        {aCriar ? 'A criar…' : 'Guardar apólice'}
      </button>
    </form>
  )
}
