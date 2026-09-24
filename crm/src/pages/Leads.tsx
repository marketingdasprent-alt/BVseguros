import { PageHeader } from '@/components/ui/PageHeader';
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { KanbanBoard } from '@/components/crm/KanbanBoard'
import { LeadCard } from '@/components/crm/LeadCard'
import { NovoLeadModal } from '@/components/crm/NovoLeadModal'
import { FiltroResponsavel } from '@/components/crm/FiltroResponsavel'
import { AtribuirResponsavelModal } from '@/components/crm/AtribuirResponsavelModal'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { useLeads, criarLead, atualizarEstadoLead, atribuirLead } from '@/hooks/useLeads'
import { useEquipa } from '@/hooks/useEquipa'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { ESTADOS_LEAD } from '@/lib/types'
import type { EstadoLead, Lead, LeadInsert } from '@/lib/types'
import { TONE_ESTADO_LEAD } from '@/lib/tone'
import { mensagemErro } from '@/lib/erros'
import { filtrarPorResponsavel, lerFiltroResponsavel } from '@/lib/responsavel'

export default function Leads() {
  const { data: leads, isLoading, error, recarregar } = useLeads()
  const { ativos, nomePorId } = useEquipa()
  const { profile, isAdmin } = useAuth()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [modalAberto, setModalAberto] = useState(false)
  const [aCriar, setACriar] = useState(false)
  const [aAtribuir, setAAtribuir] = useState<Lead | null>(null)
  const [aGuardarResponsavel, setAGuardarResponsavel] = useState(false)

  const filtro = lerFiltroResponsavel(searchParams.get('responsavel'))
  const leadsFiltrados = useMemo(() => filtrarPorResponsavel(leads, filtro, profile?.id ?? null), [leads, filtro, profile?.id])

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

  const handleAtribuir = async (lead: Lead, responsavelId: string | null) => {
    setAGuardarResponsavel(true)
    try {
      await atribuirLead(lead.id, responsavelId, lead.atualizado_em)
      await recarregar()
      setAAtribuir(null)
      toast({ title: responsavelId === profile?.id ? 'Lead assumido' : 'Responsável atualizado' })
    } catch (err: unknown) {
      toast({ title: 'Erro ao atribuir lead', description: mensagemErro(err), variant: 'destructive' })
      await recarregar()
    } finally {
      setAGuardarResponsavel(false)
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
        <>
          <FiltroResponsavel valor={filtro} onChange={(valor) => setSearchParams(valor === 'todos' ? {} : { responsavel: valor }, { replace: true })} />
          <KanbanBoard
            itens={leadsFiltrados}
            colunas={ESTADOS_LEAD}
            getId={(lead) => lead.id}
            getEstado={(lead) => lead.estado}
            getAtualizadoEm={(lead) => lead.atualizado_em}
            getTone={(estado) => TONE_ESTADO_LEAD[estado as EstadoLead]}
            onMudarEstado={(id, estado, atualizadoEm) => handleMudarEstado(id, estado as EstadoLead, atualizadoEm)}
            renderCard={(lead) => (
              <LeadCard
                lead={lead}
                nomeResponsavel={lead.responsavel_id ? nomePorId.get(lead.responsavel_id) ?? null : null}
                podeAtribuir={isAdmin}
                onAssumir={(l) => profile && handleAtribuir(l, profile.id)}
                onAtribuir={setAAtribuir}
              />
            )}
            vazioTexto="Sem leads"
          />
        </>
      )}

      {modalAberto && (
        <NovoLeadModal aCriar={aCriar} onFechar={() => setModalAberto(false)} onCriar={handleCriar} />
      )}

      {aAtribuir && (
        <AtribuirResponsavelModal
          nomeRegisto={aAtribuir.nome}
          responsavelAtual={aAtribuir.responsavel_id}
          membros={ativos}
          aGuardar={aGuardarResponsavel}
          onFechar={() => setAAtribuir(null)}
          onConfirmar={(responsavelId) => handleAtribuir(aAtribuir, responsavelId)}
        />
      )}
    </div>
  )
}
