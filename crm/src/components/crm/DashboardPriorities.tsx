import { Link } from 'react-router-dom';
import { ArrowUpRight, FileText, AlertTriangle, RefreshCw, Clock } from 'lucide-react';

interface DashboardPrioritiesProps { propostas: number; sinistros: number; renovacoes: number; tarefas: number; }

export function DashboardPriorities({ propostas, sinistros, renovacoes, tarefas }: DashboardPrioritiesProps) {
  const rows = [
    { title: 'Propostas em aberto', note: 'Rascunhos e propostas enviadas', value: propostas, to: '/propostas', icon: FileText, urgent: false },
    { title: 'Sinistros em aberto', note: 'Processos em acompanhamento', value: sinistros, to: '/sinistros', icon: AlertTriangle, urgent: false },
    { title: 'Renovações a vencer', note: 'Nos próximos 30 dias', value: renovacoes, to: '/renovacoes', icon: RefreshCw, urgent: renovacoes > 0 },
    { title: 'Tarefas em atraso', note: 'Prazo ultrapassado e por concluir', value: tarefas, to: '/atividades', icon: Clock, urgent: tarefas > 0 },
  ];
  return <section className="panel">
    <div className="panel-heading"><div><h2>Acompanhamento operacional</h2><p>O que precisa da sua atenção.</p></div></div>
    {rows.map(({ title, note, value, to, icon: Icon, urgent }) => <Link className="priority-row" to={to} key={to}>
      <Icon size={18} strokeWidth={1.6} /><div className="min-w-0"><strong>{title}</strong><small>{note}</small></div>
      <span className={`priority-count ${urgent ? 'text-warning-text' : ''}`}>{value}</span><ArrowUpRight size={14} className="text-muted shrink-0" />
    </Link>)}
  </section>;
}
