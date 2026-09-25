import { UserCheck } from 'lucide-react'
import { ClienteFormModal } from '@/components/crm/ClienteFormModal'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import type { ClienteEdicao, Lead } from '@/lib/types'

interface ConverterLeadModalProps {
  lead: Lead
  aGuardar: boolean
  onFechar: () => void
  onConverter: (dados: ClienteEdicao) => Promise<void>
  onSoMarcarConvertido: () => Promise<void>
}

export function ConverterLeadModal({ lead, aGuardar, onFechar, onConverter, onSoMarcarConvertido }: ConverterLeadModalProps) {
  return (
    <ClienteFormModal
      titulo="Converter em cliente"
      subtitulo={lead.nome}
      inicial={{ nome: lead.nome, telefone: lead.telefone, email: lead.email, nif: null, morada: null }}
      textoGuardar="Criar cliente"
      aGuardar={aGuardar}
      onFechar={onFechar}
      onGuardar={onConverter}
      aviso={
        <Notice tone="info" icon={UserCheck}>
          As propostas e atividades deste lead passam para o novo cliente, e o lead fica como convertido.
        </Notice>
      }
      inicioRodape={
        <Button type="button" variant="ghost" disabled={aGuardar} onClick={onSoMarcarConvertido}
          title="Usar quando o cliente já existe no CRM">
          Só marcar como convertido
        </Button>
      }
    />
  )
}
