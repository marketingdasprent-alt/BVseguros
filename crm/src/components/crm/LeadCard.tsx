import { StickyNote } from 'lucide-react'
import { KanbanCard, semArrasto } from '@/components/crm/KanbanCard'
import { Badge } from '@/components/ui/Badge'
import { Pessoa } from '@/components/ui/Pessoa'
import { RAMOS } from '@/lib/types'
import type { Lead } from '@/lib/types'

interface LeadCardProps {
  lead: Lead
  nomeResponsavel: string | null
  podeAtribuir: boolean
  onAssumir: (lead: Lead) => void
  onAtribuir: (lead: Lead) => void
  onEditar: (lead: Lead) => void
}

export function LeadCard({ lead, nomeResponsavel, podeAtribuir, onAssumir, onAtribuir, onEditar }: LeadCardProps) {
  const ramoRotulo = RAMOS.find((r) => r.valor === lead.ramo_interesse)?.rotulo ?? lead.ramo_interesse

  return (
    <KanbanCard id={lead.id}>
      <p className="font-medium text-sm text-ink">{lead.nome}</p>
      <p className="text-xs text-muted tabular-nums">{lead.telefone}</p>
      <div className="flex flex-wrap gap-1.5">
        <Badge tone="info">{ramoRotulo}</Badge>
        {lead.origem === 'site' && <Badge tone="success">Site</Badge>}
      </div>
      {lead.mensagem && (
        <p className="text-xs text-muted line-clamp-3" title={lead.mensagem}>
          “{lead.mensagem}”
        </p>
      )}
      {lead.notas && (
        <p className="flex gap-1.5 text-xs text-ink" title={lead.notas}>
          <StickyNote size={12} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
          <span className="line-clamp-2">{lead.notas}</span>
        </p>
      )}
      <div className="card-actions">
        <Pessoa nome={lead.responsavel_id ? nomeResponsavel ?? 'Atribuído' : null} />
        <span className="card-actions-links">
          <button type="button" {...semArrasto} onClick={() => onEditar(lead)} aria-label={`Editar ${lead.nome}`}>
            Editar
          </button>
          {podeAtribuir ? (
            <button type="button" {...semArrasto} onClick={() => onAtribuir(lead)} aria-label={`Atribuir ${lead.nome}`}>
              Atribuir
            </button>
          ) : (
            !lead.responsavel_id && (
              <button type="button" {...semArrasto} onClick={() => onAssumir(lead)} aria-label={`Assumir ${lead.nome}`}>
                Assumir
              </button>
            )
          )}
        </span>
      </div>
    </KanbanCard>
  )
}
