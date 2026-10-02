import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Copy, KeyRound, PenLine, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { RowActions } from '@/components/ui/RowActions'
import { GrupoModal } from '@/components/crm/GrupoModal'
import { useGrupos, guardarGrupo, apagarGrupo } from '@/hooks/useGrupos'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { useConfirmarApagar } from '@/hooks/useConfirmarApagar'
import { mensagemErro } from '@/lib/erros'
import { MODULOS } from '@/lib/permissoes'
import type { GrupoComPermissoes, GrupoEdicao } from '@/lib/types'
import { ErroCarregar } from '@/components/ui/ErroCarregar'

// "Edita 5 · Vê 2": o resumo que cabe numa linha da tabela.
function resumoAcesso(g: GrupoComPermissoes) {
  const edita = MODULOS.filter((m) => g.permissoes[m.id].nivel === 'editar').length
  const ve = MODULOS.filter((m) => g.permissoes[m.id].nivel === 'ver').length
  if (!edita && !ve) return 'Sem acesso a nenhum módulo'
  return [edita && `Edita ${edita}`, ve && `Vê ${ve}`].filter(Boolean).join(' · ')
}

export default function Grupos() {
  const { isAdmin } = useAuth()
  const { data: grupos, isLoading, error, recarregar } = useGrupos()
  const { toast } = useToast()
  const [modal, setModal] = useState<{ inicial?: { id?: string } & Partial<GrupoEdicao> } | null>(null)
  const [aGuardar, setAGuardar] = useState(false)
  const { pedirConfirmacao, modalApagar } = useConfirmarApagar(recarregar)

  // Esconder é só UX: quem garante que só o admin gere grupos é a RLS e guardar_grupo.
  if (!isAdmin) return <Navigate to="/" replace />

  const handleGuardar = async (id: string | undefined, dados: GrupoEdicao) => {
    setAGuardar(true)
    try {
      await guardarGrupo(id ?? null, dados)
      await recarregar()
      setModal(null)
      toast({ title: id ? 'Grupo atualizado' : 'Grupo criado' })
    } catch (err: unknown) {
      toast({ title: 'Não foi possível guardar o grupo', description: mensagemErro(err), variant: 'destructive' })
    } finally {
      setAGuardar(false)
    }
  }

  const handlePedirApagar = (g: GrupoComPermissoes) => {
    setModal(null)
    pedirConfirmacao({
      acao: 'Apagar grupo', nome: `o grupo ${g.nome}`, mensagemSucesso: 'Grupo apagado',
      aviso: g.membros > 0 ? `Tem ${g.membros === 1 ? '1 pessoa: mude-a' : `${g.membros} pessoas: mude-as`} para outro grupo em Utilizadores antes de o apagar.` : undefined,
      apagar: () => apagarGrupo(g.id),
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Grupos"
        description="O que cada grupo pode ver e fazer no CRM. Cada utilizador pertence a um grupo; o administrador tem sempre acesso a tudo."
        action={<Button icon={<Plus />} onClick={() => setModal({})}>Novo grupo</Button>} />

      {isLoading && <Spinner />}
      {error && (
        <ErroCarregar oQue="os grupos" erro={error} onTentarNovamente={() => recarregar()} />
      )}
      {!isLoading && !error && grupos.length === 0 && (
        <div className="panel">
          <EmptyState icon={KeyRound} titulo="Sem grupos" descricao="Crie um grupo para dar acesso ao CRM a quem não é administrador."
            action={<Button variant="secondary" onClick={() => setModal({})}>Criar grupo</Button>} />
        </div>
      )}
      {!isLoading && !error && grupos.length > 0 && (
        <div className="table-panel">
          <div className="data-panel-heading">Grupos<span>{grupos.length} {grupos.length === 1 ? 'grupo' : 'grupos'}</span></div>
          <div role="region" aria-label="Lista de grupos" tabIndex={0} className="overflow-x-auto scroll-thin">
            <table className="crm-table w-full text-sm">
              <thead className="text-left text-muted">
                <tr>
                  <th className="font-semibold uppercase">Grupo</th>
                  <th className="font-semibold uppercase whitespace-nowrap">Carteira</th>
                  <th className="font-semibold uppercase whitespace-nowrap">Acesso</th>
                  <th className="text-right font-semibold uppercase">Pessoas</th>
                  <th className="font-semibold uppercase"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {grupos.map((g) => (
                  <tr key={g.id} className="border-t border-border">
                    <td className="min-w-[180px]">
                      <button type="button" className="text-left font-medium text-ink hover:underline" onClick={() => setModal({ inicial: g })}>{g.nome}</button>
                      {g.descricao && <p className="text-xs text-muted">{g.descricao}</p>}
                    </td>
                    <td className="whitespace-nowrap"><Badge tone={g.carteira === 'toda' ? 'neutral' : 'info'}>{g.carteira === 'toda' ? 'Toda' : 'Só a sua'}</Badge></td>
                    <td className="whitespace-nowrap text-muted">{resumoAcesso(g)}</td>
                    <td className="whitespace-nowrap text-right tabular-nums">{g.membros}</td>
                    <td className="whitespace-nowrap text-right">
                      <RowActions rotulo={`Ações de ${g.nome}`} desativado={aGuardar} acoes={[
                        { rotulo: 'Editar', icone: PenLine, onSelect: () => setModal({ inicial: g }) },
                        { rotulo: 'Duplicar', icone: Copy, onSelect: () => setModal({ inicial: { ...g, id: undefined, nome: `${g.nome} (cópia)` } }) },
                        { rotulo: 'Apagar', icone: Trash2, perigo: true, separadorAntes: true, onSelect: () => handlePedirApagar(g) },
                      ]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <GrupoModal inicial={modal.inicial} aGuardar={aGuardar} onFechar={() => setModal(null)}
          onGuardar={(dados) => handleGuardar(modal.inicial?.id, dados)}
          onApagar={modal.inicial?.id ? () => handlePedirApagar(modal.inicial as GrupoComPermissoes) : undefined} />
      )}

      {modalApagar}
    </div>
  )
}
