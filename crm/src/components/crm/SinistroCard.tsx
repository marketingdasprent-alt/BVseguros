import { KanbanCard, semArrasto } from '@/components/crm/KanbanCard'
import type { Sinistro } from '@/lib/types'
import { formatarMoeda } from '@/lib/format'

interface SinistroCardProps {
  sinistro: Sinistro
  numeroApolice: string
  onEditar: (sinistro: Sinistro) => void
}

export function SinistroCard({ sinistro, numeroApolice, onEditar }: SinistroCardProps) {
  return (
    <KanbanCard id={sinistro.id}>
      <p className="font-medium text-sm text-ink">{numeroApolice}</p>
      <p className="text-xs text-muted">{sinistro.descricao}</p>
      {sinistro.valor_estimado != null && (
        <p className="text-xs text-muted tabular-nums">Valor estimado: {formatarMoeda(sinistro.valor_estimado)}</p>
      )}
      <div className="card-actions justify-end">
        <span className="card-actions-links">
          <button type="button" {...semArrasto} onClick={() => onEditar(sinistro)} aria-label={`Editar sinistro da apólice ${numeroApolice}`}>
            Editar
          </button>
        </span>
      </div>
    </KanbanCard>
  )
}
