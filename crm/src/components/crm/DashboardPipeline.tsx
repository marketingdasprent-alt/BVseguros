import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ESTADOS_LEAD } from '@/lib/types';
import { TONE_BAR_CLASS, TONE_ESTADO_LEAD } from '@/lib/tone';
import type { Lead } from '@/lib/types';

interface DashboardPipelineProps { leads: Lead[]; }

export function DashboardPipeline({ leads }: DashboardPipelineProps) {
  return <section className="panel">
    <div className="panel-heading"><div><h2>Leads por estado</h2><p>Distribuição atual do pipeline comercial.</p></div><Link to="/leads" className="text-link">Ver leads <ArrowUpRight size={14} /></Link></div>
    <div className="py-3">
      {ESTADOS_LEAD.map(({ valor, rotulo }) => {
        const count = leads.filter((lead) => lead.estado === valor).length;
        return <div className="pipeline-row" key={valor}>
          <span className="pipeline-label"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TONE_BAR_CLASS[TONE_ESTADO_LEAD[valor]]}`} />{rotulo}</span>
          <div className="pipeline-track" aria-hidden="true"><span className={TONE_BAR_CLASS[TONE_ESTADO_LEAD[valor]]} style={{ width: `${leads.length ? count / leads.length * 100 : 0}%` }} /></div>
          <strong className="text-right tabular-nums font-semibold">{count}</strong>
        </div>;
      })}
    </div>
    {leads.length === 0 && <p className="px-6 pb-5 text-xs text-muted">Os contactos que registar aparecem nas etapas acima.</p>}
  </section>;
}
