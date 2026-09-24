import { KanbanCard, semArrasto, CLASSE_ACAO_CARTAO } from '@/components/crm/KanbanCard'
import { Badge } from '@/components/ui/Badge'
import { RAMOS } from '@/lib/types'
import type { Proposta } from '@/lib/types'
import { formatarMoeda } from '@/lib/format'

interface PropostaCardProps {
  proposta: Proposta
  nomeOrigem: string
  onEditar: (proposta: Proposta) => void
}

export function PropostaCard({ proposta, nomeOrigem, onEditar }: PropostaCardProps) {
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
      <div className="flex justify-end border-t border-border pt-2 text-xs">
        <button type="button" {...semArrasto} onClick={() => onEditar(proposta)} className={CLASSE_ACAO_CARTAO} aria-label={`Editar proposta de ${nomeOrigem}`}>
          Editar
        </button>
      </div>
    </KanbanCard>
  )
}
