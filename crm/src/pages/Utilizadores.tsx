import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { UtilizadoresTable } from '@/components/crm/UtilizadoresTable'
import { HistoricoAcessos } from '@/components/crm/HistoricoAcessos'
import { EditarNomeModal } from '@/components/crm/EditarNomeModal'
import { ConvidarModal } from '@/components/crm/ConvidarModal'
import { AlertTriangle, Info, UserPlus } from 'lucide-react'
import { Notice } from '@/components/ui/Notice'
import { useUtilizadores, useEventosAcesso, useEstadosContas, alterarAcesso, alterarNome, convidarUtilizador, excluirUtilizador, reenviarConvite } from '@/hooks/useUtilizadores'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { useConfirmarApagar } from '@/hooks/useConfirmarApagar'
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
  const { isAdmin, profile, refreshProfile } = useAuth()
  const { data: utilizadores, isLoading, error, recarregar } = useUtilizadores()
  const eventos = useEventosAcesso()
  const estadosContas = useEstadosContas()
  const { toast } = useToast()
  const [pedido, setPedido] = useState<PedidoAlteracao | null>(null)
  const [idEmAlteracao, setIdEmAlteracao] = useState<string | null>(null)
  const [aEditarNome, setAEditarNome] = useState<Profile | null>(null)
  const [aGuardarNome, setAGuardarNome] = useState(false)
  const [aConvidar, setAConvidar] = useState(false)
  const [aEnviarConvite, setAEnviarConvite] = useState(false)
  const { pedirConfirmacao, modalApagar } = useConfirmarApagar(async () => { await Promise.all([recarregar(), eventos.recarregar(), estadosContas.recarregar()]) })

  // Esconder é só UX: quem garante que só um admin altera contas é a RLS de profiles.
  if (!isAdmin) return <Navigate to="/" replace />

  const semAcesso = utilizadores.filter((u) => !u.ativo).length

  const handleConfirmar = async () => {
    if (!pedido) return
    setIdEmAlteracao(pedido.utilizador.id)
    try {
      await alterarAcesso(pedido.utilizador.id, pedido.alteracao)
      await Promise.all([recarregar(), eventos.recarregar()])
      toast({ title: `${descreverAlteracao(pedido).titulo}: ${pedido.utilizador.nome}` })
      setPedido(null)
    } catch (err: unknown) {
      toast({ title: 'Erro ao alterar a conta', description: mensagemErro(err), variant: 'destructive' })
    } finally {
      setIdEmAlteracao(null)
    }
  }

  const handleGuardarNome = async (nome: string) => {
    if (!aEditarNome) return
    setAGuardarNome(true)
    try {
      await alterarNome(aEditarNome.id, nome)
      // O próprio nome também aparece na barra lateral, que lê o perfil do useAuth.
      await Promise.all([recarregar(), eventos.recarregar(), aEditarNome.id === profile?.id ? refreshProfile() : null])
      toast({ title: 'Nome atualizado' })
      setAEditarNome(null)
    } catch (err: unknown) {
      toast({ title: 'Erro ao guardar o nome', description: mensagemErro(err), variant: 'destructive' })
    } finally {
      setAGuardarNome(false)
    }
  }

  const handleConvidar = async (nome: string, email: string) => {
    setAEnviarConvite(true)
    try {
      const mensagem = await convidarUtilizador(nome, email)
      await Promise.all([recarregar(), eventos.recarregar(), estadosContas.recarregar()])
      toast({ title: 'Convite enviado', description: mensagem })
      return true
    } catch (err: unknown) {
      toast({ title: 'Erro ao convidar', description: mensagemErro(err), variant: 'destructive' })
      return false
    } finally {
      setAEnviarConvite(false)
    }
  }

  const handleReenviar = async (utilizador: Profile) => {
    setIdEmAlteracao(utilizador.id)
    try {
      const mensagem = await reenviarConvite(utilizador.id)
      await eventos.recarregar()
      toast({ title: 'Convite reenviado', description: mensagem })
    } catch (err: unknown) {
      toast({ title: 'Erro ao reenviar convite', description: mensagemErro(err), variant: 'destructive' })
    } finally {
      setIdEmAlteracao(null)
    }
  }

  const handlePedirExcluir = (utilizador: Profile) =>
    pedirConfirmacao({
      acao: 'Excluir conta', mensagemSucesso: 'Conta excluída',
      nome: `a conta de ${utilizador.nome} (${utilizador.email})`,
      aviso: 'A pessoa deixa de conseguir entrar e a conta não pode ser recuperada. Os leads, clientes e atividades de que era responsável ficam sem responsável; nada é apagado. Para bloquear temporariamente, use antes "Retirar acesso".',
      apagar: async () => { await excluirUtilizador(utilizador.id) },
    })

  const confirmacao = pedido && descreverAlteracao(pedido)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilizadores"
        description={<>
          {semAcesso > 0 && <strong className="font-medium text-ink">{semAcesso} {semAcesso === 1 ? 'conta à espera' : 'contas à espera'} de acesso. </strong>}
          Quem pode entrar no CRM. Contas criadas por outra via (por exemplo, no painel do Supabase) aparecem aqui sem acesso até lho dar.
        </>}
        action={<Button icon={<UserPlus />} onClick={() => setAConvidar(true)}>Convidar utilizador</Button>}
      />

      {isLoading && <Spinner />}
      {error && (
        <Notice tone="danger" icon={AlertTriangle} alerta
          action={<Button variant="secondary" size="sm" onClick={() => recarregar()}>Tentar novamente</Button>}>
          Não foi possível carregar os utilizadores: {error.message}
        </Notice>
      )}

      {estadosContas.error && !isLoading && !error && (
        <Notice icon={Info}>
          Convites pendentes e último acesso indisponíveis: falta configurar a chave do servidor (SUPABASE_SERVICE_ROLE_KEY).
        </Notice>
      )}

      {!isLoading && !error && utilizadores.length === 0 && (
        <div className="panel">
          <EmptyState titulo="Sem utilizadores" descricao="As contas convidadas aparecem aqui." />
        </div>
      )}

      {!isLoading && !error && utilizadores.length > 0 && (
        <UtilizadoresTable
          utilizadores={utilizadores}
          estados={estadosContas.data}
          idAtual={profile?.id ?? null}
          idEmAlteracao={idEmAlteracao}
          onAlterar={(utilizador, alteracao) => setPedido({ utilizador, alteracao })}
          onEditarNome={setAEditarNome}
          onExcluir={handlePedirExcluir}
          onReenviarConvite={handleReenviar}
        />
      )}

      <HistoricoAcessos eventos={eventos.data} isLoading={eventos.isLoading} error={eventos.error} onTentarNovamente={() => eventos.recarregar()} />

      {modalApagar}

      {aConvidar && <ConvidarModal aEnviar={aEnviarConvite} onFechar={() => setAConvidar(false)} onConvidar={handleConvidar} />}

      {aEditarNome && (
        <EditarNomeModal utilizador={aEditarNome} aGuardar={aGuardarNome} onFechar={() => setAEditarNome(null)} onGuardar={handleGuardarNome} />
      )}

      {pedido && confirmacao && (
        <Modal title={confirmacao.titulo} subtitle={pedido.utilizador.email} onClose={() => setPedido(null)} busy={idEmAlteracao !== null}>
          <div className="space-y-5">
            <p className="text-sm leading-relaxed text-ink">{confirmacao.texto}</p>
            {/* O botão repete a ação do título, como na confirmação de apagar. */}
            <div className="form-footer"><div className="form-footer-end">
              <Button variant="secondary" disabled={idEmAlteracao !== null} onClick={() => setPedido(null)} data-autofocus>
                Cancelar
              </Button>
              <Button variant={pedido.alteracao.ativo === false ? 'destructive' : 'primary'} loading={idEmAlteracao !== null}
                onClick={handleConfirmar}>
                {confirmacao.titulo}
              </Button>
            </div></div>
          </div>
        </Modal>
      )}
    </div>
  )
}
