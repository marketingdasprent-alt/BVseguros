import { Fragment } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/Badge';
import { TONE_BAR_CLASS } from '@/lib/tone';
import type { ReactNode } from 'react';
import type { Tone } from '@/lib/tone';

interface KanbanColumnProps<T> {
  estado: string; rotulo: string; tone: Tone; itens: T[];
  getId: (item: T) => string; renderCard: (item: T) => ReactNode; vazioTexto: string;
}

export function KanbanColumn<T>({ estado, rotulo, tone, itens, getId, renderCard, vazioTexto }: KanbanColumnProps<T>) {
  const { setNodeRef, isOver } = useDroppable({ id: estado });
  return <section ref={setNodeRef} className={`kanban-column${isOver ? ' is-over' : ''}`} aria-label={rotulo}>
    <div className="kanban-column-heading"><h3><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TONE_BAR_CLASS[tone]}`} />{rotulo}</h3><Badge tone="neutral">{itens.length}</Badge></div>
    <div className="space-y-3">
      {itens.map((item) => <Fragment key={getId(item)}>{renderCard(item)}</Fragment>)}
      {itens.length === 0 && <p className="kanban-empty">{vazioTexto}</p>}
    </div>
  </section>;
}
