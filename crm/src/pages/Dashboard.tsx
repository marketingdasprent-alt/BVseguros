import { format } from 'date-fns';
import { CalendarDays, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { DashboardMetrics } from '@/components/crm/DashboardMetrics';
import { DashboardPipeline } from '@/components/crm/DashboardPipeline';
import { DashboardPriorities } from '@/components/crm/DashboardPriorities';
import { DashboardActivity } from '@/components/crm/DashboardActivity';
import { useLeads } from '@/hooks/useLeads';
import { useAtividades } from '@/hooks/useAtividades';
import { useDashboardResumo } from '@/hooks/useDashboardResumo';

export default function Dashboard() {
  const leads = useLeads();
  const atividades = useAtividades();
  const resumo = useDashboardResumo();
  const sources = [leads, atividades, resumo];
  const loading = sources.some((source) => source.isLoading);
  const error = sources.find((source) => source.error)?.error;
  const today = new Date();
  return <div className="space-y-6">
    <PageHeader title="Dashboard" description="A sua carteira, os seus contactos e as prioridades do dia."
      action={<span className="inline-flex items-center gap-2 text-xs text-muted"><CalendarDays size={15} />{new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' }).format(today)}</span>} />
    {loading ? <Spinner /> : error ? <div className="panel p-6" role="alert"><h2 className="font-semibold text-danger-text">Não foi possível carregar o resumo</h2><p className="mt-2 text-sm text-muted">{error.message}</p><button className="text-link mt-4" onClick={() => sources.forEach((source) => { void source.recarregar(); })}>Tentar novamente <ArrowUpRight size={14} /></button></div> : <>
      <DashboardMetrics leads={leads.data} clientes={resumo.data?.total_clientes ?? 0} apolices={resumo.data?.apolices_ativas ?? 0} />
      <div className="dashboard-columns">
        <DashboardPipeline leads={leads.data} />
        <DashboardPriorities propostas={resumo.data?.propostas_em_aberto ?? 0}
          sinistros={resumo.data?.sinistros_em_aberto ?? 0}
          renovacoes={resumo.data?.renovacoes_30_dias ?? 0} tarefas={atividades.data.filter((item) => item.tipo === 'tarefa' && !item.concluida && !!item.data_prevista && item.data_prevista < format(today, 'yyyy-MM-dd')).length} />
      </div>
      <DashboardActivity atividades={atividades.data} />
      <p className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted"><span>Informação da carteira atual.</span><Link to="/renovacoes" className="text-link">Consultar renovações a 60 dias <ArrowUpRight size={13} /></Link></p>
    </>}
  </div>;
}
