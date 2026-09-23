import { KanbanCard } from '@/components/crm/KanbanCard'
import { Badge } from '@/components/ui/Badge'
import { RAMOS } from '@/lib/types'
import type { Proposta } from '@/lib/types'
import { formatarMoeda } from '@/lib/format'

interface PropostaCardProps {
  proposta: Proposta
  nomeOrigem: string
}

export function PropostaCard({ proposta, nomeOrigem }: PropostaCardProps) {
  const ramoRotulo = RAMOS.find((r) => r.valor === proposta.ramo)?.rotulo ?? proposta.ramo

  return (
    <KanbanCard id={proposta.id}>
      <p className="font-medium text-sm text-ink">{nomeOrigem}</p>
      <p className="text-xs text-muted">{proposta.seguradora}</p>
      <Badge tone="info" className="mt-1">
        {ramoRotulo}
      </Badge>
      {proposta.premio_anual_estimado != null && (
        <p className="text-xs text-muted pt-0.5 tabular-nums">
          Prémio estimado: {formatarMoeda(proposta.premio_anual_estimado)}
        </p>
      )}
    </KanbanCard>
  )
}
