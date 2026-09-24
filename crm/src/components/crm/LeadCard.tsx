import { KanbanCard } from '@/components/crm/KanbanCard'
import { Badge } from '@/components/ui/Badge'
import { RAMOS } from '@/lib/types'
import type { Lead } from '@/lib/types'

export function LeadCard({ lead }: { lead: Lead }) {
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
    </KanbanCard>
  )
}
