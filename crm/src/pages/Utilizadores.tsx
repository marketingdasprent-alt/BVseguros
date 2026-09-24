import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { UtilizadoresTable } from '@/components/crm/UtilizadoresTable'
import { useUtilizadores, alterarAcesso } from '@/hooks/useUtilizadores'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { mensagemErro } from '@/lib/erros'
import type { AlteracaoAcesso, Profile } from '@/lib/types'

interface PedidoAlteracao {
  utilizador: Profile
  alteracao: AlteracaoAcesso
}

function descreverAlteracao({ utilizador, alteracao }: PedidoAlteracao) {
  if (alteracao.ativo === true) return { titulo: 'Dar acesso', texto: `${utilizador.nome} passa a conseguir entrar no CRM e ver todos os dados.` }
  if (alteracao.ativo === false) return { titulo: 'Retirar acesso', texto: `${utilizador.nome} deixa de conseguir ver ou alterar dados do CRM. A conta não é apagada e pode voltar a ter acesso.` }
  if (alteracao.is_admin === true) return { titulo: 'Tornar administrador', texto: `${utilizador.nome} passa a poder dar e retirar acesso a outras contas.` }
  return { titulo: 'Tornar mediador', texto: `${utilizador.nome} deixa de poder gerir as contas de outros utilizadores.` }
}

export default function Utilizadores() {
  const { isAdmin, profile } = useAuth()
  const { data: utilizadores, isLoading, error, recarregar } = useUtilizadores()
  const { toast } = useToast()
  const [pedido, setPedido] = useState<PedidoAlteracao | null>(null)
  const [idEmAlteracao, setIdEmAlteracao] = useState<string | null>(null)

  // Esconder é só UX: quem garante que só um admin altera contas é a RLS de profiles.
  if (!isAdmin) return <Navigate to="/" replace />

  const semAcesso = utilizadores.filter((u) => !u.ativo).length

  const handleConfirmar = async () => {
    if (!pedido) return
    setIdEmAlteracao(pedido.utilizador.id)
    try {
      await alterarAcesso(pedido.utilizador.id, pedido.alteracao)
      await recarregar()
      toast({ title: `${descreverAlteracao(pedido).titulo}: ${pedido.utilizador.nome}` })
      setPedido(null)
    } catch (err: unknown) {
      toast({ title: 'Erro ao alterar a conta', description: mensagemErro(err), variant: 'destructive' })
    } finally {
      setIdEmAlteracao(null)
    }
  }

  const confirmacao = pedido && descreverAlteracao(pedido)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilizadores"
        description={semAcesso > 0 ? `${semAcesso} ${semAcesso === 1 ? 'conta à espera' : 'contas à espera'} de acesso` : 'Quem pode entrar no CRM'}
      />

      <p className="text-sm text-muted max-w-2xl">
        Para adicionar alguém, convide o email no painel do Supabase (Authentication, Invite user). A conta aparece aqui
        sem acesso até lhe dar acesso.
      </p>

      {isLoading && <Spinner />}
      {error && <p role="alert" className="rounded-lg bg-danger-bg p-4 text-sm text-danger-text">Erro ao carregar utilizadores: {error.message}</p>}

      {!isLoading && !error && utilizadores.length === 0 && (
        <div className="panel">
          <EmptyState titulo="Sem utilizadores" descricao="As contas convidadas aparecem aqui." />
        </div>
      )}

      {!isLoading && !error && utilizadores.length > 0 && (
        <UtilizadoresTable
          utilizadores={utilizadores}
          idAtual={profile?.id ?? null}
          idEmAlteracao={idEmAlteracao}
          onAlterar={(utilizador, alteracao) => setPedido({ utilizador, alteracao })}
        />
      )}

      {pedido && confirmacao && (
        <Modal title={confirmacao.titulo} onClose={() => setPedido(null)} busy={idEmAlteracao !== null}>
          <div className="space-y-5">
            <p className="text-sm text-ink">{confirmacao.texto}</p>
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" disabled={idEmAlteracao !== null} onClick={() => setPedido(null)} className="flex-1">
                Cancelar
              </Button>
              <Button variant={pedido.alteracao.ativo === false ? 'destructive' : 'primary'} loading={idEmAlteracao !== null}
                onClick={handleConfirmar} className="flex-1">
                Confirmar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
