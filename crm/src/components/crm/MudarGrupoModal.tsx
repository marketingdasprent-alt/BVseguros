import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Modal } from '@/components/ui/Modal'
import { Campo, CLASSE_INPUT, RodapeFormulario } from '@/components/ui/Campo'
import type { Grupo, Profile } from '@/lib/types'

interface MudarGrupoModalProps {
  utilizador: Profile
  grupos: Grupo[]
  aGuardar: boolean
  onGuardar: (grupoId: string | null) => Promise<void>
  onFechar: () => void
}

export function MudarGrupoModal({ utilizador, grupos, aGuardar, onGuardar, onFechar }: MudarGrupoModalProps) {
  const [grupoId, setGrupoId] = useState(utilizador.grupo_id ?? '')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await onGuardar(grupoId || null)
  }

  return (
    <Modal title="Mudar de grupo" subtitle={utilizador.nome} onClose={onFechar} busy={aGuardar}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Campo label="Grupo">
          <select value={grupoId} onChange={(e) => setGrupoId(e.target.value)} className={CLASSE_INPUT} data-autofocus>
            <option value="">Sem grupo (não vê nenhum módulo)</option>
            {grupos.map((g) => <option key={g.id} value={g.id}>{g.nome}</option>)}
          </select>
        </Campo>
        <p className="text-xs text-muted">
          {utilizador.is_admin
            ? 'Enquanto for administrador tem acesso a tudo; o grupo só conta se deixar de o ser.'
            : 'Passa a ter as permissões do grupo escolhido.'}{' '}
          <Link to="/grupos" className="text-link">Ver e editar grupos</Link>
        </p>
        <RodapeFormulario aGuardar={aGuardar} textoGuardar="Mudar grupo" onCancelar={onFechar} desativarGuardar={grupoId === (utilizador.grupo_id ?? '')} />
      </form>
    </Modal>
  )
}
