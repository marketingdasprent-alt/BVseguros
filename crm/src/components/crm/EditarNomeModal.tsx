import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Campo, CLASSE_INPUT, ContextoFormulario, RodapeFormulario } from '@/components/ui/Campo'
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

  const restantes = NOME_MAX - nome.length

  return (
    <Modal title="Editar nome" onClose={onFechar} busy={aGuardar}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <ContextoFormulario itens={[{ rotulo: 'Conta', valor: utilizador.email }]} />
        <Campo label="Nome" required
          extra={restantes < 20 ? <span className="text-[11px] font-normal text-muted tabular-nums">{restantes} caracteres</span> : undefined}>
          <input required maxLength={NOME_MAX} value={nome} onChange={(e) => setNome(e.target.value)}
            placeholder="Nome e apelido" className={CLASSE_INPUT} />
        </Campo>
        <RodapeFormulario aGuardar={aGuardar} textoGuardar="Guardar alterações" onCancelar={onFechar}
          desativarGuardar={!isValido || limpo === utilizador.nome} />
      </form>
    </Modal>
  )
}