import { useDraggable } from '@dnd-kit/core';
import type { ReactNode } from 'react';

interface KanbanCardProps { id: string; children: ReactNode; }

export function KanbanCard({ id, children }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  return <div ref={setNodeRef} {...listeners} {...attributes}
    style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 10 } : undefined}
    className={`kanban-card${isDragging ? ' is-dragging' : ''}`}>
    {children}
  </div>;
}
