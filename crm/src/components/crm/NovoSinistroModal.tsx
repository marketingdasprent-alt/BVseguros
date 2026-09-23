import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import type { Apolice, SinistroInsert } from '@/lib/types'
import { Button } from '@/components/ui/Button'

interface NovoSinistroModalProps {
  apolices: Apolice[]
  aCriar: boolean
  onFechar: () => void
  onCriar: (sinistro: SinistroInsert) => Promise<void>
}

export function NovoSinistroModal({ apolices, aCriar, onFechar, onCriar }: NovoSinistroModalProps) {
  const [apoliceId, setApoliceId] = useState(apolices[0]?.id ?? '')
  const [dataOcorrencia, setDataOcorrencia] = useState('')
  const [descricao, setDescricao] = useState('')
  const [valorEstimado, setValorEstimado] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await onCriar({
      apolice_id: apoliceId,
      numero_sinistro: null,
      data_ocorrencia: dataOcorrencia,
      descricao,
      estado: 'participado',
      valor_estimado: valorEstimado ? Number(valorEstimado) : null,
      valor_pago: null,
      notas: null,
    })
  }

  if (apolices.length === 0) {
    return (
      <Modal title="Novo sinistro" onClose={onFechar} busy={aCriar}>
        <div className="space-y-5">
          
          <p className="text-sm text-muted pr-6">Cria primeiro uma apólice para poderes participar um sinistro.</p>
          <Button variant="secondary" disabled={aCriar} onClick={onFechar} className="w-full">
            Fechar
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Novo sinistro" onClose={onFechar} busy={aCriar}>
      <form onSubmit={handleSubmit} className="space-y-5">


        <label className="block min-w-0 space-y-2">
          <span className="block text-xs font-medium text-ink">Apólice</span>
          <select
            value={apoliceId}
            onChange={(e) => setApoliceId(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
          >
            {apolices.map((a) => (
              <option key={a.id} value={a.id}>
                {a.numero_apolice} · {a.seguradora}
              </option>
            ))}
          </select>
        </label>

        <label className="block min-w-0 space-y-2">
          <span className="block text-xs font-medium text-ink">
            Data de ocorrência<span className="text-danger"> *</span>
          </span>
          <input
            required
            type="date"
            value={dataOcorrencia}
            onChange={(e) => setDataOcorrencia(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
        </label>

        <label className="block min-w-0 space-y-2">
          <span className="block text-xs font-medium text-ink">
            Descrição<span className="text-danger"> *</span>
          </span>
          <input
            required
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
        </label>

        <label className="block min-w-0 space-y-2">
          <span className="block text-xs font-medium text-ink">Valor estimado (€)</span>
          <input
            type="number"
            step="0.01"
            value={valorEstimado}
            onChange={(e) => setValorEstimado(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
        </label>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" disabled={aCriar} onClick={onFechar} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" loading={aCriar} className="flex-1">
            Criar sinistro
          </Button>
        </div>
      </form>
    </Modal>
  )
}
