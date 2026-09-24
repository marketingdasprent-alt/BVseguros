import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import type { Profile } from '@/lib/types'

interface EditarNomeModalProps {
  utilizador: Profile
  aGuardar: boolean
  onFechar: () => void
  onGuardar: (nome: string) => Promise<void>
}

// A base de dados aceita até 254 (cabe um email); 120 chega para um nome.
const NOME_MIN = 2
const NOME_MAX = 120

export function EditarNomeModal({ utilizador, aGuardar, onFechar, onGuardar }: EditarNomeModalProps) {
  // Contas convidadas nascem com o email como nome; nesse caso começa vazio.
  const [nome, setNome] = useState(utilizador.nome === utilizador.email ? '' : utilizador.nome)
  const limpo = nome.trim()
  const isValido = limpo.length >= NOME_MIN && limpo.length <= NOME_MAX

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (isValido) await onGuardar(limpo)
  }

  return (
    <Modal title="Editar nome" onClose={onFechar} busy={aGuardar}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <p className="text-sm text-muted">{utilizador.email}</p>

        <label className="block min-w-0 space-y-2">
          <span className="block text-xs font-medium text-ink">
            Nome<span className="text-danger"> *</span>
          </span>
          <input
            required
            maxLength={NOME_MAX}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome e apelido"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
        </label>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" disabled={aGuardar} onClick={onFechar} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" loading={aGuardar} disabled={!isValido || limpo === utilizador.nome} className="flex-1">
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
