import { Modal } from '@/components/ui/Modal'
import { NovaAtividadeForm } from '@/components/crm/NovaAtividadeForm'
import { FichaAtividades } from '@/components/crm/FichaSecoes'
import type { Atividade, AtividadeInsert, Lead } from '@/lib/types'

interface AtividadesLeadModalProps {
  lead: Lead
  atividades: Atividade[]
  responsavelId: string | null
  aGuardar: boolean
  onCriar: (atividade: AtividadeInsert) => Promise<boolean>
  // Sem permissão de editar tarefas: só a lista, sem formulário nem concluir.
  podeRegistar: boolean
  onAlternarConcluida: (atividade: Atividade) => void
  onFechar: () => void
}

// O seguimento de um lead (chamadas, próximos passos) sem sair do Kanban.
export function AtividadesLeadModal({ lead, atividades, responsavelId, aGuardar, onCriar, podeRegistar, onAlternarConcluida, onFechar }: AtividadesLeadModalProps) {
  return (
    <Modal title="Atividades" subtitle={lead.nome} largo onClose={onFechar} busy={aGuardar}>
      <div className="space-y-5">
        {podeRegistar && <NovaAtividadeForm leads={[lead]} clientes={[]} leadFixoId={lead.id} responsavelId={responsavelId} aCriar={aGuardar} onCriar={onCriar} />}
        <FichaAtividades atividades={atividades} onAlternarConcluida={podeRegistar ? onAlternarConcluida : undefined}
          descricaoVazio="Registe a primeira chamada ou marque o próximo passo com uma tarefa com prazo." />
      </div>
    </Modal>
  )
}
