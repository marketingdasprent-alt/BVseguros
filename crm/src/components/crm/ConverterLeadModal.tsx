import { ClienteFormModal } from '@/components/crm/ClienteFormModal'
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
      inicial={{ nome: lead.nome, telefone: lead.telefone, email: lead.email, nif: null, morada: null }}
      textoGuardar="Criar cliente"
      aGuardar={aGuardar}
      onFechar={onFechar}
      onGuardar={onConverter}
      aviso={
        <div className="space-y-2 rounded-lg bg-sand p-3 text-sm text-ink">
          <p>
            Cria o cliente a partir deste lead. As propostas e atividades do lead passam para o cliente, e o lead fica
            como convertido.
          </p>
          <p className="text-muted">
            O cliente já existe?{' '}
            <button type="button" disabled={aGuardar} onClick={onSoMarcarConvertido}
              className="font-medium text-navy underline underline-offset-2 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy rounded">
              Marcar só como convertido
            </button>
          </p>
        </div>
      }
    />
  )
}
