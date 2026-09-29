import { PageHeader } from '@/components/ui/PageHeader';
import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { KanbanBoard } from '@/components/crm/KanbanBoard'
import { LeadCard } from '@/components/crm/LeadCard'
import { NovoLeadModal } from '@/components/crm/NovoLeadModal'
import { ConverterLeadModal } from '@/components/crm/ConverterLeadModal'
import { FiltroResponsavel } from '@/components/crm/FiltroResponsavel'
import { BarraPesquisa } from '@/components/crm/BarraPesquisa'
import { SemResultados } from '@/components/crm/SemResultados'
import { AvisoTruncado } from '@/components/crm/AvisoTruncado'
import { useFiltrosUrl } from '@/hooks/useFiltrosUrl'
import { corresponde } from '@/lib/pesquisa'
import { AtribuirResponsavelModal } from '@/components/crm/AtribuirResponsavelModal'
import { AtividadesLeadModal } from '@/components/crm/AtividadesLeadModal'
import { useAtividades, criarAtividade, marcarConcluida } from '@/hooks/useAtividades'
import { resumirAtividadesPorLead } from '@/lib/atividades'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { useLeads, criarLead, atualizarEstadoLead, atribuirLead, atualizarLead, apagarLead, converterLead } from '@/hooks/useLeads'
import { useEquipa } from '@/hooks/useEquipa'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { useConfirmarApagar } from '@/hooks/useConfirmarApagar'
import { ESTADOS_LEAD } from '@/lib/types'
import type { Atividade, AtividadeInsert, ClienteEdicao, EstadoLead, Lead, LeadEdicao } from '@/lib/types'
import { TONE_ESTADO_LEAD } from '@/lib/tone'
import { mensagemErro } from '@/lib/erros'
import { filtrarPorResponsavel, lerFiltroResponsavel } from '@/lib/responsavel'

export default function Leads() {
  const { data: leads, isLoading, error, recarregar, truncado } = useLeads()
  const { ativos, nomePorId } = useEquipa()
  const { profile, pode } = useAuth()
  const podeEditar = pode('leads', 'editar')
  const { toast } = useToast()
  const { pedirConfirmacao, modalApagar } = useConfirmarApagar(recarregar)
  const filtros = useFiltrosUrl()
  const [modalAberto, setModalAberto] = useState(false)
  const [aEditar, setAEditar] = useState<Lead | null>(null)
  const [aConverter, setAConverter] = useState<Lead | null>(null)
  const [aAtribuir, setAAtribuir] = useState<Lead | null>(null)
  const [aGuardar, setAGuardar] = useState(false)
  const atividades = useAtividades()
  const [aVerAtividades, setAVerAtividades] = useState<Lead | null>(null)
  const resumoAtividades = useMemo(() => resumirAtividadesPorLead(atividades.data), [atividades.data])

  const filtro = lerFiltroResponsavel(filtros.ler('responsavel'))
  const termo = filtros.ler('q')
  const leadsFiltrados = useMemo(
    () => filtrarPorResponsavel(leads, filtro, profile?.id ?? null).filter((l) => corresponde([l.nome, l.telefone, l.email, l.mensagem, l.notas], termo)),
    [leads, filtro, profile?.id, termo],
  )

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

  const handleCriarAtividade = async (dados: AtividadeInsert) => {
    setAGuardar(true)
    try {
      await criarAtividade(dados)
      await atividades.recarregar()
      toast({ title: 'Atividade registada' })
      return true
    } catch (err: unknown) {
      toast({ title: 'Erro ao registar atividade', description: mensagemErro(err), variant: 'destructive' })
      return false
    } finally {
      setAGuardar(false)
    }
  }

  const handleAlternarConcluida = async (atividade: Atividade) => {
    try {
      await marcarConcluida(atividade.id, !atividade.concluida)
      await atividades.recarregar()
    } catch (err: unknown) {
      toast({ title: 'Erro ao atualizar tarefa', description: mensagemErro(err), variant: 'destructive' })
    }
  }

  const handlePedirApagar = (lead: Lead) => {
    setAEditar(null)
    pedirConfirmacao({
      acao: 'Apagar lead',
      nome: lead.nome,
      aviso: 'As propostas e atividades deste lead também são apagadas. Se já foi convertido, o cliente mantém-se.',
      apagar: () => apagarLead(lead.id),
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Leads" description={<> Contactos por converter, organizados por etapa. </>} action={podeEditar && <Button icon={<Plus />} onClick={() => setModalAberto(true)}>
          Novo lead
        </Button>} />

      {isLoading && <Spinner />}
      {error && <p role="alert" className="rounded-lg bg-danger-bg p-4 text-sm text-danger-text">Erro ao carregar leads: {error.message}</p>}
      {!isLoading && !error && (
        <>
          <AvisoTruncado truncado={truncado} />
          <BarraPesquisa valor={termo} onChange={(v) => filtros.definir('q', v)} rotulo="Pesquisar leads" placeholder="Nome, telefone, email ou notas" />
          {leads.length > 0 && leadsFiltrados.length === 0 ? (
            <SemResultados termo={termo} onLimpar={filtros.limpar} />
          ) : (
          <KanbanBoard
            acoesBarra={<FiltroResponsavel valor={filtro} onChange={(valor) => filtros.definir('responsavel', valor, 'todos')} />}
            itens={leadsFiltrados}
            colunas={ESTADOS_LEAD}
            getId={(lead) => lead.id}
            getEstado={(lead) => lead.estado}
            getAtualizadoEm={(lead) => lead.atualizado_em}
            getTone={(estado) => TONE_ESTADO_LEAD[estado as EstadoLead]}
            onMudarEstado={podeEditar ? (id, estado, atualizadoEm) => handleMudarEstado(id, estado as EstadoLead, atualizadoEm) : undefined}
            renderCard={(lead) => (
              <LeadCard
                lead={lead}
                nomeResponsavel={lead.responsavel_id ? nomePorId.get(lead.responsavel_id) ?? null : null}
                podeAtribuir={pode('leads', 'atribuir')}
                onAssumir={podeEditar ? (l) => profile && handleAtribuir(l, profile.id) : undefined}
                onAtribuir={setAAtribuir}
                onEditar={podeEditar ? setAEditar : undefined}
                numAtividades={resumoAtividades.get(lead.id)?.total ?? 0}
                proximaTarefa={resumoAtividades.get(lead.id)?.proximaTarefa ?? null}
                onAtividades={pode('atividades', 'ver') ? setAVerAtividades : undefined}
              />
            )}
            vazioTexto="Sem leads"
          />
          )}
        </>
      )}

      {modalAberto && <NovoLeadModal aCriar={aGuardar} onFechar={() => setModalAberto(false)} onCriar={handleCriar} />}

      {aEditar && (
        <NovoLeadModal
          inicial={aEditar}
          aCriar={aGuardar}
          onFechar={() => setAEditar(null)}
          onCriar={(dados) => handleEditar(aEditar, dados)}
          onApagar={pode('leads', 'apagar') ? () => handlePedirApagar(aEditar) : undefined}
          onConverter={aEditar.estado !== 'convertido' && pode('clientes', 'editar') ? () => { setAConverter(aEditar); setAEditar(null) } : undefined}
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

      {aVerAtividades && (
        <AtividadesLeadModal
          lead={aVerAtividades}
          atividades={atividades.data.filter((a) => a.lead_id === aVerAtividades.id)}
          responsavelId={profile?.id ?? null}
          aGuardar={aGuardar}
          podeRegistar={pode('atividades', 'editar')}
          onCriar={handleCriarAtividade}
          onAlternarConcluida={handleAlternarConcluida}
          onFechar={() => setAVerAtividades(null)}
        />
      )}

      {modalApagar}
    </div>
  )
}
