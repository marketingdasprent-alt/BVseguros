import { PageHeader } from '@/components/ui/PageHeader';
import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { NovoClienteForm } from '@/components/crm/NovoClienteForm'
import { ClientesTable } from '@/components/crm/ClientesTable'
import { FiltroResponsavel } from '@/components/crm/FiltroResponsavel'
import { BarraPesquisa } from '@/components/crm/BarraPesquisa'
import { SemResultados } from '@/components/crm/SemResultados'
import { AvisoTruncado } from '@/components/crm/AvisoTruncado'
import { useFiltrosUrl } from '@/hooks/useFiltrosUrl'
import { corresponde } from '@/lib/pesquisa'
import { AtribuirResponsavelModal } from '@/components/crm/AtribuirResponsavelModal'
import { ClienteFormModal } from '@/components/crm/ClienteFormModal'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { useClientes, criarCliente, atribuirCliente, atualizarCliente, apagarCliente } from '@/hooks/useClientes'
import { useConfirmarApagar } from '@/hooks/useConfirmarApagar'
import { useEquipa } from '@/hooks/useEquipa'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import type { Cliente, ClienteEdicao, ClienteInsert } from '@/lib/types'
import { mensagemErro } from '@/lib/erros'
import { filtrarPorResponsavel, lerFiltroResponsavel } from '@/lib/responsavel'

export default function Clientes() {
  const { data: clientes, isLoading, error, recarregar, truncado } = useClientes()
  const { toast } = useToast()
  const [aMostrarForm, setAMostrarForm] = useState(false)
  const [aCriar, setACriar] = useState(false)
  const { ativos, nomePorId } = useEquipa()
  const { profile, isAdmin } = useAuth()
  const filtros = useFiltrosUrl()
  const busca = filtros.ler('q')
  const [aAtribuir, setAAtribuir] = useState<Cliente | null>(null)
  const [aGuardarResponsavel, setAGuardarResponsavel] = useState(false)
  const [aEditar, setAEditar] = useState<Cliente | null>(null)
  const [aGuardarEdicao, setAGuardarEdicao] = useState(false)
  const { pedirConfirmacao, modalApagar } = useConfirmarApagar(recarregar)
  const filtro = lerFiltroResponsavel(filtros.ler('responsavel'))

  const clientesFiltrados = useMemo(() => {
    return filtrarPorResponsavel(clientes, filtro, profile?.id ?? null)
      .filter((c) => corresponde([c.nome, c.telefone, c.email, c.nif, c.morada], busca))
  }, [clientes, busca, filtro, profile?.id])

  const handleEditar = async (cliente: Cliente, dados: ClienteEdicao) => {
    setAGuardarEdicao(true)
    try {
      await atualizarCliente(cliente.id, dados)
      await recarregar()
      setAEditar(null)
      toast({ title: 'Cliente atualizado' })
    } catch (err: unknown) {
      toast({ title: 'Erro ao guardar cliente', description: mensagemErro(err), variant: 'destructive' })
    } finally {
      setAGuardarEdicao(false)
    }
  }

  const handlePedirApagar = (cliente: Cliente) => {
    setAEditar(null)
    pedirConfirmacao({
      acao: 'Apagar cliente',
      nome: cliente.nome,
      aviso: 'As apólices, renovações, sinistros, propostas e atividades deste cliente também são apagadas.',
      apagar: () => apagarCliente(cliente.id),
    })
  }

  const handleAtribuir = async (cliente: Cliente, responsavelId: string | null) => {
    setAGuardarResponsavel(true)
    try {
      await atribuirCliente(cliente.id, responsavelId)
      await recarregar()
      setAAtribuir(null)
      toast({ title: responsavelId === profile?.id ? 'Cliente assumido' : 'Responsável atualizado' })
    } catch (err: unknown) {
      toast({ title: 'Erro ao atribuir cliente', description: mensagemErro(err), variant: 'destructive' })
    } finally {
      setAGuardarResponsavel(false)
    }
  }

  const handleCriar = async (cliente: ClienteInsert) => {
    setACriar(true)
    try {
      await criarCliente(cliente)
      await recarregar()
      setAMostrarForm(false)
      toast({ title: 'Cliente criado com sucesso' })
      return true;
    } catch (err: unknown) {
      toast({ title: 'Erro ao criar cliente', description: mensagemErro(err), variant: 'destructive' })
      return false;
    } finally {
      setACriar(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Clientes" description={<> {clientes.length} {clientes.length === 1 ? 'cliente registado' : 'clientes registados'} </>} action={<Button icon={<Plus />} onClick={() => setAMostrarForm((v) => !v)}>
          Novo cliente
        </Button>} />

      {aMostrarForm && <NovoClienteForm aCriar={aCriar} onCriar={handleCriar} />}

      {isLoading && <Spinner />}
      {error && <p role="alert" className="rounded-lg bg-danger-bg p-4 text-sm text-danger-text">Erro ao carregar clientes: {error.message}</p>}

      {!isLoading && !error && clientes.length === 0 && (
        <div className="panel">
          <EmptyState titulo="Sem clientes ainda" descricao="Clientes convertidos de leads aparecem aqui." />
        </div>
      )}

      {!isLoading && !error && clientes.length > 0 && (
        <>
          <AvisoTruncado truncado={truncado} />
          <BarraPesquisa valor={busca} onChange={(v) => filtros.definir('q', v)} rotulo="Pesquisar clientes por nome, telefone, email ou NIF"
            placeholder="Nome, telefone, email ou NIF"
            filtros={<FiltroResponsavel valor={filtro} onChange={(valor) => filtros.definir('responsavel', valor, 'todos')} />} />

          {clientesFiltrados.length === 0 ? (
            <SemResultados termo={busca} onLimpar={filtros.limpar} />
          ) : (
            <ClientesTable
              clientes={clientesFiltrados}
              nomePorId={nomePorId}
              podeAtribuir={isAdmin}
              onAtribuir={setAAtribuir}
              onAssumir={(c) => profile && handleAtribuir(c, profile.id)}
              onEditar={setAEditar}
            />
          )}
        </>
      )}

      {aEditar && (
        <ClienteFormModal
          titulo="Editar cliente"
          inicial={aEditar}
          textoGuardar="Guardar alterações"
          aGuardar={aGuardarEdicao}
          onFechar={() => setAEditar(null)}
          onGuardar={(dados) => handleEditar(aEditar, dados)}
          onApagar={isAdmin ? () => handlePedirApagar(aEditar) : undefined}
        />
      )}

      {modalApagar}

      {aAtribuir && (
        <AtribuirResponsavelModal
          nomeRegisto={aAtribuir.nome}
          responsavelAtual={aAtribuir.responsavel_id}
          membros={ativos}
          aGuardar={aGuardarResponsavel}
          onFechar={() => setAAtribuir(null)}
          onConfirmar={(responsavelId) => handleAtribuir(aAtribuir, responsavelId)}
        />
      )}
    </div>
  )
}
