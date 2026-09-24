import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Campo, CLASSE_INPUT, RodapeFormulario } from '@/components/ui/Campo'

interface ConvidarModalProps {
  aEnviar: boolean
  onFechar: () => void
  onConvidar: (nome: string, email: string) => Promise<void>
}

export function ConvidarModal({ aEnviar, onFechar, onConvidar }: ConvidarModalProps) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await onConvidar(nome.trim(), email.trim())
  }

  return (
    <Modal title="Convidar utilizador" onClose={onFechar} busy={aEnviar}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <p className="text-sm text-muted">
          A pessoa recebe um email para definir a senha. A conta fica já com acesso, como mediador.
        </p>
        <Campo label="Nome" required>
          <input required minLength={2} maxLength={120} value={nome} onChange={(e) => setNome(e.target.value)}
            placeholder="Nome e apelido" className={CLASSE_INPUT} />
        </Campo>
        <Campo label="Email" required>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={CLASSE_INPUT} />
        </Campo>
        <RodapeFormulario aGuardar={aEnviar} textoGuardar="Enviar convite" onCancelar={onFechar} />
      </form>
    </Modal>
  )
}
