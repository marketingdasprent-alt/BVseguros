import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import type { MembroEquipa } from '@/lib/types'

interface AtribuirResponsavelModalProps {
  nomeRegisto: string
  responsavelAtual: string | null
  membros: MembroEquipa[]
  aGuardar: boolean
  onFechar: () => void
  onConfirmar: (responsavelId: string | null) => Promise<void>
}

export function AtribuirResponsavelModal({ nomeRegisto, responsavelAtual, membros, aGuardar, onFechar, onConfirmar }: AtribuirResponsavelModalProps) {
  // Um responsável que perdeu o acesso não está na lista; começa em "Sem responsável".
  const [escolhido, setEscolhido] = useState(
    responsavelAtual && membros.some((m) => m.id === responsavelAtual) ? responsavelAtual : '',
  )

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await onConfirmar(escolhido || null)
  }

  return (
    <Modal title="Atribuir responsável" onClose={onFechar} busy={aGuardar}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <p className="text-sm text-muted">{nomeRegisto}</p>

        <label className="block min-w-0 space-y-2">
          <span className="block text-xs font-medium text-ink">Responsável</span>
          <select
            value={escolhido}
            onChange={(e) => setEscolhido(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
          >
            <option value="">Sem responsável</option>
            {membros.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" disabled={aGuardar} onClick={onFechar} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" loading={aGuardar} disabled={escolhido === (responsavelAtual ?? '')} className="flex-1">
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
