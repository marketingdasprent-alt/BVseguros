import { RAMOS, ESTADOS_APOLICE } from '@/lib/types'
import type { Apolice, Cliente } from '@/lib/types'
import { Badge } from '@/components/ui/Badge'
import { TONE_ESTADO_APOLICE } from '@/lib/tone'
import { formatarMoeda } from '@/lib/format'
import { Button } from '@/components/ui/Button'

interface ApolicesTableProps {
  apolices: Apolice[]
  clientes: Cliente[]
  onEditar: (apolice: Apolice) => void
}

export function ApolicesTable({ apolices, clientes, onEditar }: ApolicesTableProps) {
  const nomeCliente = (id: string) => clientes.find((c) => c.id === id)?.nome ?? '—'
  const rotuloRamo = (ramo: Apolice['ramo']) => RAMOS.find((r) => r.valor === ramo)?.rotulo ?? ramo
  const rotuloEstado = (estado: Apolice['estado']) =>
    ESTADOS_APOLICE.find((e) => e.valor === estado)?.rotulo ?? estado

  return (
    <div className="table-panel">
      <div className="data-panel-heading">Carteira de apólices<span>{apolices.length} {apolices.length === 1 ? 'registo' : 'registos'}</span></div>
      <div role="region" aria-label="Lista de apolices" tabIndex={0} className="overflow-x-auto scroll-thin">
        <table className="crm-table w-full text-sm">
          <thead className="text-muted text-left">
            <tr>
              <th className="sticky left-0 z-10 font-semibold uppercase whitespace-nowrap">
                Nº apólice
              </th>
              <th className="font-semibold uppercase whitespace-nowrap">
                Cliente
              </th>
              <th className="font-semibold uppercase whitespace-nowrap">
                Ramo
              </th>
              <th className="font-semibold uppercase whitespace-nowrap">
                Seguradora
              </th>
              <th className="font-semibold uppercase whitespace-nowrap text-right">
                Prémio anual
              </th>
              <th className="font-semibold uppercase whitespace-nowrap">
                Estado
              </th>
              <th className="font-semibold uppercase whitespace-nowrap"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            {apolices.map((a) => (
              <tr key={a.id} className="border-t border-border hover:bg-ink/[0.02] transition-colors">
                <td className="sticky left-0 z-10 bg-white whitespace-nowrap">
                  {a.numero_apolice}
                </td>
                <td className="whitespace-nowrap">{nomeCliente(a.cliente_id)}</td>
                <td className="whitespace-nowrap">{rotuloRamo(a.ramo)}</td>
                <td className="whitespace-nowrap">{a.seguradora}</td>
                <td className="text-right tabular-nums whitespace-nowrap">
                  {a.premio_anual != null ? formatarMoeda(a.premio_anual) : '—'}
                </td>
                <td className="whitespace-nowrap">
                  <Badge tone={TONE_ESTADO_APOLICE[a.estado]}>{rotuloEstado(a.estado)}</Badge>
                </td>
                <td className="whitespace-nowrap text-right">
                  <Button size="sm" variant="ghost" onClick={() => onEditar(a)} aria-label={`Editar apólice ${a.numero_apolice}`}>Editar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
