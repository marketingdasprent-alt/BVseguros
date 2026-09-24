import { KanbanCard, semArrasto, CLASSE_ACAO_CARTAO } from '@/components/crm/KanbanCard'
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
      <div className="flex justify-end border-t border-border pt-2 text-xs">
        <button type="button" {...semArrasto} onClick={() => onEditar(sinistro)} className={CLASSE_ACAO_CARTAO} aria-label={`Editar sinistro da apólice ${numeroApolice}`}>
          Editar
        </button>
      </div>
    </KanbanCard>
  )
}
