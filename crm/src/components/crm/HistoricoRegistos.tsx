import { Download, EyeOff, History, PenLine, Plus, Trash2 } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatarDataRelativa } from '@/lib/format'
import { descreverAlteracoes, NOME_TABELA, type EntradaHistorico } from '@/lib/historico'
import { ErroCarregar } from '@/components/ui/ErroCarregar'

interface HistoricoRegistosProps {
  entradas: EntradaHistorico[]
  isLoading: boolean
  error: Error | null
  nomePessoa: (id: string) => string | undefined
  onTentarNovamente: () => void
}

const ICONE = { criado: Plus, alterado: PenLine, apagado: Trash2, exportado: Download, anonimizado: EyeOff }
const VERBO = { criado: 'criou', alterado: 'alterou', apagado: 'apagou', exportado: 'exportou', anonimizado: 'anonimizou' }

// Fechado por omissão: é consulta ocasional e não deve empurrar o resto da ficha.
export function HistoricoRegistos({ entradas, isLoading, error, nomePessoa, onTentarNovamente }: HistoricoRegistosProps) {
  return (
    <details className="panel group">
      <summary className="panel-heading cursor-pointer list-none">
        <div>
          <h2>Histórico de alterações <span className="ml-1 text-xs font-normal text-muted">{entradas.length}</span></h2>
          <p>Quem criou, mudou ou apagou o quê, neste cliente e nas apólices, propostas e sinistros dele.</p>
        </div>
        <span className="text-link group-open:hidden">Mostrar</span>
        <span className="text-link hidden group-open:inline">Esconder</span>
      </summary>
      {isLoading && <div className="flex min-h-[120px] items-center justify-center"><Spinner /></div>}
      {error && (
        <div className="p-6">
          <ErroCarregar oQue="o histórico" erro={error} onTentarNovamente={onTentarNovamente} />
        </div>
      )}
      {!isLoading && !error && entradas.length === 0 && <EmptyState icon={History} titulo="Sem alterações registadas" />}
      {!isLoading && !error && entradas.length > 0 && (
        <ul>
          {entradas.map((e) => {
            const Icone = ICONE[e.acao]
            const detalhes = e.acao === 'alterado' ? descreverAlteracoes(e, nomePessoa) : []
            return (
              <li key={e.id} className="activity-row items-start">
                <Icone size={16} className="mt-0.5 shrink-0 text-muted-soft" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <strong>
                    <span className="font-semibold">{e.autor_nome ?? 'Sistema'}</span> {VERBO[e.acao]} {e.acao === 'exportado' ? 'os dados do cliente' : NOME_TABELA[e.tabela]}{' '}
                    <span className="font-semibold">{e.resumo ?? ''}</span>
                  </strong>
                  {detalhes.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5 text-small text-ink">
                      {detalhes.map((d) => <li key={d}>{d}</li>)}
                    </ul>
                  )}
                  <small><time dateTime={e.criado_em}>{formatarDataRelativa(e.criado_em)}</time></small>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </details>
  )
}
