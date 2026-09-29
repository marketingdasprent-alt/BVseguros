import { useState, type FormEvent } from 'react'
import { KeyRound } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Notice } from '@/components/ui/Notice'
import { RodapeFormulario } from '@/components/ui/Campo'
import { CampoSenha } from '@/components/crm/CampoSenha'
import type { Profile } from '@/lib/types'

interface DefinirSenhaModalProps {
  utilizador: Profile
  convitePendente: boolean
  aGuardar: boolean
  onGuardar: (senha: string) => Promise<void>
  onFechar: () => void
}

export function DefinirSenhaModal({ utilizador, convitePendente, aGuardar, onGuardar, onFechar }: DefinirSenhaModalProps) {
  const [senha, setSenha] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await onGuardar(senha)
  }

  return (
    <Modal title="Definir senha" subtitle={`${utilizador.nome} · ${utilizador.email}`} onClose={onFechar} busy={aGuardar}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Notice tone="info" icon={KeyRound}>
          {convitePendente
            ? 'O convite por email deixa de ser preciso: a pessoa entra já com esta senha. '
            : 'A senha atual deixa de funcionar. '}
          No primeiro acesso, o CRM pede-lhe uma senha nova. Passe-a por um canal seguro.
        </Notice>
        <CampoSenha label="Senha nova" valor={senha} onChange={setSenha} />
        <RodapeFormulario aGuardar={aGuardar} textoGuardar="Definir senha" onCancelar={onFechar} />
      </form>
    </Modal>
  )
}
