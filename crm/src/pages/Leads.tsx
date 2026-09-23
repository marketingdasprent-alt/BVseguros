import { PageHeader } from '@/components/ui/PageHeader';
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { KanbanBoard } from '@/components/crm/KanbanBoard'
import { LeadCard } from '@/components/crm/LeadCard'
import { NovoLeadModal } from '@/components/crm/NovoLeadModal'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { useLeads, criarLead, atualizarEstadoLead } from '@/hooks/useLeads'
import { useToast } from '@/hooks/useToast'
import { ESTADOS_LEAD } from '@/lib/types'
import type { EstadoLead, LeadInsert } from '@/lib/types'
import { TONE_ESTADO_LEAD } from '@/lib/tone'
import { mensagemErro } from '@/lib/erros'

export default function Leads() {
  const { data: leads, isLoading, error, recarregar } = useLeads()
  const { toast } = useToast()
  const [modalAberto, setModalAberto] = useState(false)
  const [aCriar, setACriar] = useState(false)

  const handleMudarEstado = async (id: string, estado: EstadoLead, atualizadoEm: string) => {
    try {
      await atualizarEstadoLead(id, estado, atualizadoEm)
      await recarregar()
    } catch (err: unknown) {
      toast({ title: 'Erro ao mover lead', description: mensagemErro(err), variant: 'destructive' })
      await recarregar()
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
      toast({ title: 'Erro ao criar lead', description: mensagemErro(err), variant: 'destructive' })
    } finally {
      setACriar(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Leads" description={<> Contactos por converter, organizados por etapa. </>} action={<Button icon={<Plus />} onClick={() => setModalAberto(true)}>
          Novo lead
        </Button>} />

      {isLoading && <Spinner />}
      {error && <p role="alert" className="rounded-lg bg-danger-bg p-4 text-sm text-danger-text">Erro ao carregar leads: {error.message}</p>}
      {!isLoading && !error && (
        <KanbanBoard
          itens={leads}
          colunas={ESTADOS_LEAD}
          getId={(lead) => lead.id}
          getEstado={(lead) => lead.estado}
          getAtualizadoEm={(lead) => lead.atualizado_em}
          getTone={(estado) => TONE_ESTADO_LEAD[estado as EstadoLead]}
          onMudarEstado={(id, estado, atualizadoEm) => handleMudarEstado(id, estado as EstadoLead, atualizadoEm)}
          renderCard={(lead) => <LeadCard lead={lead} />}
          vazioTexto="Sem leads"
        />
      )}

      {modalAberto && (
        <NovoLeadModal aCriar={aCriar} onFechar={() => setModalAberto(false)} onCriar={handleCriar} />
      )}
    </div>
  )
}
