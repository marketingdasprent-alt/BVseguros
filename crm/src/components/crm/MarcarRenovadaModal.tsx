import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import type { Apolice } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { CLASSE_INPUT } from '@/components/ui/Campo'

interface MarcarRenovadaModalProps {
  apolice: Apolice
  aGuardar: boolean
  onFechar: () => void
  onConfirmar: (novaDataFim: string, novoPremio: number | null) => Promise<void>
}

export function MarcarRenovadaModal({ apolice, aGuardar, onFechar, onConfirmar }: MarcarRenovadaModalProps) {
  const [novaDataFim, setNovaDataFim] = useState('')
  const [novoPremio, setNovoPremio] = useState(apolice.premio_anual != null ? String(apolice.premio_anual) : '')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await onConfirmar(novaDataFim, novoPremio ? Number(novoPremio) : null)
  }

  return (
    <Modal title="Marcar como renovada" onClose={onFechar} busy={aGuardar}>
      <form onSubmit={handleSubmit} className="space-y-5">
        
        <p className="text-sm text-muted">Apólice {apolice.numero_apolice}</p>

        <label className="block min-w-0 space-y-2">
          <span className="block text-xs font-medium text-ink">
            Nova data de fim<span className="text-danger-text" aria-hidden="true"> *</span>
          </span>
          <input
            required
            type="date"
            value={novaDataFim}
            onChange={(e) => setNovaDataFim(e.target.value)}
            className={CLASSE_INPUT}
          />
        </label>

        <label className="block min-w-0 space-y-2">
          <span className="block text-xs font-medium text-ink">Novo prémio anual (€)</span>
          <input
            type="number"
            step="0.01"
            value={novoPremio}
            onChange={(e) => setNovoPremio(e.target.value)}
            className={CLASSE_INPUT}
          />
        </label>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" disabled={aGuardar} onClick={onFechar} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" loading={aGuardar} className="flex-1">
            Marcar renovada
          </Button>
        </div>
      </form>
    </Modal>
  )
}
