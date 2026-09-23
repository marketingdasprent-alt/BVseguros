import { Users, Contact, Shield, TrendingUp } from 'lucide-react';
import type { Lead } from '@/lib/types';

interface DashboardMetricsProps { leads: Lead[]; clientes: number; apolices: number; }

export function DashboardMetrics({ leads, clientes, apolices }: DashboardMetricsProps) {
  const converted = leads.filter((lead) => lead.estado === 'convertido').length;
  const metrics = [
    { title: 'Leads em carteira', value: leads.length, note: 'Todos os contactos registados', icon: Users },
    { title: 'Clientes', value: clientes, note: 'Na sua carteira de clientes', icon: Contact },
    { title: 'Apólices ativas', value: apolices, note: 'Contratos com estado ativo', icon: Shield },
    { title: 'Taxa de conversão', value: leads.length ? `${Math.round(converted / leads.length * 100)}%` : '—', note: `${converted} de ${leads.length} leads convertidos`, icon: TrendingUp },
  ];
  return <section aria-label="Resumo da carteira" className="metrics-strip">
    {metrics.map(({ title, value, note, icon: Icon }) => <div className="metric" key={title}>
      <div className="metric-label"><span>{title}</span><Icon size={17} strokeWidth={1.6} /></div>
      <strong className="metric-value">{value}</strong><span className="metric-note">{note}</span>
    </div>)}
  </section>;
}
