import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import type { Apolice } from '@/lib/types'
import { Button } from '@/components/ui/Button'

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
    <Modal title="Renovar apólice" onClose={onFechar} busy={aGuardar}>
      <form onSubmit={handleSubmit} className="space-y-5">
        
        <p className="text-sm text-muted">Apólice {apolice.numero_apolice}</p>

        <label className="block min-w-0 space-y-2">
          <span className="block text-xs font-medium text-ink">
            Nova data de fim<span className="text-danger"> *</span>
          </span>
          <input
            required
            type="date"
            value={novaDataFim}
            onChange={(e) => setNovaDataFim(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
        </label>

        <label className="block min-w-0 space-y-2">
          <span className="block text-xs font-medium text-ink">Novo prémio anual (€)</span>
          <input
            type="number"
            step="0.01"
            value={novoPremio}
            onChange={(e) => setNovoPremio(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
        </label>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" disabled={aGuardar} onClick={onFechar} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" loading={aGuardar} className="flex-1">
            Confirmar renovação
          </Button>
        </div>
      </form>
    </Modal>
  )
}
