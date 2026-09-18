import { useState } from 'react'
import { NovoApoliceForm } from '@/components/crm/NovoApoliceForm'
import { ApolicesTable } from '@/components/crm/ApolicesTable'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { useApolices, criarApolice } from '@/hooks/useApolices'
import { useClientes } from '@/hooks/useClientes'
import { useToast } from '@/hooks/useToast'
import type { ApoliceInsert } from '@/lib/types'

export default function Apolices() {
  const { data: apolices, isLoading, error, recarregar } = useApolices()
  const { data: clientes, isLoading: clientesCarregando } = useClientes()
  const { toast } = useToast()
  const [aMostrarForm, setAMostrarForm] = useState(false)
  const [aCriar, setACriar] = useState(false)

  const handleCriar = async (apolice: ApoliceInsert) => {
    setACriar(true)
    try {
      await criarApolice(apolice)
      await recarregar()
      setAMostrarForm(false)
      toast({ title: 'Apólice criada com sucesso' })
    } catch (err: unknown) {
      const mensagem = err instanceof Error ? err.message : 'Erro inesperado'
      toast({ title: 'Erro ao criar apólice', description: mensagem, variant: 'destructive' })
    } finally {
      setACriar(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-navy">Apólices</h1>
        <button
          onClick={() => setAMostrarForm((v) => !v)}
          className="rounded-lg bg-navy text-white px-4 py-2 text-sm font-medium"
        >
          + Nova apólice
        </button>
      </div>

      {aMostrarForm && !clientesCarregando && (
        <NovoApoliceForm clientes={clientes} aCriar={aCriar} onCriar={handleCriar} />
      )}

      {isLoading && <Spinner />}
      {error && <p className="text-sm text-red-600">Erro ao carregar apólices: {error.message}</p>}
      {!isLoading && !error && apolices.length === 0 && (
        <EmptyState titulo="Sem apólices ainda" descricao="As apólices dos teus clientes aparecem aqui." />
      )}
      {!isLoading && !error && apolices.length > 0 && (
        <ApolicesTable apolices={apolices} clientes={clientes} />
      )}
    </div>
  )
}
