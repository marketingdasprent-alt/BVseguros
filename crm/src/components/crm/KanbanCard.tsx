import { useDraggable } from '@dnd-kit/core';
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react';

interface KanbanCardProps { id: string; children: ReactNode; }

// Para botões dentro de um cartão arrastável: sem isto, clicar ou carregar em
// Enter/Espaço começava um arrasto em vez de acionar o botão.
export const semArrasto = {
  onPointerDown: (e: PointerEvent) => e.stopPropagation(),
  onKeyDown: (e: KeyboardEvent) => e.stopPropagation(),
};

export const CLASSE_ACAO_CARTAO = 'font-medium text-navy underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy rounded';

export function KanbanCard({ id, children }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  return <div ref={setNodeRef} {...listeners} {...attributes}
    style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 10 } : undefined}
    className={`kanban-card${isDragging ? ' is-dragging' : ''}`}>
    {children}
  </div>;
}
