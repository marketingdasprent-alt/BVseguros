import { useState, type FormEvent } from 'react'
import { Info } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Notice } from '@/components/ui/Notice'
import { Campo, CLASSE_INPUT, RodapeFormulario } from '@/components/ui/Campo'
import type { Seguradora } from '@/lib/types'

interface NomeSeguradoraModalProps {
  // Sem `atual` é criar; com `atual` é renomear (ou juntar, se o nome já existir).
  atual?: Seguradora
  existentes: Seguradora[]
  aGuardar: boolean
  onFechar: () => void
  onGuardar: (nome: string) => Promise<void>
}

export function NomeSeguradoraModal({ atual, existentes, aGuardar, onFechar, onGuardar }: NomeSeguradoraModalProps) {
  const [nome, setNome] = useState(atual?.nome ?? '')
  const limpo = nome.trim().replace(/\s+/g, ' ')
  const igual = existentes.find((s) => s.id !== atual?.id && s.nome.toLowerCase() === limpo.toLowerCase())

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await onGuardar(limpo)
  }

  return (
    <Modal title={atual ? 'Renomear seguradora' : 'Nova seguradora'} subtitle={atual?.nome} onClose={onFechar} busy={aGuardar}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Campo label="Nome" required>
          <input required minLength={2} maxLength={120} value={nome} onChange={(e) => setNome(e.target.value)} className={CLASSE_INPUT} />
        </Campo>
        {atual && igual && (
          <Notice tone="info" icon={Info}>
            Já existe «{igual.nome}». Ao guardar, as apólices e propostas de «{atual.nome}» passam para «{igual.nome}» e esta sai da lista.
          </Notice>
        )}
        {!atual && igual && <Notice icon={Info}>«{igual.nome}» já está na lista.</Notice>}
        <RodapeFormulario aGuardar={aGuardar} onCancelar={onFechar}
          textoGuardar={atual ? (igual ? 'Juntar' : 'Guardar alterações') : 'Adicionar'}
          desativarGuardar={limpo.length < 2 || limpo === atual?.nome || (!atual && !!igual)} />
      </form>
    </Modal>
  )
}
