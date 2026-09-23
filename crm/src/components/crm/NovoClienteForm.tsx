import { useState, type FormEvent } from 'react'
import type { ClienteInsert } from '@/lib/types'
import { Button } from '@/components/ui/Button'

interface NovoClienteFormProps {
  aCriar: boolean
  onCriar: (cliente: ClienteInsert) => Promise<boolean>
}

export function NovoClienteForm({ aCriar, onCriar }: NovoClienteFormProps) {
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [nif, setNif] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const success = await onCriar({
      nome,
      telefone,
      email: email || null,
      nif: nif || null,
      morada: null,
      lead_origem_id: null,
    })
    if (!success) return;
    setNome('')
    setTelefone('')
    setEmail('')
    setNif('')
  }

  return (
    <form onSubmit={handleSubmit} className="panel form-panel grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
      <h2 className="form-title">Novo cliente</h2>
      <Campo label="Nome" value={nome} onChange={setNome} required />
      <Campo label="Telefone" value={telefone} onChange={setTelefone} required />
      <Campo label="Email" value={email} onChange={setEmail} type="email" />
      <Campo label="NIF" value={nif} onChange={setNif} />
      <Button type="submit" loading={aCriar} className="col-span-full md:col-span-4">
        Guardar cliente
      </Button>
    </form>
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
