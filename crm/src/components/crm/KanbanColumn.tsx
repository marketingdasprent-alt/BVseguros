import { useDroppable } from '@dnd-kit/core'
import { LeadCard } from '@/components/crm/LeadCard'
import type { EstadoLead, Lead } from '@/lib/types'

interface KanbanColumnProps {
  estado: EstadoLead
  rotulo: string
  leads: Lead[]
}

export function KanbanColumn({ estado, rotulo, leads }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: estado })

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[220px] rounded-xl p-3 bg-ink/[0.03] ${isOver ? 'ring-2 ring-navy/30' : ''}`}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-medium text-ink/70">{rotulo}</h3>
        <span className="text-xs text-ink/40">{leads.length}</span>
      </div>
      <div className="space-y-2">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
        {leads.length === 0 && <p className="text-xs text-ink/30 px-1">Sem leads</p>}
      </div>
    </div>
  )
}
