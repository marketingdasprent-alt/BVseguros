import { PageHeader } from '@/components/ui/PageHeader';
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { NovoApoliceForm } from '@/components/crm/NovoApoliceForm'
import { ApolicesTable } from '@/components/crm/ApolicesTable'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { useApolices, criarApolice } from '@/hooks/useApolices'
import { useClientes } from '@/hooks/useClientes'
import { useToast } from '@/hooks/useToast'
import type { ApoliceInsert } from '@/lib/types'
import { mensagemErro } from '@/lib/erros'

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
      return true;
    } catch (err: unknown) {
      toast({ title: 'Erro ao criar apólice', description: mensagemErro(err), variant: 'destructive' })
      return false;
    } finally {
      setACriar(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Apólices" description={<> {apolices.length} {apolices.length === 1 ? 'apólice registada' : 'apólices registadas'} </>} action={<Button icon={<Plus />} onClick={() => setAMostrarForm((v) => !v)}>
          Nova apólice
        </Button>} />

      {aMostrarForm && !clientesCarregando && (
        <NovoApoliceForm clientes={clientes} aCriar={aCriar} onCriar={handleCriar} />
      )}

      {isLoading && <Spinner />}
      {error && <p role="alert" className="rounded-lg bg-danger-bg p-4 text-sm text-danger-text">Erro ao carregar apólices: {error.message}</p>}
      {!isLoading && !error && apolices.length === 0 && (
        <div className="panel">
          <EmptyState titulo="Sem apólices ainda" descricao="As apólices dos teus clientes aparecem aqui." />
        </div>
      )}
      {!isLoading && !error && apolices.length > 0 && (
        <ApolicesTable apolices={apolices} clientes={clientes} />
      )}
    </div>
  )
}
