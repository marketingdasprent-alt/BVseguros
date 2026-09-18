import { DndContext, type DragEndEvent } from '@dnd-kit/core'
import { KanbanColumn } from '@/components/crm/KanbanColumn'
import { ESTADOS_LEAD } from '@/lib/types'
import type { EstadoLead, Lead } from '@/lib/types'

interface KanbanBoardProps {
  leads: Lead[]
  onMudarEstado: (id: string, estado: EstadoLead) => void
}

export function KanbanBoard({ leads, onMudarEstado }: KanbanBoardProps) {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    const novoEstado = over.id as EstadoLead
    const lead = leads.find((l) => l.id === active.id)
    if (lead && lead.estado !== novoEstado) onMudarEstado(lead.id, novoEstado)
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {ESTADOS_LEAD.map((estado) => (
          <KanbanColumn
            key={estado.valor}
            estado={estado.valor}
            rotulo={estado.rotulo}
            leads={leads.filter((l) => l.estado === estado.valor)}
          />
        ))}
      </div>
    </DndContext>
  )
}
