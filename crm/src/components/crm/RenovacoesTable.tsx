import { Link } from 'react-router-dom'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { Pencil, Phone, RefreshCw } from 'lucide-react'
import { ESTADOS_RENOVACAO } from '@/lib/types'
import type { Cliente } from '@/lib/types'
import type { RenovacaoItem } from '@/hooks/useRenovacoes'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { RowActions } from '@/components/ui/RowActions'
import { TONE_ESTADO_RENOVACAO } from '@/lib/tone'
import { formatarData } from '@/lib/format'

interface RenovacoesTableProps {
  itens: RenovacaoItem[]
  clientes: Cliente[]
  onMarcarContactado: (item: RenovacaoItem) => void
  onAbrirRenovar: (item: RenovacaoItem) => void
  onEditar: (item: RenovacaoItem) => void
}

export function RenovacoesTable({ itens, clientes, onMarcarContactado, onAbrirRenovar, onEditar }: RenovacoesTableProps) {
  const nomeCliente = (id: string) => clientes.find((c) => c.id === id)?.nome ?? '—'

  return (
    <div className="table-panel">
      <div className="data-panel-heading">Próximas renovações<span>{itens.length} {itens.length === 1 ? 'registo' : 'registos'}</span></div>
      <div role="region" aria-label="Lista de renovacoes" tabIndex={0} className="overflow-x-auto scroll-thin">
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
                Vencimento
              </th>
              <th className="font-semibold uppercase whitespace-nowrap">
                Estado
              </th>
              <th className="font-semibold uppercase whitespace-nowrap"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item) => {
              const { apolice, renovacao } = item
              const dias = differenceInCalendarDays(parseISO(apolice.data_fim as string), new Date())
              const corUrgencia = dias < 15 ? 'text-danger-text' : dias < 30 ? 'text-warning-text' : 'text-ink'
              const estado = renovacao?.estado ?? 'pendente'
              const estadoRotulo = ESTADOS_RENOVACAO.find((e) => e.valor === estado)?.rotulo ?? estado
              const renovada = estado === 'renovada'

              return (
                <tr key={apolice.id} className="border-t border-border hover:bg-ink/[0.02] transition-colors">
                  <td className="sticky left-0 z-10 bg-white whitespace-nowrap">
                    {apolice.numero_apolice}
                  </td>
                  <td className="whitespace-nowrap"><Link to={`/clientes/${apolice.cliente_id}`} className="hover:underline underline-offset-2">{nomeCliente(apolice.cliente_id)}</Link></td>
                  <td className={`font-medium tabular-nums whitespace-nowrap ${corUrgencia}`}>
                    {formatarData(apolice.data_fim as string)}{' '}
                    <span className="text-xs font-normal">({dias} dias)</span>
                  </td>
                  <td className="whitespace-nowrap">
                    <Badge tone={TONE_ESTADO_RENOVACAO[estado]}>{estadoRotulo}</Badge>
                    {renovacao?.notas && (
                      <p className="mt-1.5 max-w-[240px] truncate text-[11px] text-muted" title={renovacao.notas}>{renovacao.notas}</p>
                    )}
                  </td>
                  <td className="whitespace-nowrap">
                    {/* Uma ação visível (a próxima lógica); as restantes no menu. */}
                    <div className="flex items-center justify-end gap-1">
                      {estado === 'pendente' && (
                        <Button variant="secondary" size="sm" icon={<Phone />} onClick={() => onMarcarContactado(item)}>
                          Marcar contactado
                        </Button>
                      )}
                      {(estado === 'contactado' || estado === 'nao_renovada') && (
                        <Button variant="primary" size="sm" icon={<RefreshCw />} onClick={() => onAbrirRenovar(item)}>
                          Marcar renovada
                        </Button>
                      )}
                      {renovada && (
                        <Button variant="ghost" size="sm" icon={<Pencil />} onClick={() => onEditar(item)}>
                          Editar notas
                        </Button>
                      )}
                      {!renovada && (
                        <RowActions
                          rotulo={`Mais ações da renovação da apólice ${apolice.numero_apolice}`}
                          acoes={[
                            ...(estado === 'pendente'
                              ? [{ rotulo: 'Marcar renovada', icone: RefreshCw, onSelect: () => onAbrirRenovar(item) }]
                              : []),
                            { rotulo: 'Editar', icone: Pencil, onSelect: () => onEditar(item) },
                          ]}
                        />
                      )}
                    </div>                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
