import { FolderOpen } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ESTADOS_PEDIDO_SINISTRO, RAMOS } from '@/lib/types'
import type { PedidoSinistro } from '@/lib/types'
import { TONE_ESTADO_PEDIDO_SINISTRO } from '@/lib/tone'
import { formatarData, formatarDataRelativa } from '@/lib/format'

interface PedidosSinistroTabelaProps {
  pedidos: PedidoSinistro[]
  onAbrir: (pedido: PedidoSinistro) => void
}

const rotuloRamo = (ramo: string) => RAMOS.find((r) => r.valor === ramo)?.rotulo ?? ramo
const rotuloEstado = (estado: string) => ESTADOS_PEDIDO_SINISTRO.find((e) => e.valor === estado)?.rotulo ?? estado

export function PedidosSinistroTabela({ pedidos, onAbrir }: PedidosSinistroTabelaProps) {
  return (
    <div className="table-panel">
      <div className="data-panel-heading">
        Pedidos de sinistro do site<span>{pedidos.length} {pedidos.length === 1 ? 'pedido' : 'pedidos'}</span>
      </div>
      <div role="region" aria-label="Pedidos de sinistro do site" tabIndex={0} className="overflow-x-auto scroll-thin">
        <table className="crm-table w-full text-sm">
          <thead className="text-muted text-left">
            <tr>
              <th className="font-semibold uppercase whitespace-nowrap">Recebido</th>
              <th className="font-semibold uppercase whitespace-nowrap">Nome</th>
              <th className="font-semibold uppercase whitespace-nowrap">Ramo</th>
              <th className="font-semibold uppercase whitespace-nowrap">Ocorrência</th>
              <th className="font-semibold uppercase whitespace-nowrap">Estado</th>
              <th className="font-semibold uppercase whitespace-nowrap"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((p) => (
              <tr key={p.id} className="border-t border-border hover:bg-ink/[0.02] transition-colors">
                <td className="whitespace-nowrap text-muted" title={formatarData(p.criado_em)}>{formatarDataRelativa(p.criado_em)}</td>
                <td className="min-w-[10rem]">
                  <span className="font-medium text-ink">{p.nome}</span>
                  <span className="block text-xs text-muted">{p.telefone}</span>
                </td>
                <td className="whitespace-nowrap">{rotuloRamo(p.ramo)}</td>
                <td className="whitespace-nowrap tabular-nums">{formatarData(p.data_ocorrencia)}</td>
                <td><Badge tone={TONE_ESTADO_PEDIDO_SINISTRO[p.estado]}>{rotuloEstado(p.estado)}</Badge></td>
                <td className="text-right">
                  <Button size="sm" variant="ghost" icon={<FolderOpen />} onClick={() => onAbrir(p)} aria-label={`Abrir pedido de ${p.nome}`}>
                    Abrir
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
