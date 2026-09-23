import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { RAMOS } from '@/lib/types'
import type { LeadInsert, Ramo } from '@/lib/types'
import { Button } from '@/components/ui/Button'

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
    <Modal title="Novo lead" onClose={onFechar} busy={aCriar}>
      <form onSubmit={handleSubmit} className="space-y-5">


        <Campo label="Nome" value={nome} onChange={setNome} required />
        <Campo label="Telefone" value={telefone} onChange={setTelefone} required />
        <Campo label="Email" value={email} onChange={setEmail} type="email" />

        <label className="block min-w-0 space-y-2">
          <span className="block text-xs font-medium text-ink">Ramo de interesse</span>
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
        </label>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" disabled={aCriar} onClick={onFechar} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" loading={aCriar} className="flex-1">
            Criar lead
          </Button>
        </div>
      </form>
    </Modal>
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
    <label className="block min-w-0 space-y-2">
      <span className="block text-xs font-medium text-ink">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
      />
    </label>
  )
}
