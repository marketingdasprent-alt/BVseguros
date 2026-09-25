import { TIPOS_ATIVIDADE } from '@/lib/types'
import type { Atividade, Cliente, Lead } from '@/lib/types'
import { Badge } from '@/components/ui/Badge'
import { dataLocalIso, formatarData } from '@/lib/format'
import { Button } from '@/components/ui/Button'

interface AtividadesTableProps {
  atividades: Atividade[]
  leads: Lead[]
  clientes: Cliente[]
  onAlternarConcluida: (atividade: Atividade) => void
  onEditar: (atividade: Atividade) => void
}

export function AtividadesTable({ atividades, leads, clientes, onAlternarConcluida, onEditar }: AtividadesTableProps) {
  const nomeLigacao = (a: Atividade) => {
    if (a.lead_id) return leads.find((l) => l.id === a.lead_id)?.nome ?? '—'
    if (a.cliente_id) return clientes.find((c) => c.id === a.cliente_id)?.nome ?? '—'
    return '—'
  }
  const rotuloTipo = (tipo: Atividade['tipo']) => TIPOS_ATIVIDADE.find((t) => t.valor === tipo)?.rotulo ?? tipo
  const hoje = dataLocalIso()

  return (
    <div className="table-panel">
      <div className="data-panel-heading">Registo de atividades<span>{atividades.length} {atividades.length === 1 ? 'registo' : 'registos'}</span></div>
      <div role="region" aria-label="Lista de atividades" tabIndex={0} className="overflow-x-auto scroll-thin">
        <table className="crm-table w-full text-sm">
          <thead className="text-muted text-left">
            <tr>
              <th className="font-semibold uppercase whitespace-nowrap">Tipo</th>
              <th className="font-semibold uppercase whitespace-nowrap">Título</th>
              <th className="font-semibold uppercase whitespace-nowrap">Associado a</th>
              <th className="font-semibold uppercase whitespace-nowrap">Prazo</th>
              <th className="font-semibold uppercase whitespace-nowrap">Estado</th>
              <th className="font-semibold uppercase whitespace-nowrap"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            {atividades.map((a) => {
              const atrasada = a.tipo === 'tarefa' && !a.concluida && !!a.data_prevista && a.data_prevista < hoje
              return (
                <tr key={a.id} className="border-t border-border hover:bg-ink/[0.02] transition-colors">
                  <td className="whitespace-nowrap">{rotuloTipo(a.tipo)}</td>
                  <td className="font-medium text-ink whitespace-nowrap">{a.titulo}</td>
                  <td className="whitespace-nowrap">{nomeLigacao(a)}</td>
                  <td className={`whitespace-nowrap tabular-nums ${atrasada ? 'text-danger-text font-medium' : ''}`}>
                    {a.data_prevista ? formatarData(a.data_prevista) : '—'}
                  </td>
                  <td className="whitespace-nowrap">
                    {a.tipo === 'tarefa' ? (
                      <button aria-label={`${a.concluida ? 'Marcar pendente' : 'Concluir tarefa'}: ${a.titulo}`} onClick={() => onAlternarConcluida(a)} className="focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 rounded">
                        <Badge tone={a.concluida ? 'success' : 'neutral'}>
                          {a.concluida ? 'Concluída' : 'Pendente'}
                        </Badge>
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="whitespace-nowrap text-right">
                    <Button size="sm" variant="ghost" onClick={() => onEditar(a)} aria-label={`Editar ${a.titulo}`}>Editar</Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
