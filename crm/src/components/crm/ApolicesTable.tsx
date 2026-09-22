import { RAMOS, ESTADOS_APOLICE } from '@/lib/types'
import type { Apolice, Cliente } from '@/lib/types'

interface ApolicesTableProps {
  apolices: Apolice[]
  clientes: Cliente[]
}

export function ApolicesTable({ apolices, clientes }: ApolicesTableProps) {
  const nomeCliente = (id: string) => clientes.find((c) => c.id === id)?.nome ?? '—'
  const rotuloRamo = (ramo: Apolice['ramo']) => RAMOS.find((r) => r.valor === ramo)?.rotulo ?? ramo
  const rotuloEstado = (estado: Apolice['estado']) =>
    ESTADOS_APOLICE.find((e) => e.valor === estado)?.rotulo ?? estado

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-ink/[0.03] text-ink/50 text-left">
          <tr>
            <th className="px-4 py-3 font-medium">Nº apólice</th>
            <th className="px-4 py-3 font-medium">Cliente</th>
            <th className="px-4 py-3 font-medium">Ramo</th>
            <th className="px-4 py-3 font-medium">Seguradora</th>
            <th className="px-4 py-3 font-medium">Prémio anual</th>
            <th className="px-4 py-3 font-medium">Estado</th>
          </tr>
        </thead>
        <tbody>
          {apolices.map((a) => (
            <tr key={a.id} className="border-t border-ink/5">
              <td className="px-4 py-3">{a.numero_apolice}</td>
              <td className="px-4 py-3">{nomeCliente(a.cliente_id)}</td>
              <td className="px-4 py-3">{rotuloRamo(a.ramo)}</td>
              <td className="px-4 py-3">{a.seguradora}</td>
              <td className="px-4 py-3">{a.premio_anual != null ? `€${a.premio_anual.toFixed(2)}` : '—'}</td>
              <td className="px-4 py-3">{rotuloEstado(a.estado)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
