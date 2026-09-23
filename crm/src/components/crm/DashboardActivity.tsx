import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarDays } from 'lucide-react';
import { TIPOS_ATIVIDADE } from '@/lib/types';
import { formatarData } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Atividade } from '@/lib/types';

interface DashboardActivityProps { atividades: Atividade[]; }

export function DashboardActivity({ atividades }: DashboardActivityProps) {
  const recent = [...atividades].sort((a, b) => b.criado_em.localeCompare(a.criado_em)).slice(0, 4);
  return <section className="panel">
    <div className="panel-heading"><div><h2>Atividades recentes</h2><p>Os últimos registos da equipa.</p></div><Link to="/atividades" className="text-link">Ver todas <ArrowUpRight size={14} /></Link></div>
    {recent.length === 0 ? <EmptyState icon={CalendarDays} titulo="A sua atividade começa aqui" descricao="Registe uma chamada, reunião ou tarefa para manter o acompanhamento organizado." action={<Link to="/atividades" className="text-link">Registar atividade <ArrowUpRight size={14} /></Link>} /> : recent.map((item) => <div className="activity-row" key={item.id}>
      <CalendarDays size={18} className="shrink-0 text-muted" strokeWidth={1.6} />
      <div className="min-w-0 flex-1"><strong>{item.titulo}</strong><small>{TIPOS_ATIVIDADE.find((type) => type.valor === item.tipo)?.rotulo} · {formatarData(item.data_atividade.slice(0, 10))}</small></div>
      {item.tipo === 'tarefa' && <Badge tone={item.concluida ? 'success' : 'neutral'}>{item.concluida ? 'Concluída' : 'Pendente'}</Badge>}
    </div>)}
  </section>;
}
