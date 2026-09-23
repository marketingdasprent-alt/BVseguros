import { PageHeader } from '@/components/ui/PageHeader';
import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { NovaAtividadeForm } from '@/components/crm/NovaAtividadeForm'
import { AtividadesTable } from '@/components/crm/AtividadesTable'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAtividades, criarAtividade, marcarConcluida } from '@/hooks/useAtividades'
import { useLeads } from '@/hooks/useLeads'
import { useClientes } from '@/hooks/useClientes'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import type { Atividade, AtividadeInsert } from '@/lib/types'

export default function Atividades() {
  const { data: atividades, isLoading, error, recarregar } = useAtividades()
  const { data: leads, isLoading: leadsCarregando } = useLeads()
  const { data: clientes, isLoading: clientesCarregando } = useClientes()
  const { profile } = useAuth()
  const { toast } = useToast()
  const [aCriar, setACriar] = useState(false)
  const [formOpen, setFormOpen] = useState(false)

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

  const carregando = isLoading || leadsCarregando || clientesCarregando

  return (
    <div className="space-y-6">
      <PageHeader title="Atividades" description={<> Chamadas, emails, reuniões, tarefas e notas. </>} action={<Button icon={formOpen ? <X /> : <Plus />} onClick={() => setFormOpen(!formOpen)}>{formOpen ? 'Fechar formulário' : 'Nova atividade'}</Button>} />

      {formOpen && !leadsCarregando && !clientesCarregando && (
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
          <EmptyState titulo="Sem atividades ainda" descricao="Registe chamadas, reuniões e tarefas para acompanhar cada contacto." action={<Button variant="secondary" onClick={() => setFormOpen(true)}>Registar atividade</Button>} />
        </div>
      )}
      {!carregando && !error && atividades.length > 0 && (
        <AtividadesTable
          atividades={atividades}
          leads={leads}
          clientes={clientes}
          onAlternarConcluida={handleAlternarConcluida}
        />
      )}
    </div>
  )
}
