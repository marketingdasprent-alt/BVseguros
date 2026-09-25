import { AlertTriangle, Crown, History, PenLine, ShieldCheck, ShieldOff, User, UserPlus, UserX, type LucideIcon } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatarDataRelativa } from '@/lib/format'
import { ROTULOS_ALTERACAO } from '@/lib/types'
import type { AlteracaoRegistada, EventoAcesso } from '@/lib/types'

interface HistoricoAcessosProps {
  eventos: EventoAcesso[]
  isLoading: boolean
  error: Error | null
  onTentarNovamente: () => void
}

const MAX_EVENTOS = 20

const ICONES: Record<AlteracaoRegistada, LucideIcon> = {
  convidado: UserPlus,
  acesso_dado: ShieldCheck,
  acesso_retirado: ShieldOff,
  tornado_admin: Crown,
  tornado_mediador: User,
  nome_alterado: PenLine,
  excluido: UserX,
}

export function HistoricoAcessos({ eventos, isLoading, error, onTentarNovamente }: HistoricoAcessosProps) {
  return (
    <section className="panel" aria-labelledby="historico-acessos">
      <div className="panel-heading">
        <div>
          <h2 id="historico-acessos">Histórico de acessos</h2>
          <p>Últimas {MAX_EVENTOS} alterações de acesso, de quem para quem.</p>
        </div>
      </div>
      {isLoading && <div className="flex min-h-[160px] items-center justify-center"><Spinner /></div>}
      {error && (
        <div className="p-6">
          <Notice tone="danger" icon={AlertTriangle} alerta
            action={<Button variant="secondary" size="sm" onClick={onTentarNovamente}>Tentar novamente</Button>}>
            Não foi possível carregar o histórico: {error.message}
          </Notice>
        </div>
      )}
      {!isLoading && !error && eventos.length === 0 && (
        <EmptyState icon={History} titulo="Sem alterações registadas" descricao="Cada vez que alguém dá ou retira acesso, fica aqui registado." />
      )}
      {!isLoading && !error && eventos.length > 0 && (
        <ul>
          {eventos.slice(0, MAX_EVENTOS).map((e) => {
            const Icone = ICONES[e.alteracao] ?? History
            return (
              <li key={e.id} className="activity-row">
                <Icone size={16} className="shrink-0 text-[#72839a]" aria-hidden="true" />
                <div className="min-w-0">
                  <strong>
                    <span className="font-semibold">{e.realizado_por_nome ?? 'Supabase (SQL)'}</span>{' '}
                    {e.alteracao === 'nome_alterado' && e.nome_anterior
                      ? <>mudou o nome de <span className="font-semibold">{e.nome_anterior}</span> para</>
                      : ROTULOS_ALTERACAO[e.alteracao]}{' '}
                    <span className="font-semibold">{e.perfil_nome}</span>
                  </strong>
                  <small><time dateTime={e.criado_em}>{formatarDataRelativa(e.criado_em)}</time></small>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
