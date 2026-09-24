import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatarData } from '@/lib/format'
import type { AlteracaoAcesso, Profile } from '@/lib/types'

interface UtilizadoresTableProps {
  utilizadores: Profile[]
  idAtual: string | null
  idEmAlteracao: string | null
  onAlterar: (utilizador: Profile, alteracao: AlteracaoAcesso) => void
}

export function UtilizadoresTable({ utilizadores, idAtual, idEmAlteracao, onAlterar }: UtilizadoresTableProps) {
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
              <th className="font-semibold uppercase whitespace-nowrap">Criada em</th>
              <th className="font-semibold uppercase whitespace-nowrap"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            {utilizadores.map((u) => {
              const isProprio = u.id === idAtual
              const isAAlterar = u.id === idEmAlteracao
              return (
                <tr key={u.id} className="border-t border-border hover:bg-ink/[0.02] transition-colors">
                  <td className="sticky left-0 z-10 bg-white whitespace-nowrap">
                    {u.nome}
                    {isProprio && <span className="ml-2 text-xs text-muted">(a sua conta)</span>}
                  </td>
                  <td className="whitespace-nowrap">{u.email}</td>
                  <td className="whitespace-nowrap">
                    <Badge tone={u.ativo ? 'success' : 'warning'}>{u.ativo ? 'Ativa' : 'Sem acesso'}</Badge>
                  </td>
                  <td className="whitespace-nowrap">
                    <Badge tone={u.is_admin ? 'info' : 'neutral'}>{u.is_admin ? 'Administrador' : 'Mediador'}</Badge>
                  </td>
                  <td className="whitespace-nowrap">{formatarData(u.criado_em.slice(0, 10))}</td>
                  <td className="whitespace-nowrap">
                    {/* Tirar o próprio acesso deixava o admin fora do CRM a meio da sessão. */}
                    {!isProprio && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant={u.ativo ? 'destructive' : 'primary'} disabled={idEmAlteracao !== null} loading={isAAlterar}
                          onClick={() => onAlterar(u, { ativo: !u.ativo })}>
                          {u.ativo ? 'Retirar acesso' : 'Dar acesso'}
                        </Button>
                        <Button size="sm" variant="secondary" disabled={idEmAlteracao !== null}
                          onClick={() => onAlterar(u, { is_admin: !u.is_admin })}>
                          {u.is_admin ? 'Tornar mediador' : 'Tornar administrador'}
                        </Button>
                      </div>
                    )}
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
