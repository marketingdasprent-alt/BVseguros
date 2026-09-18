import { useState } from 'react'
import { KanbanBoard } from '@/components/crm/KanbanBoard'
import { NovoLeadModal } from '@/components/crm/NovoLeadModal'
import { Spinner } from '@/components/ui/Spinner'
import { useLeads, criarLead, atualizarEstadoLead } from '@/hooks/useLeads'
import { useToast } from '@/hooks/useToast'
import type { EstadoLead, LeadInsert } from '@/lib/types'

export default function Leads() {
  const { data: leads, isLoading, error, recarregar } = useLeads()
  const { toast } = useToast()
  const [modalAberto, setModalAberto] = useState(false)
  const [aCriar, setACriar] = useState(false)

  const handleMudarEstado = async (id: string, estado: EstadoLead) => {
    try {
      await atualizarEstadoLead(id, estado)
      await recarregar()
    } catch (err: unknown) {
      const mensagem = err instanceof Error ? err.message : 'Erro inesperado'
      toast({ title: 'Erro ao mover lead', description: mensagem, variant: 'destructive' })
    }
  }

  const handleCriar = async (lead: LeadInsert) => {
    setACriar(true)
    try {
      await criarLead(lead)
      await recarregar()
      setModalAberto(false)
      toast({ title: 'Lead criado com sucesso' })
    } catch (err: unknown) {
      const mensagem = err instanceof Error ? err.message : 'Erro inesperado'
      toast({ title: 'Erro ao criar lead', description: mensagem, variant: 'destructive' })
    } finally {
      setACriar(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-navy">Leads</h1>
        <button
          onClick={() => setModalAberto(true)}
          className="rounded-lg bg-navy text-white px-4 py-2 text-sm font-medium"
        >
          + Novo lead
        </button>
      </div>

      {isLoading && <Spinner />}
      {error && <p className="text-sm text-red-600">Erro ao carregar leads: {error.message}</p>}
      {!isLoading && !error && <KanbanBoard leads={leads} onMudarEstado={handleMudarEstado} />}

      {modalAberto && (
        <NovoLeadModal aCriar={aCriar} onFechar={() => setModalAberto(false)} onCriar={handleCriar} />
      )}
    </div>
  )
}
