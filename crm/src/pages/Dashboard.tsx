import { useLeads } from '@/hooks/useLeads'
import { useClientes } from '@/hooks/useClientes'
import { useApolices } from '@/hooks/useApolices'
import { ESTADOS_LEAD } from '@/lib/types'
import { Spinner } from '@/components/ui/Spinner'

export default function Dashboard() {
  const { data: leads, isLoading: leadsCarregando } = useLeads()
  const { data: clientes, isLoading: clientesCarregando } = useClientes()
  const { data: apolices, isLoading: apolicesCarregando } = useApolices()

  const isLoading = leadsCarregando || clientesCarregando || apolicesCarregando
  if (isLoading) return <Spinner />

  const apolicesAtivas = apolices.filter((a) => a.estado === 'ativa').length

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl font-bold text-navy">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <CartaoKpi titulo="Leads em carteira" valor={leads.length} />
        <CartaoKpi titulo="Clientes" valor={clientes.length} />
        <CartaoKpi titulo="Apólices ativas" valor={apolicesAtivas} />
        <CartaoKpi
          titulo="Taxa de conversão"
          valor={leads.length === 0 ? '—' : `${Math.round((clientes.length / leads.length) * 100)}%`}
        />
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="font-medium text-ink mb-4">Leads por estado</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {ESTADOS_LEAD.map((estado) => (
            <div key={estado.valor} className="text-center">
              <p className="text-2xl font-bold text-navy">
                {leads.filter((l) => l.estado === estado.valor).length}
              </p>
              <p className="text-xs text-ink/50 mt-1">{estado.rotulo}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CartaoKpi({ titulo, valor }: { titulo: string; valor: string | number }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <p className="text-xs text-ink/50">{titulo}</p>
      <p className="text-2xl font-bold text-navy mt-1">{valor}</p>
    </div>
  )
}
