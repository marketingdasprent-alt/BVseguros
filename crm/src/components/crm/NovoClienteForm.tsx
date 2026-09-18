import { useState, type FormEvent } from 'react'
import type { ClienteInsert } from '@/lib/types'

interface NovoClienteFormProps {
  aCriar: boolean
  onCriar: (cliente: ClienteInsert) => Promise<void>
}

export function NovoClienteForm({ aCriar, onCriar }: NovoClienteFormProps) {
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [nif, setNif] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await onCriar({
      nome,
      telefone,
      email: email || null,
      nif: nif || null,
      morada: null,
      lead_origem_id: null,
    })
    setNome('')
    setTelefone('')
    setEmail('')
    setNif('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl p-4 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-3"
    >
      <input required placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} className="rounded-lg border border-ink/15 px-3 py-2 text-sm" />
      <input required placeholder="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} className="rounded-lg border border-ink/15 px-3 py-2 text-sm" />
      <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-lg border border-ink/15 px-3 py-2 text-sm" />
      <input placeholder="NIF" value={nif} onChange={(e) => setNif(e.target.value)} className="rounded-lg border border-ink/15 px-3 py-2 text-sm" />
      <button
        type="submit"
        disabled={aCriar}
        className="col-span-2 md:col-span-4 rounded-lg bg-navy text-white py-2 text-sm font-medium disabled:opacity-50"
      >
        {aCriar ? 'A criar…' : 'Guardar cliente'}
      </button>
    </form>
  )
}
