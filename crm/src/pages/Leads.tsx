import { PageHeader } from '@/components/ui/PageHeader';
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { KanbanBoard } from '@/components/crm/KanbanBoard'
import { LeadCard } from '@/components/crm/LeadCard'
import { NovoLeadModal } from '@/components/crm/NovoLeadModal'
import { ConverterLeadModal } from '@/components/crm/ConverterLeadModal'
import { FiltroResponsavel } from '@/components/crm/FiltroResponsavel'
import { AtribuirResponsavelModal } from '@/components/crm/AtribuirResponsavelModal'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { useLeads, criarLead, atualizarEstadoLead, atribuirLead, atualizarLead, apagarLead, converterLead } from '@/hooks/useLeads'
import { useEquipa } from '@/hooks/useEquipa'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { useConfirmarApagar } from '@/hooks/useConfirmarApagar'
import { ESTADOS_LEAD } from '@/lib/types'
import type { ClienteEdicao, EstadoLead, Lead, LeadEdicao } from '@/lib/types'
import { TONE_ESTADO_LEAD } from '@/lib/tone'
import { mensagemErro } from '@/lib/erros'
import { filtrarPorResponsavel, lerFiltroResponsavel } from '@/lib/responsavel'

export default function Leads() {
  const { data: leads, isLoading, error, recarregar } = useLeads()
  const { ativos, nomePorId } = useEquipa()
  const { profile, isAdmin } = useAuth()
  const { toast } = useToast()
  const { pedirConfirmacao, modalApagar } = useConfirmarApagar(recarregar)
  const [searchParams, setSearchParams] = useSearchParams()
  const [modalAberto, setModalAberto] = useState(false)
  const [aEditar, setAEditar] = useState<Lead | null>(null)
  const [aConverter, setAConverter] = useState<Lead | null>(null)
  const [aAtribuir, setAAtribuir] = useState<Lead | null>(null)
  const [aGuardar, setAGuardar] = useState(false)

  const filtro = lerFiltroResponsavel(searchParams.get('responsavel'))
  const leadsFiltrados = useMemo(() => filtrarPorResponsavel(leads, filtro, profile?.id ?? null), [leads, filtro, profile?.id])

  // Corre a gravação com o estado de "a guardar" e o toast de erro comuns a todos os modais.
  const guardar = async (acao: () => Promise<unknown>, sucesso: string, tituloErro: string, fechar: () => void) => {
    setAGuardar(true)
    try {
      await acao()
      await recarregar()
      fechar()
      toast({ title: sucesso })
    } catch (err: unknown) {
      toast({ title: tituloErro, description: mensagemErro(err), variant: 'destructive' })
      await recarregar()
    } finally {
      setAGuardar(false)
    }
  }

  const handleMudarEstado = async (id: string, estado: EstadoLead, atualizadoEm: string) => {
    // Converter liga o lead a um cliente; por isso abre o formulário em vez de só mover.
    if (estado === 'convertido') {
      setAConverter(leads.find((l) => l.id === id) ?? null)
      return
    }
    try {
      await atualizarEstadoLead(id, estado, atualizadoEm)
      await recarregar()
    } catch (err: unknown) {
      toast({ title: 'Erro ao mover lead', description: mensagemErro(err), variant: 'destructive' })
      await recarregar()
    }
  }

  const handleCriar = (dados: LeadEdicao) =>
    guardar(() => criarLead({ ...dados, estado: 'novo' }), 'Lead criado com sucesso', 'Erro ao criar lead', () => setModalAberto(false))

  const handleEditar = (lead: Lead, dados: LeadEdicao) =>
    guardar(() => atualizarLead(lead.id, dados, lead.atualizado_em), 'Lead atualizado', 'Erro ao guardar lead', () => setAEditar(null))

  const handleConverter = (lead: Lead, dados: ClienteEdicao) =>
    guardar(() => converterLead(lead, dados), 'Lead convertido em cliente', 'Erro ao converter lead', () => setAConverter(null))

  const handleSoMarcarConvertido = (lead: Lead) =>
    guardar(() => atualizarEstadoLead(lead.id, 'convertido', lead.atualizado_em), 'Lead marcado como convertido', 'Erro ao mover lead', () => setAConverter(null))

  const handleAtribuir = (lead: Lead, responsavelId: string | null) =>
    guardar(() => atribuirLead(lead.id, responsavelId, lead.atualizado_em),
      responsavelId === profile?.id ? 'Lead assumido' : 'Responsável atualizado', 'Erro ao atribuir lead', () => setAAtribuir(null))

  const handlePedirApagar = (lead: Lead) => {
    setAEditar(null)
    pedirConfirmacao({
      titulo: 'Lead',
      nome: lead.nome,
      aviso: 'As propostas e atividades deste lead também são apagadas. Se já foi convertido, o cliente mantém-se.',
      apagar: () => apagarLead(lead.id),
    })
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
                onEditar={setAEditar}
              />
            )}
            vazioTexto="Sem leads"
          />
        </>
      )}

      {modalAberto && <NovoLeadModal aCriar={aGuardar} onFechar={() => setModalAberto(false)} onCriar={handleCriar} />}

      {aEditar && (
        <NovoLeadModal
          inicial={aEditar}
          aCriar={aGuardar}
          onFechar={() => setAEditar(null)}
          onCriar={(dados) => handleEditar(aEditar, dados)}
          onApagar={isAdmin ? () => handlePedirApagar(aEditar) : undefined}
          onConverter={aEditar.estado !== 'convertido' ? () => { setAConverter(aEditar); setAEditar(null) } : undefined}
        />
      )}

      {aConverter && (
        <ConverterLeadModal
          lead={aConverter}
          aGuardar={aGuardar}
          onFechar={() => setAConverter(null)}
          onConverter={(dados) => handleConverter(aConverter, dados)}
          onSoMarcarConvertido={() => handleSoMarcarConvertido(aConverter)}
        />
      )}

      {aAtribuir && (
        <AtribuirResponsavelModal
          nomeRegisto={aAtribuir.nome}
          responsavelAtual={aAtribuir.responsavel_id}
          membros={ativos}
          aGuardar={aGuardar}
          onFechar={() => setAAtribuir(null)}
          onConfirmar={(responsavelId) => handleAtribuir(aAtribuir, responsavelId)}
        />
      )}

      {modalApagar}
    </div>
  )
}
