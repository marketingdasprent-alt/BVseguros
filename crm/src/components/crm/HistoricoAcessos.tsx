import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ROTULOS_ALTERACAO } from '@/lib/types'
import type { EventoAcesso } from '@/lib/types'

interface HistoricoAcessosProps {
  eventos: EventoAcesso[]
  isLoading: boolean
  error: Error | null
}

const MAX_EVENTOS = 20
// Hora local de quem vê; cortar a string ISO mostrava a hora UTC.
const dataHora = new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short', timeStyle: 'short' })

export function HistoricoAcessos({ eventos, isLoading, error }: HistoricoAcessosProps) {
  return (
    <section className="panel" aria-labelledby="historico-acessos">
      <div className="panel-heading">
        <h2 id="historico-acessos" className="font-display text-base font-semibold text-navy">Histórico de acessos</h2>
      </div>
      {isLoading && <div className="p-6"><Spinner /></div>}
      {error && <p role="alert" className="m-6 rounded-lg bg-danger-bg p-4 text-sm text-danger-text">Erro ao carregar o histórico: {error.message}</p>}
      {!isLoading && !error && eventos.length === 0 && (
        <EmptyState titulo="Sem alterações registadas" descricao="Cada vez que alguém dá ou retira acesso, fica aqui registado." />
      )}
      {!isLoading && !error && eventos.length > 0 && (
        <ul className="divide-y divide-border">
          {eventos.slice(0, MAX_EVENTOS).map((e) => (
            <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-2 px-6 py-3 text-sm">
              <span className="text-ink">
                <strong className="font-medium">{e.realizado_por_nome ?? 'Supabase (SQL)'}</strong>{' '}
                {e.alteracao === 'nome_alterado' && e.nome_anterior ? <>mudou o nome de <strong className="font-medium">{e.nome_anterior}</strong> para</> : ROTULOS_ALTERACAO[e.alteracao]}{' '}
                <strong className="font-medium">{e.perfil_nome}</strong>
              </span>
              <time dateTime={e.criado_em} className="text-xs text-muted">
                {dataHora.format(new Date(e.criado_em))}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
