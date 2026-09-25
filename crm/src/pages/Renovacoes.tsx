import { PageHeader } from '@/components/ui/PageHeader';
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock } from 'lucide-react'
import { RenovacoesTable } from '@/components/crm/RenovacoesTable'
import { MarcarRenovadaModal } from '@/components/crm/MarcarRenovadaModal'
import { EditarRenovacaoModal } from '@/components/crm/EditarRenovacaoModal'
import { BarraPesquisa } from '@/components/crm/BarraPesquisa'
import { SemResultados } from '@/components/crm/SemResultados'
import { useFiltrosUrl } from '@/hooks/useFiltrosUrl'
import { corresponde } from '@/lib/pesquisa'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { useRenovacoes, marcarContactado, marcarRenovada, guardarRenovacao } from '@/hooks/useRenovacoes'
import type { RenovacaoItem } from '@/hooks/useRenovacoes'
import { useClientes } from '@/hooks/useClientes'
import { useToast } from '@/hooks/useToast'
import { mensagemErro } from '@/lib/erros'

export default function Renovacoes() {
  const { data: itens, isLoading, error, recarregar } = useRenovacoes()
  const { data: clientes, isLoading: clientesCarregando } = useClientes()
  const { toast } = useToast()
  const [itemARenovar, setItemARenovar] = useState<RenovacaoItem | null>(null)
  const [aGuardar, setAGuardar] = useState(false)
  const [aEditar, setAEditar] = useState<RenovacaoItem | null>(null)

  const handleMarcarContactado = async (item: RenovacaoItem) => {
    try {
      await marcarContactado(item.apolice, item.renovacao?.id ?? null)
      await recarregar()
      toast({ title: 'Renovação marcada como contactada' })
    } catch (err: unknown) {
      toast({ title: 'Erro ao atualizar renovação', description: mensagemErro(err), variant: 'destructive' })
    }
  }

  const handleConfirmarRenovacao = async (novaDataFim: string, novoPremio: number | null) => {
    if (!itemARenovar) return
    setAGuardar(true)
    try {
      await marcarRenovada(itemARenovar.apolice, itemARenovar.renovacao?.id ?? null, novaDataFim, novoPremio)
      await recarregar()
      setItemARenovar(null)
      toast({ title: 'Apólice renovada com sucesso' })
    } catch (err: unknown) {
      toast({ title: 'Erro ao renovar apólice', description: mensagemErro(err), variant: 'destructive' })
    } finally {
      setAGuardar(false)
    }
  }

  const handleGuardarEdicao = async (item: RenovacaoItem, dados: Parameters<typeof guardarRenovacao>[2]) => {
    setAGuardar(true)
    try {
      await guardarRenovacao(item.apolice, item.renovacao?.id ?? null, dados)
      await recarregar()
      setAEditar(null)
      toast({ title: 'Renovação atualizada' })
    } catch (err: unknown) {
      toast({ title: 'Erro ao guardar renovação', description: mensagemErro(err), variant: 'destructive' })
    } finally {
      setAGuardar(false)
    }
  }

  const filtros = useFiltrosUrl()
  const termo = filtros.ler('q')
  const itensFiltrados = useMemo(() => {
    const nomeCliente = new Map(clientes.map((c) => [c.id, c.nome]))
    return itens.filter((i) => corresponde([i.apolice.numero_apolice, i.apolice.seguradora, nomeCliente.get(i.apolice.cliente_id), i.renovacao?.notas], termo))
  }, [itens, clientes, termo])

  const carregando = isLoading || clientesCarregando

  return (
    <div className="space-y-6">
      <PageHeader title="Renovações" description={<> Apólices ativas que vencem nos próximos 60 dias. O Dashboard destaca à parte as mais urgentes, dentro de
          30 dias. </>} />

      {carregando && <Spinner />}
      {error && <p role="alert" className="rounded-lg bg-danger-bg p-4 text-sm text-danger-text">Erro ao carregar renovações: {error.message}</p>}
      {!carregando && !error && itens.length === 0 && (
        <div className="panel">
          <EmptyState
            icon={CalendarClock}
            titulo="Sem renovações nos próximos 60 dias"
            descricao="Quando uma apólice ativa se aproximar do vencimento, aparece aqui automaticamente."
            action={
              <Link
                to="/apolices"
                className="inline-flex items-center justify-center rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-ink hover:border-border-strong transition-colors"
              >
                Ver apólices
              </Link>
            }
          />
        </div>
      )}
      {!carregando && !error && itens.length > 0 && (
        <>
        <BarraPesquisa valor={termo} onChange={(v) => filtros.definir('q', v)} rotulo="Pesquisar renovações" placeholder="Nº de apólice, cliente ou seguradora" />
        {itensFiltrados.length === 0 ? (
          <SemResultados termo={termo} onLimpar={filtros.limpar} />
        ) : (
        <RenovacoesTable
          itens={itensFiltrados}
          clientes={clientes}
          onMarcarContactado={handleMarcarContactado}
          onAbrirRenovar={setItemARenovar}
          onEditar={setAEditar}
        />
        )}
        </>
      )}

      {itemARenovar && (
        <MarcarRenovadaModal
          apolice={itemARenovar.apolice}
          aGuardar={aGuardar}
          onFechar={() => setItemARenovar(null)}
          onConfirmar={handleConfirmarRenovacao}
        />
      )}

      {aEditar && (
        <EditarRenovacaoModal
          item={aEditar}
          nomeCliente={clientes.find((c) => c.id === aEditar.apolice.cliente_id)?.nome ?? '—'}
          aGuardar={aGuardar}
          onFechar={() => setAEditar(null)}
          onGuardar={(dados) => handleGuardarEdicao(aEditar, dados)}
        />
      )}
    </div>
  )
}
