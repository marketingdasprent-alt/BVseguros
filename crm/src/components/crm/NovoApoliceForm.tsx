import { useState, type FormEvent, type ReactNode } from 'react'
import { RAMOS } from '@/lib/types'
import type { ApoliceInsert, Cliente, Ramo } from '@/lib/types'
import { Button } from '@/components/ui/Button'

interface NovoApoliceFormProps {
  clientes: Cliente[]
  aCriar: boolean
  onCriar: (apolice: ApoliceInsert) => Promise<boolean>
}

export function NovoApoliceForm({ clientes, aCriar, onCriar }: NovoApoliceFormProps) {
  const [clienteId, setClienteId] = useState(clientes[0]?.id ?? '')
  const [numero, setNumero] = useState('')
  const [ramo, setRamo] = useState<Ramo>('auto')
  const [seguradora, setSeguradora] = useState('')
  const [premio, setPremio] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const success = await onCriar({
      cliente_id: clienteId,
      numero_apolice: numero,
      ramo,
      seguradora,
      premio_anual: premio ? Number(premio) : null,
      data_inicio: dataInicio,
      data_fim: dataFim || null,
      estado: 'ativa',
    })
    if (!success) return;
    setNumero('')
    setSeguradora('')
    setPremio('')
    setDataInicio('')
    setDataFim('')
  }

  if (clientes.length === 0) {
    return (
      <div className="panel p-5">
        <p className="text-sm text-muted">Cria primeiro um cliente para poderes associar uma apólice.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="panel form-panel grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
      <h2 className="form-title">Nova apólice</h2>
      <Campo label="Cliente" required>
        <select
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
        >
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </Campo>

      <Campo label="Nº apólice" required>
        <input
          required
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
        />
      </Campo>

      <Campo label="Ramo" required>
        <select
          value={ramo}
          onChange={(e) => setRamo(e.target.value as Ramo)}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
        >
          {RAMOS.map((r) => (
            <option key={r.valor} value={r.valor}>
              {r.rotulo}
            </option>
          ))}
        </select>
      </Campo>

      <Campo label="Seguradora" required>
        <input
          required
          value={seguradora}
          onChange={(e) => setSeguradora(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
        />
      </Campo>

      <Campo label="Prémio anual (€)">
        <input
          type="number"
          step="0.01"
          value={premio}
          onChange={(e) => setPremio(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 tabular-nums"
        />
      </Campo>

      <Campo label="Data de início" required>
        <input
          required
          type="date"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 tabular-nums"
        />
      </Campo>

      <Campo label="Data de fim">
        <input
          type="date"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 tabular-nums"
        />
      </Campo>

      <Button type="submit" loading={aCriar} className="col-span-full md:col-span-3">
        Guardar apólice
      </Button>
    </form>
  )
}

function Campo({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block min-w-0 space-y-2">
      <span className="block text-xs font-medium text-ink">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      {children}
    </label>
  )
}
