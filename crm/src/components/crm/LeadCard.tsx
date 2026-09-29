import { CalendarClock, StickyNote } from 'lucide-react'
import { KanbanCard, semArrasto } from '@/components/crm/KanbanCard'
import { Badge } from '@/components/ui/Badge'
import { Pessoa } from '@/components/ui/Pessoa'
import { dataLocalIso, formatarData } from '@/lib/format'
import { RAMOS } from '@/lib/types'
import type { Atividade, Lead } from '@/lib/types'

interface LeadCardProps {
  lead: Lead
  nomeResponsavel: string | null
  podeAtribuir: boolean
  // Os opcionais faltam quando o grupo não tem essa permissão: o link não aparece.
  onAssumir?: (lead: Lead) => void
  onAtribuir: (lead: Lead) => void
  onEditar?: (lead: Lead) => void
  numAtividades: number
  proximaTarefa: Atividade | null
  onAtividades?: (lead: Lead) => void
}

export function LeadCard({ lead, nomeResponsavel, podeAtribuir, onAssumir, onAtribuir, onEditar, numAtividades, proximaTarefa, onAtividades }: LeadCardProps) {
  const ramoRotulo = RAMOS.find((r) => r.valor === lead.ramo_interesse)?.rotulo ?? lead.ramo_interesse
  const prazo = proximaTarefa?.data_prevista
  const atrasada = !!prazo && prazo < dataLocalIso()

  return (
    <KanbanCard id={lead.id}>
      <p className="font-medium text-sm text-ink">{lead.nome}</p>
      <p className="text-xs text-muted tabular-nums">{lead.telefone}</p>
      <div className="flex flex-wrap gap-1.5">
        <Badge tone="info">{ramoRotulo}</Badge>
        {lead.origem === 'site' && <Badge tone="success">Site</Badge>}
      </div>
      {lead.mensagem && (
        <p className="text-xs text-muted line-clamp-3" title={lead.mensagem}>
          “{lead.mensagem}”
        </p>
      )}
      {lead.notas && (
        <p className="flex gap-1.5 text-xs text-ink" title={lead.notas}>
          <StickyNote size={12} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
          <span className="line-clamp-2">{lead.notas}</span>
        </p>
      )}
      {proximaTarefa && (
        <p className={`flex gap-1.5 text-xs ${atrasada ? 'font-medium text-danger-text' : 'text-ink'}`}
          title={atrasada ? 'Próximo passo em atraso' : 'Próximo passo'}>
          <CalendarClock size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
          {/* Título e prazo em linhas separadas: cortado, o título escondia a data. */}
          <span className="min-w-0">
            <span className="line-clamp-1">{proximaTarefa.titulo}</span>
            {prazo && <span className="block tabular-nums">{atrasada ? 'Atrasada desde' : 'Até'} {formatarData(prazo)}</span>}
          </span>
        </p>
      )}
      <div className="card-actions">
        <Pessoa nome={lead.responsavel_id ? nomeResponsavel ?? 'Atribuído' : null} />
        <span className="card-actions-links">
          {onAtividades && (
            <button type="button" {...semArrasto} onClick={() => onAtividades(lead)} aria-label={`Atividades de ${lead.nome} (${numAtividades})`}>
              Atividades{numAtividades > 0 && ` (${numAtividades})`}
            </button>
          )}
          {onEditar && (
            <button type="button" {...semArrasto} onClick={() => onEditar(lead)} aria-label={`Editar ${lead.nome}`}>
              Editar
            </button>
          )}
          {podeAtribuir ? (
            <button type="button" {...semArrasto} onClick={() => onAtribuir(lead)} aria-label={`Atribuir ${lead.nome}`}>
              Atribuir
            </button>
          ) : (
            !lead.responsavel_id && onAssumir && (
              <button type="button" {...semArrasto} onClick={() => onAssumir(lead)} aria-label={`Assumir ${lead.nome}`}>
                Assumir
              </button>
            )
          )}
        </span>
      </div>
    </KanbanCard>
  )
}
