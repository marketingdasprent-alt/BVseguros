import { PageHeader } from '@/components/ui/PageHeader';
import { useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { NovaAtividadeForm } from '@/components/crm/NovaAtividadeForm'
import { AtividadesTable } from '@/components/crm/AtividadesTable'
import { FiltroSelect } from '@/components/crm/FiltroSelect'
import { AvisoTruncado } from '@/components/crm/AvisoTruncado'
import { dataLocalIso } from '@/lib/format'
import { BarraPesquisa } from '@/components/crm/BarraPesquisa'
import { SemResultados } from '@/components/crm/SemResultados'
import { useFiltrosUrl } from '@/hooks/useFiltrosUrl'
import { corresponde } from '@/lib/pesquisa'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAtividades, criarAtividade, marcarConcluida, atualizarAtividade, apagarAtividade } from '@/hooks/useAtividades'
import { useConfirmarApagar } from '@/hooks/useConfirmarApagar'
import { mensagemErro } from '@/lib/erros'
import { useLeads } from '@/hooks/useLeads'
import { useClientes } from '@/hooks/useClientes'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import type { Atividade, AtividadeEdicao, AtividadeInsert } from '@/lib/types'

export default function Atividades() {
  const { data: atividades, isLoading, error, recarregar, truncado } = useAtividades()
  const { data: leads, isLoading: leadsCarregando } = useLeads()
  const { data: clientes, isLoading: clientesCarregando } = useClientes()
  const { profile, pode } = useAuth()
  const podeEditar = pode('atividades', 'editar')
  const { toast } = useToast()
  const [aCriar, setACriar] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [aEditar, setAEditar] = useState<Atividade | null>(null)
  const { pedirConfirmacao, modalApagar } = useConfirmarApagar(recarregar)

  const handleCriar = async (atividade: AtividadeInsert) => {
    setACriar(true)
    try {
      await criarAtividade(atividade)
      await recarregar()
      toast({ title: 'Atividade criada com sucesso' })
      return true;
    } catch (err: unknown) {
      const mensagem = err instanceof Error ? err.message : 'Erro inesperado'
      toast({ title: 'Erro ao criar atividade', description: mensagem, variant: 'destructive' })
      return false;
    } finally {
      setACriar(false)
    }
  }

  const handleAlternarConcluida = async (atividade: Atividade) => {
    try {
      await marcarConcluida(atividade.id, !atividade.concluida)
      await recarregar()
    } catch (err: unknown) {
      const mensagem = err instanceof Error ? err.message : 'Erro inesperado'
      toast({ title: 'Erro ao atualizar atividade', description: mensagem, variant: 'destructive' })
    }
  }

  const handleEditar = async (atividade: Atividade, dados: AtividadeEdicao) => {
    setACriar(true)
    try {
      await atualizarAtividade(atividade.id, dados)
      await recarregar()
      setAEditar(null)
      toast({ title: 'Atividade atualizada' })
      return true
    } catch (err: unknown) {
      toast({ title: 'Erro ao guardar atividade', description: mensagemErro(err), variant: 'destructive' })
      return false
    } finally {
      setACriar(false)
    }
  }

  const handlePedirApagar = (atividade: Atividade) => {
    setAEditar(null)
    pedirConfirmacao({ acao: 'Apagar atividade', nome: atividade.titulo, apagar: () => apagarAtividade(atividade.id) })
  }

  const filtros = useFiltrosUrl()
  const termo = filtros.ler('q')
  // Abre no que está por fazer; "todas" mostra também chamadas, emails e notas.
  const situacao = filtros.ler('situacao', 'pendentes')

  const atividadesFiltradas = useMemo(() => {
    const hoje = dataLocalIso()
    const nomeLead = new Map(leads.map((l) => [l.id, l.nome]))
    const nomeCliente = new Map(clientes.map((c) => [c.id, c.nome]))
    return atividades.filter((a) => {
      const pendente = a.tipo === 'tarefa' && !a.concluida
      if (situacao === 'pendentes' && !pendente) return false
      if (situacao === 'atrasadas' && !(pendente && !!a.data_prevista && a.data_prevista < hoje)) return false
      return corresponde([a.titulo, a.notas, a.lead_id && nomeLead.get(a.lead_id), a.cliente_id && nomeCliente.get(a.cliente_id)], termo)
    })
  }, [atividades, leads, clientes, termo, situacao])

  const carregando = isLoading || leadsCarregando || clientesCarregando

  return (
    <div className="space-y-6">
      <PageHeader title="Tarefas" description={<> O que está por fazer, e o registo de chamadas, emails, reuniões e notas. </>} action={podeEditar && <Button icon={formOpen ? <X /> : <Plus />} onClick={() => setFormOpen(!formOpen)}>{formOpen ? 'Fechar formulário' : 'Nova atividade'}</Button>} />

      {formOpen && podeEditar && !leadsCarregando && !clientesCarregando && (
        <NovaAtividadeForm
          leads={leads}
          clientes={clientes}
          responsavelId={profile?.id ?? null}
          aCriar={aCriar}
          onCriar={handleCriar}
        />
      )}

      {carregando && <Spinner />}
      {error && <p role="alert" className="rounded-lg bg-danger-bg p-4 text-sm text-danger-text">Erro ao carregar atividades: {error.message}</p>}
      {!carregando && !error && atividades.length === 0 && (
        <div className="panel">
          <EmptyState titulo="Sem atividades ainda" descricao="Registe chamadas, reuniões e tarefas para acompanhar cada contacto." action={podeEditar && <Button variant="secondary" onClick={() => setFormOpen(true)}>Registar atividade</Button>} />
        </div>
      )}
      {!carregando && !error && atividades.length > 0 && (
        <>
        <AvisoTruncado truncado={truncado} />
        <BarraPesquisa valor={termo} onChange={(v) => filtros.definir('q', v)} rotulo="Pesquisar atividades" placeholder="Título, notas ou pessoa associada"
          filtros={<FiltroSelect rotulo="Filtrar por situação" todos="Todas as atividades" valor={situacao === 'todas' ? '' : situacao}
            opcoes={[{ valor: 'pendentes', rotulo: 'Tarefas por concluir' }, { valor: 'atrasadas', rotulo: 'Tarefas em atraso' }]}
            onChange={(v) => filtros.definir('situacao', v || 'todas', 'pendentes')} />} />
        {atividadesFiltradas.length === 0 && !termo && situacao !== 'todas' ? (
          <div className="panel">
            <EmptyState titulo={situacao === 'atrasadas' ? 'Nenhuma tarefa em atraso' : 'Nada por fazer'}
              descricao="As tarefas com prazo que registar nos leads e clientes aparecem aqui."
              action={<Button variant="secondary" onClick={() => filtros.definir('situacao', 'todas', 'pendentes')}>Ver todas as atividades</Button>} />
          </div>
        ) : atividadesFiltradas.length === 0 ? (
          <SemResultados termo={termo} onLimpar={filtros.limpar} />
        ) : (
        <AtividadesTable
          atividades={atividadesFiltradas}
          leads={leads}
          clientes={clientes}
          onAlternarConcluida={podeEditar ? handleAlternarConcluida : undefined}
          onEditar={podeEditar ? setAEditar : undefined}
        />
        )}
        </>
      )}

      {aEditar && (
        <NovaAtividadeForm
          inicial={aEditar}
          leads={leads}
          clientes={clientes}
          responsavelId={aEditar.responsavel_id}
          aCriar={aCriar}
          onCriar={handleCriar}
          onGuardar={(dados) => handleEditar(aEditar, dados)}
          onCancelar={() => setAEditar(null)}
          onApagar={pode('atividades', 'apagar') ? () => handlePedirApagar(aEditar) : undefined}
        />
      )}

      {modalApagar}
    </div>
  )
}
