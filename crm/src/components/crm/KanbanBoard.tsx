import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { KanbanColumn } from '@/components/crm/KanbanColumn';
import type { DragEndEvent } from '@dnd-kit/core';
import type { ReactNode } from 'react';
import type { Tone } from '@/lib/tone';

interface KanbanBoardProps<T> {
  itens: T[]; colunas: { valor: string; rotulo: string }[];
  getId: (item: T) => string; getEstado: (item: T) => string;
  getAtualizadoEm: (item: T) => string;
  getTone: (estado: string) => Tone;
  onMudarEstado: (id: string, estado: string, atualizadoEm: string) => void;
  renderCard: (item: T) => ReactNode; vazioTexto: string;
}

export function KanbanBoard<T>({ itens, colunas, getId, getEstado, getAtualizadoEm, getTone, onMudarEstado, renderCard, vazioTexto }: KanbanBoardProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setEdges({ left: el.scrollLeft > 1, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1 });
    const observer = new ResizeObserver(update);
    observer.observe(el); el.addEventListener('scroll', update); update();
    return () => { observer.disconnect(); el.removeEventListener('scroll', update); };
  }, [colunas.length]);
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;
    const state = String(over.id);
    const item = itens.find((entry) => getId(entry) === active.id);
    if (item && colunas.some((column) => column.valor === state) && getEstado(item) !== state) onMudarEstado(getId(item), state, getAtualizadoEm(item));
  };
  return <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
    <div className="kanban-toolbar">
      <div><strong>Pipeline</strong><span>{itens.length} {itens.length === 1 ? 'registo' : 'registos'} · {colunas.length} etapas</span></div>
      {(edges.left || edges.right) && <div className="flex gap-1">
        <button className="icon-button border border-border bg-white" type="button" aria-label="Ver etapas anteriores" disabled={!edges.left} onClick={() => ref.current?.scrollBy({ left: -232 })}><ChevronLeft size={17} /></button>
        <button className="icon-button border border-border bg-white" type="button" aria-label="Ver etapas seguintes" disabled={!edges.right} onClick={() => ref.current?.scrollBy({ left: 232 })}><ChevronRight size={17} /></button>
      </div>}
    </div>
    <div ref={ref} className="kanban-scroll scroll-thin" role="region" tabIndex={0} aria-label="Quadro por etapas">
      {colunas.map((column) => <KanbanColumn key={column.valor} estado={column.valor} rotulo={column.rotulo} tone={getTone(column.valor)} itens={itens.filter((item) => getEstado(item) === column.valor)} getId={getId} renderCard={renderCard} vazioTexto={vazioTexto} />)}
    </div>
  </DndContext>;
}
