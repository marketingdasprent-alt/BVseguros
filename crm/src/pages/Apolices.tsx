import { PageHeader } from '@/components/ui/PageHeader';
import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { NovoApoliceForm } from '@/components/crm/NovoApoliceForm'
import { ApolicesTable } from '@/components/crm/ApolicesTable'
import { BarraPesquisa } from '@/components/crm/BarraPesquisa'
import { FiltroSelect } from '@/components/crm/FiltroSelect'
import { SemResultados } from '@/components/crm/SemResultados'
import { AvisoTruncado } from '@/components/crm/AvisoTruncado'
import { useFiltrosUrl } from '@/hooks/useFiltrosUrl'
import { corresponde } from '@/lib/pesquisa'
import { ESTADOS_APOLICE, RAMOS } from '@/lib/types'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { useApolices, criarApolice, atualizarApolice, apagarApolice } from '@/hooks/useApolices'
import { useAuth } from '@/hooks/useAuth'
import { useConfirmarApagar } from '@/hooks/useConfirmarApagar'
import { useClientes } from '@/hooks/useClientes'
import { useToast } from '@/hooks/useToast'
import { useSeguradoras } from '@/hooks/useSeguradoras'
import type { Apolice, ApoliceInsert } from '@/lib/types'
import { mensagemErro } from '@/lib/erros'

export default function Apolices() {
  const { data: apolices, isLoading, error, recarregar, truncado } = useApolices()
  const { data: clientes, isLoading: clientesCarregando } = useClientes()
  const { toast } = useToast()
  const [aMostrarForm, setAMostrarForm] = useState(false)
  const [aCriar, setACriar] = useState(false)
  const [aEditar, setAEditar] = useState<Apolice | null>(null)
  const { isAdmin } = useAuth()
  const { nomesAtivos: seguradoras } = useSeguradoras()
  const { pedirConfirmacao, modalApagar } = useConfirmarApagar(recarregar)
  const filtros = useFiltrosUrl()
  const termo = filtros.ler('q')
  const ramo = filtros.ler('ramo')
  const estado = filtros.ler('estado')

  const apolicesFiltradas = useMemo(() => {
    const nomeCliente = new Map(clientes.map((c) => [c.id, c.nome]))
    return apolices.filter((a) =>
      (!ramo || a.ramo === ramo) && (!estado || a.estado === estado) &&
      corresponde([a.numero_apolice, a.seguradora, nomeCliente.get(a.cliente_id)], termo))
  }, [apolices, clientes, termo, ramo, estado])

  const handleCriar = async (apolice: ApoliceInsert) => {
    setACriar(true)
    try {
      await criarApolice(apolice)
      await recarregar()
      setAMostrarForm(false)
      toast({ title: 'Apólice criada com sucesso' })
      return true;
    } catch (err: unknown) {
      toast({ title: 'Erro ao criar apólice', description: mensagemErro(err), variant: 'destructive' })
      return false;
    } finally {
      setACriar(false)
    }
  }

  const handleEditar = async (apolice: Apolice, dados: ApoliceInsert) => {
    setACriar(true)
    try {
      await atualizarApolice(apolice.id, dados)
      await recarregar()
      setAEditar(null)
      toast({ title: 'Apólice atualizada' })
      return true
    } catch (err: unknown) {
      toast({ title: 'Erro ao guardar apólice', description: mensagemErro(err), variant: 'destructive' })
      return false
    } finally {
      setACriar(false)
    }
  }

  const handlePedirApagar = (apolice: Apolice) => {
    setAEditar(null)
    pedirConfirmacao({
      acao: 'Apagar apólice',
      nome: `a apólice ${apolice.numero_apolice}`,
      aviso: 'As renovações e os sinistros desta apólice também são apagados.',
      apagar: () => apagarApolice(apolice.id),
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Apólices" description={<> {apolices.length} {apolices.length === 1 ? 'apólice registada' : 'apólices registadas'} </>} action={<Button icon={<Plus />} onClick={() => setAMostrarForm((v) => !v)}>
          Nova apólice
        </Button>} />

      {aMostrarForm && !clientesCarregando && (
        <NovoApoliceForm seguradoras={seguradoras} clientes={clientes} aCriar={aCriar} onCriar={handleCriar} />
      )}

      {isLoading && <Spinner />}
      {error && <p role="alert" className="rounded-lg bg-danger-bg p-4 text-sm text-danger-text">Erro ao carregar apólices: {error.message}</p>}
      {!isLoading && !error && apolices.length === 0 && (
        <div className="panel">
          <EmptyState titulo="Sem apólices ainda" descricao="As apólices dos seus clientes aparecem aqui." />
        </div>
      )}
      {!isLoading && !error && apolices.length > 0 && (
        <>
          <AvisoTruncado truncado={truncado} />
          <BarraPesquisa valor={termo} onChange={(v) => filtros.definir('q', v)} rotulo="Pesquisar apólices"
            placeholder="Nº de apólice, cliente ou seguradora"
            filtros={<>
              <FiltroSelect rotulo="Filtrar por ramo" todos="Todos os ramos" valor={ramo} opcoes={RAMOS} onChange={(v) => filtros.definir('ramo', v)} />
              <FiltroSelect rotulo="Filtrar por estado" todos="Todos os estados" valor={estado} opcoes={ESTADOS_APOLICE} onChange={(v) => filtros.definir('estado', v)} />
            </>} />
          {apolicesFiltradas.length === 0 ? (
            <SemResultados termo={termo} onLimpar={filtros.limpar} />
          ) : (
            <ApolicesTable apolices={apolicesFiltradas} clientes={clientes} onEditar={setAEditar} />
          )}
        </>
      )}

      {aEditar && (
        <NovoApoliceForm seguradoras={seguradoras}
          inicial={aEditar}
          clientes={clientes}
          aCriar={aCriar}
          onCriar={(dados) => handleEditar(aEditar, dados)}
          onCancelar={() => setAEditar(null)}
          onApagar={isAdmin ? () => handlePedirApagar(aEditar) : undefined}
        />
      )}

      {modalApagar}
    </div>
  )
}
