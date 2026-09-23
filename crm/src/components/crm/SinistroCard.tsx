import { KanbanCard } from '@/components/crm/KanbanCard'
import type { Sinistro } from '@/lib/types'
import { formatarMoeda } from '@/lib/format'

interface SinistroCardProps {
  sinistro: Sinistro
  numeroApolice: string
}

export function SinistroCard({ sinistro, numeroApolice }: SinistroCardProps) {
  return (
    <KanbanCard id={sinistro.id}>
      <p className="font-medium text-sm text-ink">{numeroApolice}</p>
      <p className="text-xs text-muted">{sinistro.descricao}</p>
      {sinistro.valor_estimado != null && (
        <p className="text-xs text-muted tabular-nums">Valor estimado: {formatarMoeda(sinistro.valor_estimado)}</p>
      )}
    </KanbanCard>
  )
}
