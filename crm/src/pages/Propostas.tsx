import { PageHeader } from '@/components/ui/PageHeader';
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { KanbanBoard } from '@/components/crm/KanbanBoard'
import { PropostaCard } from '@/components/crm/PropostaCard'
import { NovaPropostaModal } from '@/components/crm/NovaPropostaModal'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { usePropostas, criarProposta, atualizarEstadoProposta } from '@/hooks/usePropostas'
import { useLeads } from '@/hooks/useLeads'
import { useClientes } from '@/hooks/useClientes'
import { useToast } from '@/hooks/useToast'
import { ESTADOS_PROPOSTA } from '@/lib/types'
import type { EstadoProposta, Proposta, PropostaInsert } from '@/lib/types'
import { TONE_ESTADO_PROPOSTA } from '@/lib/tone'
import { mensagemErro } from '@/lib/erros'

export default function Propostas() {
  const { data: propostas, isLoading, error, recarregar } = usePropostas()
  const { data: leads, isLoading: leadsCarregando } = useLeads()
  const { data: clientes, isLoading: clientesCarregando } = useClientes()
  const { toast } = useToast()
  const [modalAberto, setModalAberto] = useState(false)
  const [aCriar, setACriar] = useState(false)

  const nomeOrigem = (proposta: Proposta) => {
    if (proposta.lead_id) return leads.find((l) => l.id === proposta.lead_id)?.nome ?? '—'
    if (proposta.cliente_id) return clientes.find((c) => c.id === proposta.cliente_id)?.nome ?? '—'
    return '—'
  }

  const handleMudarEstado = async (id: string, estado: EstadoProposta, atualizadoEm: string) => {
    try {
      await atualizarEstadoProposta(id, estado, atualizadoEm)
      await recarregar()
      if (estado === 'aceite') {
        toast({ title: 'Proposta aceite', description: 'Regista a apólice correspondente em Apólices.' })
      }
    } catch (err: unknown) {
      toast({ title: 'Erro ao mover proposta', description: mensagemErro(err), variant: 'destructive' })
      await recarregar()
    }
  }

  const handleCriar = async (proposta: PropostaInsert) => {
    setACriar(true)
    try {
      await criarProposta(proposta)
      await recarregar()
      setModalAberto(false)
      toast({ title: 'Proposta criada com sucesso' })
    } catch (err: unknown) {
      toast({ title: 'Erro ao criar proposta', description: mensagemErro(err), variant: 'destructive' })
    } finally {
      setACriar(false)
    }
  }

  const carregando = isLoading || leadsCarregando || clientesCarregando

  return (
    <div className="space-y-6">
      <PageHeader title="Propostas" description={<> Simulações enviadas a leads e clientes, por estado. </>} action={<Button icon={<Plus />} onClick={() => setModalAberto(true)}>
          Nova proposta
        </Button>} />

      {carregando && <Spinner />}
      {error && <p role="alert" className="rounded-lg bg-danger-bg p-4 text-sm text-danger-text">Erro ao carregar propostas: {error.message}</p>}
      {!carregando && !error && (
        <KanbanBoard
          itens={propostas}
          colunas={ESTADOS_PROPOSTA}
          getId={(p) => p.id}
          getEstado={(p) => p.estado}
          getAtualizadoEm={(p) => p.atualizado_em}
          getTone={(estado) => TONE_ESTADO_PROPOSTA[estado as EstadoProposta]}
          onMudarEstado={(id, estado, atualizadoEm) => handleMudarEstado(id, estado as EstadoProposta, atualizadoEm)}
          renderCard={(p) => <PropostaCard proposta={p} nomeOrigem={nomeOrigem(p)} />}
          vazioTexto="Sem propostas"
        />
      )}

      {modalAberto && (
        <NovaPropostaModal
          leads={leads}
          clientes={clientes}
          aCriar={aCriar}
          onFechar={() => setModalAberto(false)}
          onCriar={handleCriar}
        />
      )}
    </div>
  )
}
