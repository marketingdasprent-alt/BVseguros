import { useDraggable } from '@dnd-kit/core'
import { RAMOS } from '@/lib/types'
import type { Lead } from '@/lib/types'

export function LeadCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  })

  const ramoRotulo = RAMOS.find((r) => r.valor === lead.ramo_interesse)?.rotulo ?? lead.ramo_interesse

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 10 }
          : undefined
      }
      className={`bg-white rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing space-y-1 ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <p className="font-medium text-sm text-ink">{lead.nome}</p>
      <p className="text-xs text-ink/50">{lead.telefone}</p>
      <span className="inline-block text-xs bg-navy/10 text-navy rounded-full px-2 py-0.5 mt-1">
        {ramoRotulo}
      </span>
    </div>
  )
}
