import { PageHeader } from '@/components/ui/PageHeader';
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RenovacoesTable } from '@/components/crm/RenovacoesTable'
import { MarcarRenovadaModal } from '@/components/crm/MarcarRenovadaModal'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { useRenovacoes, marcarContactado, marcarRenovada } from '@/hooks/useRenovacoes'
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
        <RenovacoesTable
          itens={itens}
          clientes={clientes}
          onMarcarContactado={handleMarcarContactado}
          onAbrirRenovar={setItemARenovar}
        />
      )}

      {itemARenovar && (
        <MarcarRenovadaModal
          apolice={itemARenovar.apolice}
          aGuardar={aGuardar}
          onFechar={() => setItemARenovar(null)}
          onConfirmar={handleConfirmarRenovacao}
        />
      )}
    </div>
  )
}
