import { useState, type FormEvent, type ReactNode } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Campo, CLASSE_INPUT, RodapeFormulario } from '@/components/ui/Campo'
import type { ClienteEdicao } from '@/lib/types'

interface ClienteFormModalProps {
  titulo: string
  inicial: ClienteEdicao
  textoGuardar: string
  aGuardar: boolean
  aviso?: ReactNode
  onFechar: () => void
  onGuardar: (dados: ClienteEdicao) => Promise<void>
  onApagar?: () => void
}

// Serve para editar um cliente e para converter um lead (dados pré-preenchidos do lead).
export function ClienteFormModal({ titulo, inicial, textoGuardar, aGuardar, aviso, onFechar, onGuardar, onApagar }: ClienteFormModalProps) {
  const [nome, setNome] = useState(inicial.nome)
  const [telefone, setTelefone] = useState(inicial.telefone)
  const [email, setEmail] = useState(inicial.email ?? '')
  const [nif, setNif] = useState(inicial.nif ?? '')
  const [morada, setMorada] = useState(inicial.morada ?? '')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await onGuardar({
      nome: nome.trim(),
      telefone: telefone.trim(),
      email: email.trim() || null,
      nif: nif.trim() || null,
      morada: morada.trim() || null,
    })
  }

  return (
    <Modal title={titulo} onClose={onFechar} busy={aGuardar}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {aviso}
        <Campo label="Nome" required>
          <input required value={nome} onChange={(e) => setNome(e.target.value)} className={CLASSE_INPUT} />
        </Campo>
        <div className="grid gap-5 sm:grid-cols-2">
          <Campo label="Telefone" required>
            <input required value={telefone} onChange={(e) => setTelefone(e.target.value)} className={CLASSE_INPUT} />
          </Campo>
          <Campo label="NIF">
            <input value={nif} onChange={(e) => setNif(e.target.value)} inputMode="numeric" maxLength={9}
              pattern="[0-9]{9}" title="9 dígitos" className={CLASSE_INPUT} />
          </Campo>
        </div>
        <Campo label="Email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={CLASSE_INPUT} />
        </Campo>
        <Campo label="Morada">
          <input value={morada} onChange={(e) => setMorada(e.target.value)} className={CLASSE_INPUT} />
        </Campo>
        <RodapeFormulario aGuardar={aGuardar} textoGuardar={textoGuardar} onCancelar={onFechar} onApagar={onApagar} />
      </form>
    </Modal>
  )
}
