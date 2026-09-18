import { useState, type FormEvent } from 'react'
import { RAMOS } from '@/lib/types'
import type { LeadInsert, Ramo } from '@/lib/types'

interface NovoLeadModalProps {
  aCriar: boolean
  onFechar: () => void
  onCriar: (lead: LeadInsert) => Promise<void>
}

export function NovoLeadModal({ aCriar, onFechar, onCriar }: NovoLeadModalProps) {
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [ramo, setRamo] = useState<Ramo>('auto')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await onCriar({
      nome,
      telefone,
      email: email || null,
      ramo_interesse: ramo,
      estado: 'novo',
      notas: null,
    })
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-40 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4">
        <h2 className="font-display font-bold text-navy">Novo lead</h2>

        <Campo label="Nome" value={nome} onChange={setNome} required />
        <Campo label="Telefone" value={telefone} onChange={setTelefone} required />
        <Campo label="Email" value={email} onChange={setEmail} type="email" />

        <div className="space-y-1">
          <label className="text-sm font-medium text-ink/70">Ramo de interesse</label>
          <select
            value={ramo}
            onChange={(e) => setRamo(e.target.value as Ramo)}
            className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
          >
            {RAMOS.map((r) => (
              <option key={r.valor} value={r.valor}>
                {r.rotulo}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onFechar}
            className="flex-1 rounded-lg border border-ink/15 py-2 text-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={aCriar}
            className="flex-1 rounded-lg bg-navy text-white py-2 text-sm font-medium disabled:opacity-50"
          >
            {aCriar ? 'A criar…' : 'Criar lead'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Campo({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-ink/70">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
      />
    </div>
  )
}
