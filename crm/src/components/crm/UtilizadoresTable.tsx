import { Clock, Crown, Mail, PenLine, Send, ShieldCheck, ShieldOff, User, UserX } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { RowActions } from '@/components/ui/RowActions'
import type { AcaoLinha } from '@/components/ui/RowActions'
import { formatarDataRelativa } from '@/lib/format'
import type { AlteracaoAcesso, EstadoConta, Profile } from '@/lib/types'

interface UtilizadoresTableProps {
  utilizadores: Profile[]
  // Vazio quando a API não está configurada: a página mostra um aviso e aqui fica "—".
  estados: Record<string, EstadoConta>
  idAtual: string | null
  idEmAlteracao: string | null
  onAlterar: (utilizador: Profile, alteracao: AlteracaoAcesso) => void
  onEditarNome: (utilizador: Profile) => void
  onExcluir: (utilizador: Profile) => void
  onReenviarConvite: (utilizador: Profile) => void
}

export function UtilizadoresTable({
  utilizadores, estados, idAtual, idEmAlteracao, onAlterar, onEditarNome, onExcluir, onReenviarConvite,
}: UtilizadoresTableProps) {
  const acoesDe = (u: Profile): AcaoLinha[] => {
    const acoes: AcaoLinha[] = [{ rotulo: 'Editar nome', icone: PenLine, onSelect: () => onEditarNome(u) }]
    // Tirar o próprio acesso ou excluir-se deixava o admin fora do CRM a meio da sessão.
    if (u.id === idAtual) return acoes
    return [
      ...acoes,
      u.ativo
        ? { rotulo: 'Retirar acesso', icone: ShieldOff, onSelect: () => onAlterar(u, { ativo: false }) }
        : { rotulo: 'Dar acesso', icone: ShieldCheck, onSelect: () => onAlterar(u, { ativo: true }) },
      u.is_admin
        ? { rotulo: 'Tornar mediador', icone: User, onSelect: () => onAlterar(u, { is_admin: false }) }
        : { rotulo: 'Tornar administrador', icone: Crown, onSelect: () => onAlterar(u, { is_admin: true }) },
      { rotulo: 'Excluir conta', icone: UserX, perigo: true, separadorAntes: true, onSelect: () => onExcluir(u) },
    ]
  }

  return (
    <div className="table-panel">
      <div className="data-panel-heading">Contas do CRM<span>{utilizadores.length} {utilizadores.length === 1 ? 'conta' : 'contas'}</span></div>
      <div role="region" aria-label="Lista de utilizadores" tabIndex={0} className="overflow-x-auto scroll-thin">
        <table className="crm-table w-full text-sm">
          <thead className="text-muted text-left">
            <tr>
              <th className="sticky left-0 z-10 font-semibold uppercase whitespace-nowrap">Nome</th>
              <th className="font-semibold uppercase whitespace-nowrap">Email</th>
              <th className="font-semibold uppercase whitespace-nowrap">Estado</th>
              <th className="font-semibold uppercase whitespace-nowrap">Perfil</th>
              <th className="font-semibold uppercase whitespace-nowrap">Último acesso</th>
              <th className="font-semibold uppercase whitespace-nowrap"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            {utilizadores.map((u) => {
              const isProprio = u.id === idAtual
              const estado = estados[u.id]
              return (
                <tr key={u.id} className="border-t border-border hover:bg-ink/[0.02] transition-colors">
                  <td className="sticky left-0 z-10 bg-white whitespace-nowrap">
                    {/* Texto corrido, não flex: a coluna fixa usa overflow-wrap:anywhere e um item
                        flex encolhia até uma letra por linha. */}
                    {u.nome}
                    {isProprio && <Badge className="ml-2 align-middle">Você</Badge>}
                  </td>
                  <td className="whitespace-nowrap">{u.email}</td>
                  <td className="whitespace-nowrap">
                    <div className="flex gap-1.5">
                      <Badge tone={u.ativo ? 'success' : 'warning'}>{u.ativo ? 'Ativa' : 'Sem acesso'}</Badge>
                      {estado?.convitePendente && (
                        <Badge tone="info"><Mail size={12} className="mr-1" aria-hidden="true" />Convite pendente</Badge>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap">
                    <Badge tone={u.is_admin ? 'info' : 'neutral'}>{u.is_admin ? 'Administrador' : 'Mediador'}</Badge>
                  </td>
                  <td className="whitespace-nowrap text-xs tabular-nums text-muted">
                    {!estado ? '—' : estado.ultimoAcesso ? formatarDataRelativa(estado.ultimoAcesso) : (
                      <span className="inline-flex items-center gap-1.5"><Clock size={12} aria-hidden="true" />Nunca entrou</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {estado?.convitePendente && !isProprio && (
                        <Button size="sm" variant="secondary" icon={<Send />} disabled={idEmAlteracao !== null}
                          loading={u.id === idEmAlteracao} onClick={() => onReenviarConvite(u)}>
                          Reenviar convite
                        </Button>
                      )}
                      <RowActions rotulo={`Ações da conta de ${u.nome}`} acoes={acoesDe(u)} desativado={idEmAlteracao !== null} />
                    </div>
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
