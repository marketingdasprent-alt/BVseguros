import type { KeyboardEvent, PointerEvent } from 'react'
import { KanbanCard } from '@/components/crm/KanbanCard'
import { Badge } from '@/components/ui/Badge'
import { RAMOS } from '@/lib/types'
import type { Lead } from '@/lib/types'

interface LeadCardProps {
  lead: Lead
  nomeResponsavel: string | null
  podeAtribuir: boolean
  onAssumir: (lead: Lead) => void
  onAtribuir: (lead: Lead) => void
}

// Os botões vivem dentro de um cartão arrastável: sem isto, clicar ou carregar em
// Enter/Espaço começava um arrasto em vez de acionar o botão.
const naoArrastar = {
  onPointerDown: (e: PointerEvent) => e.stopPropagation(),
  onKeyDown: (e: KeyboardEvent) => e.stopPropagation(),
}

export function LeadCard({ lead, nomeResponsavel, podeAtribuir, onAssumir, onAtribuir }: LeadCardProps) {
  const ramoRotulo = RAMOS.find((r) => r.valor === lead.ramo_interesse)?.rotulo ?? lead.ramo_interesse

  return (
    <KanbanCard id={lead.id}>
      <p className="font-medium text-sm text-ink">{lead.nome}</p>
      <p className="text-xs text-muted">{lead.telefone}</p>
      <div className="flex flex-wrap gap-1.5">
        <Badge tone="info">{ramoRotulo}</Badge>
        {lead.origem === 'site' && <Badge tone="success">Site</Badge>}
      </div>
      {lead.mensagem && (
        <p className="text-xs text-muted line-clamp-3" title={lead.mensagem}>
          “{lead.mensagem}”
        </p>
      )}
      <div className="flex items-center justify-between gap-2 border-t border-border pt-2 text-xs">
        <span className={lead.responsavel_id ? 'text-ink' : 'text-muted'}>
          {lead.responsavel_id ? nomeResponsavel ?? 'Atribuído' : 'Sem responsável'}
        </span>
        {podeAtribuir ? (
          <button type="button" {...naoArrastar} onClick={() => onAtribuir(lead)}
            className="font-medium text-navy underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy rounded">
            Atribuir
          </button>
        ) : (
          !lead.responsavel_id && (
            <button type="button" {...naoArrastar} onClick={() => onAssumir(lead)}
              className="font-medium text-navy underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy rounded">
              Assumir
            </button>
          )
        )}
      </div>
    </KanbanCard>
  )
}
