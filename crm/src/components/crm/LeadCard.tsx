import { KanbanCard, semArrasto, CLASSE_ACAO_CARTAO } from '@/components/crm/KanbanCard'
import { Badge } from '@/components/ui/Badge'
import { RAMOS } from '@/lib/types'
import type { Lead } from '@/lib/types'

interface LeadCardProps {
  lead: Lead
  nomeResponsavel: string | null
  podeAtribuir: boolean
  onAssumir: (lead: Lead) => void
  onAtribuir: (lead: Lead) => void
  onEditar: (lead: Lead) => void
}

export function LeadCard({ lead, nomeResponsavel, podeAtribuir, onAssumir, onAtribuir, onEditar }: LeadCardProps) {
  const ramoRotulo = RAMOS.find((r) => r.valor === lead.ramo_interesse)?.rotulo ?? lead.ramo_interesse

  return (
    <KanbanCard id={lead.id}>
      <p className="font-medium text-sm text-ink">{lead.nome}</p>
      <p className="text-xs text-muted">{lead.telefone}</p>
      <div className="flex flex-wrap gap-1.5">
        <Badge tone="info">{ramoRotulo}</Badge>
        {lead.origem === 'site' && <Badge tone="success">Site</Badge>}
      </div>
      {lead.mensagem && (
        <p className="text-xs text-muted line-clamp-3" title={lead.mensagem}>
          “{lead.mensagem}”
        </p>
      )}
      {lead.notas && <p className="text-xs text-ink line-clamp-2" title={lead.notas}>{lead.notas}</p>}
      <div className="flex items-center justify-between gap-2 border-t border-border pt-2 text-xs">
        <span className={lead.responsavel_id ? 'text-ink' : 'text-muted'}>
          {lead.responsavel_id ? nomeResponsavel ?? 'Atribuído' : 'Sem responsável'}
        </span>
        <span className="flex gap-3">
          <button type="button" {...semArrasto} onClick={() => onEditar(lead)} className={CLASSE_ACAO_CARTAO}
            aria-label={`Editar ${lead.nome}`}>
            Editar
          </button>
          {podeAtribuir ? (
            <button type="button" {...semArrasto} onClick={() => onAtribuir(lead)} className={CLASSE_ACAO_CARTAO}>
              Atribuir
            </button>
          ) : (
            !lead.responsavel_id && (
              <button type="button" {...semArrasto} onClick={() => onAssumir(lead)} className={CLASSE_ACAO_CARTAO}>
                Assumir
              </button>
            )
          )}
        </span>
      </div>
    </KanbanCard>
  )
}
