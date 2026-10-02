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
import { ErroCarregar } from '@/components/ui/ErroCarregar'

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
    {loading ? <Spinner /> : error ? <ErroCarregar oQue="o resumo" erro={error} onTentarNovamente={() => sources.forEach((source) => { void source.recarregar(); })} /> : <>
      <DashboardMetrics leads={leads.data} clientes={resumo.data?.total_clientes ?? 0} apolices={resumo.data?.apolices_ativas ?? 0} />
      <div className="dashboard-columns">
        <DashboardPipeline leads={leads.data} />
        <DashboardPriorities propostas={resumo.data?.propostas_em_aberto ?? 0}
          sinistros={resumo.data?.sinistros_em_aberto ?? 0}
          renovacoes={resumo.data?.renovacoes_30_dias ?? 0} />
      </div>
      <DashboardActivity atividades={atividades.data} />
      <p className="flex flex-wrap items-center justify-between gap-2 text-meta text-muted"><span>Informação da carteira atual.</span><Link to="/renovacoes" className="text-link">Consultar renovações a 60 dias <ArrowUpRight size={13} /></Link></p>
    </>}
  </div>;
}
