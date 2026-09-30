import { PageHeader } from '@/components/ui/PageHeader';
import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { KanbanBoard } from '@/components/crm/KanbanBoard'
import { BarraPesquisa } from '@/components/crm/BarraPesquisa'
import { SemResultados } from '@/components/crm/SemResultados'
import { AvisoTruncado } from '@/components/crm/AvisoTruncado'
import { useFiltrosUrl } from '@/hooks/useFiltrosUrl'
import { corresponde } from '@/lib/pesquisa'
import { SinistroCard } from '@/components/crm/SinistroCard'
import { NovoSinistroModal } from '@/components/crm/NovoSinistroModal'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { useSinistros, criarSinistro, atualizarEstadoSinistro, atualizarSinistro, apagarSinistro } from '@/hooks/useSinistros'
import { usePedidosSinistroNovos } from '@/hooks/usePedidosSinistro'
import PedidosSinistro from '@/pages/PedidosSinistro'
import { useAuth } from '@/hooks/useAuth'
import { useConfirmarApagar } from '@/hooks/useConfirmarApagar'
import { useApolices } from '@/hooks/useApolices'
import { useToast } from '@/hooks/useToast'
import { ESTADOS_SINISTRO } from '@/lib/types'
import type { EstadoSinistro, Sinistro, SinistroEdicao, SinistroInsert } from '@/lib/types'
import { TONE_ESTADO_SINISTRO } from '@/lib/tone'
import { mensagemErro } from '@/lib/erros'

export default function Sinistros() {
  const { data: sinistros, isLoading, error, recarregar, truncado } = useSinistros()
  const filtros = useFiltrosUrl()
  const termo = filtros.ler('q')
  const { data: apolices, isLoading: apolicesCarregando } = useApolices()
  const { toast } = useToast()
  const [modalAberto, setModalAberto] = useState(false)
  const [aCriar, setACriar] = useState(false)
  const [aEditar, setAEditar] = useState<Sinistro | null>(null)
  const { pode } = useAuth()
  const podeEditar = pode('sinistros', 'editar')
  // Dois separadores: os processos (quadro) e a caixa de entrada dos pedidos feitos no site.
  const vista = filtros.ler('vista', 'processos')
  const pedidosNovos = usePedidosSinistroNovos(true)
  const mudarVista = (v: string) => { filtros.limpar(); filtros.definir('vista', v, 'processos') }
  const { pedirConfirmacao, modalApagar } = useConfirmarApagar(recarregar)

  const numeroApolice = (sinistro: Sinistro) =>
    apolices.find((a) => a.id === sinistro.apolice_id)?.numero_apolice ?? '—'

  const sinistrosFiltrados = useMemo(() => sinistros.filter((s) => corresponde([numeroApolice(s), s.numero_sinistro, s.descricao, s.notas], termo)),
    [sinistros, termo, apolices])

  const handleMudarEstado = async (id: string, estado: EstadoSinistro, atualizadoEm: string) => {
    try {
      await atualizarEstadoSinistro(id, estado, atualizadoEm)
      await recarregar()
    } catch (err: unknown) {
      toast({ title: 'Erro ao mover sinistro', description: mensagemErro(err), variant: 'destructive' })
      await recarregar()
    }
  }

  const handleCriar = async (sinistro: SinistroInsert) => {
    setACriar(true)
    try {
      await criarSinistro(sinistro)
      await recarregar()
      setModalAberto(false)
      toast({ title: 'Sinistro criado com sucesso' })
    } catch (err: unknown) {
      toast({ title: 'Erro ao criar sinistro', description: mensagemErro(err), variant: 'destructive' })
    } finally {
      setACriar(false)
    }
  }

  const handleEditar = async (sinistro: Sinistro, dados: SinistroEdicao) => {
    setACriar(true)
    try {
      await atualizarSinistro(sinistro.id, dados, sinistro.atualizado_em)
      await recarregar()
      setAEditar(null)
      toast({ title: 'Sinistro atualizado' })
    } catch (err: unknown) {
      toast({ title: 'Erro ao guardar sinistro', description: mensagemErro(err), variant: 'destructive' })
      await recarregar()
    } finally {
      setACriar(false)
    }
  }

  const handlePedirApagar = (sinistro: Sinistro) => {
    setAEditar(null)
    pedirConfirmacao({ acao: 'Apagar sinistro', nome: `o sinistro da apólice ${numeroApolice(sinistro)}`, apagar: () => apagarSinistro(sinistro.id) })
  }

  const carregando = isLoading || apolicesCarregando

  return (
    <div className="space-y-6">
      <PageHeader title="Sinistros" description={<> Acompanhamento de processos, da participação ao pagamento. </>} action={podeEditar && vista === 'processos' && <Button icon={<Plus />} onClick={() => setModalAberto(true)}>
          Novo sinistro
        </Button>} />

      <div role="group" aria-label="O que ver" className="segmented">
        <button type="button" aria-pressed={vista === 'processos'} onClick={() => mudarVista('processos')}>Processos</button>
        <button type="button" aria-pressed={vista === 'pedidos'} onClick={() => mudarVista('pedidos')}>
          Pedidos do site{pedidosNovos > 0 && <span className="ml-1.5 rounded-full bg-warning-bg px-1.5 text-warning-text">{pedidosNovos}</span>}
        </button>
      </div>

      {vista === 'pedidos' && <PedidosSinistro onConvertido={recarregar} />}

      {vista === 'processos' && carregando && <Spinner />}
      {vista === 'processos' && error && <p role="alert" className="rounded-lg bg-danger-bg p-4 text-sm text-danger-text">Erro ao carregar sinistros: {error.message}</p>}
      {vista === 'processos' && !carregando && !error && (
        <>
        <AvisoTruncado truncado={truncado} />
        <BarraPesquisa valor={termo} onChange={(v) => filtros.definir('q', v)} rotulo="Pesquisar sinistros" placeholder="Nº de apólice, nº de sinistro ou descrição" />
        {sinistros.length > 0 && sinistrosFiltrados.length === 0 ? (
          <SemResultados termo={termo} onLimpar={filtros.limpar} />
        ) : (
        <KanbanBoard
          itens={sinistrosFiltrados}
          colunas={ESTADOS_SINISTRO}
          getId={(s) => s.id}
          getEstado={(s) => s.estado}
          getAtualizadoEm={(s) => s.atualizado_em}
          getTone={(estado) => TONE_ESTADO_SINISTRO[estado as EstadoSinistro]}
          onMudarEstado={podeEditar ? (id, estado, atualizadoEm) => handleMudarEstado(id, estado as EstadoSinistro, atualizadoEm) : undefined}
          renderCard={(s) => <SinistroCard sinistro={s} numeroApolice={numeroApolice(s)} onEditar={podeEditar ? setAEditar : undefined} />}
          vazioTexto="Sem sinistros"
        />
        )}
        </>
      )}

      {modalAberto && (
        <NovoSinistroModal
          apolices={apolices}
          aCriar={aCriar}
          onFechar={() => setModalAberto(false)}
          onCriar={handleCriar}
        />
      )}

      {aEditar && (
        <NovoSinistroModal
          apolices={apolices}
          inicial={aEditar}
          aCriar={aCriar}
          onFechar={() => setAEditar(null)}
          onCriar={handleCriar}
          onGuardar={(dados) => handleEditar(aEditar, dados)}
          onApagar={pode('sinistros', 'apagar') ? () => handlePedirApagar(aEditar) : undefined}
        />
      )}

      {modalApagar}
    </div>
  )
}
