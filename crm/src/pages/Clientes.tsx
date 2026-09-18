import { useState } from 'react'
import { NovoClienteForm } from '@/components/crm/NovoClienteForm'
import { ClientesTable } from '@/components/crm/ClientesTable'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { useClientes, criarCliente } from '@/hooks/useClientes'
import { useToast } from '@/hooks/useToast'
import type { ClienteInsert } from '@/lib/types'

export default function Clientes() {
  const { data: clientes, isLoading, error, recarregar } = useClientes()
  const { toast } = useToast()
  const [aMostrarForm, setAMostrarForm] = useState(false)
  const [aCriar, setACriar] = useState(false)

  const handleCriar = async (cliente: ClienteInsert) => {
    setACriar(true)
    try {
      await criarCliente(cliente)
      await recarregar()
      setAMostrarForm(false)
      toast({ title: 'Cliente criado com sucesso' })
    } catch (err: unknown) {
      const mensagem = err instanceof Error ? err.message : 'Erro inesperado'
      toast({ title: 'Erro ao criar cliente', description: mensagem, variant: 'destructive' })
    } finally {
      setACriar(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-navy">Clientes</h1>
        <button
          onClick={() => setAMostrarForm((v) => !v)}
          className="rounded-lg bg-navy text-white px-4 py-2 text-sm font-medium"
        >
          + Novo cliente
        </button>
      </div>

      {aMostrarForm && <NovoClienteForm aCriar={aCriar} onCriar={handleCriar} />}

      {isLoading && <Spinner />}
      {error && <p className="text-sm text-red-600">Erro ao carregar clientes: {error.message}</p>}
      {!isLoading && !error && clientes.length === 0 && (
        <EmptyState titulo="Sem clientes ainda" descricao="Clientes convertidos de leads aparecem aqui." />
      )}
      {!isLoading && !error && clientes.length > 0 && <ClientesTable clientes={clientes} />}
    </div>
  )
}
