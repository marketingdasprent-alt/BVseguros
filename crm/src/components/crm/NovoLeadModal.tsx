import { useState, type FormEvent } from 'react'
import { MessageSquare, UserCheck } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Campo, CLASSE_INPUT, RodapeFormulario } from '@/components/ui/Campo'
import { Notice } from '@/components/ui/Notice'
import { RAMOS } from '@/lib/types'
import type { Lead, LeadEdicao, Ramo } from '@/lib/types'

interface NovoLeadModalProps {
  aCriar: boolean
  onFechar: () => void
  onCriar: (lead: LeadEdicao) => Promise<void>
  // Só em edição:
  inicial?: Lead
  onApagar?: () => void
  onConverter?: () => void
}

export function NovoLeadModal({ aCriar, onFechar, onCriar, inicial, onApagar, onConverter }: NovoLeadModalProps) {
  const [nome, setNome] = useState(inicial?.nome ?? '')
  const [telefone, setTelefone] = useState(inicial?.telefone ?? '')
  const [email, setEmail] = useState(inicial?.email ?? '')
  const [ramo, setRamo] = useState<Ramo>(inicial?.ramo_interesse ?? 'auto')
  const [notas, setNotas] = useState(inicial?.notas ?? '')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await onCriar({
      nome: nome.trim(),
      telefone: telefone.trim(),
      email: email.trim() || null,
      ramo_interesse: ramo,
      notas: notas.trim() || null,
    })
  }

  return (
    <Modal title={inicial ? 'Editar lead' : 'Novo lead'} subtitle={inicial?.nome} onClose={onFechar} busy={aCriar}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {inicial?.mensagem && (
          <Notice icon={MessageSquare}>
            <p className="text-xs font-medium text-muted">Mensagem enviada pelo site</p>
            <p className="mt-1 whitespace-pre-line">{inicial.mensagem}</p>
          </Notice>
        )}

        <Campo label="Nome" required>
          <input required value={nome} onChange={(e) => setNome(e.target.value)} className={CLASSE_INPUT} />
        </Campo>
        <Campo label="Telefone" required>
          <input required value={telefone} onChange={(e) => setTelefone(e.target.value)} className={CLASSE_INPUT} />
        </Campo>
        <Campo label="Email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={CLASSE_INPUT} />
        </Campo>
        <Campo label="Ramo de interesse">
          <select value={ramo} onChange={(e) => setRamo(e.target.value as Ramo)} className={CLASSE_INPUT}>
            {RAMOS.map((r) => (
              <option key={r.valor} value={r.valor}>
                {r.rotulo}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Notas">
          <textarea rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} className={CLASSE_INPUT} />
        </Campo>

        {onConverter && (
          <Notice tone="info" icon={UserCheck}
            action={<Button type="button" variant="secondary" size="sm" disabled={aCriar} onClick={onConverter}>Converter</Button>}>
            Este lead está pronto a passar a cliente?
          </Notice>
        )}

        <RodapeFormulario aGuardar={aCriar} textoGuardar={inicial ? 'Guardar alterações' : 'Criar lead'} onCancelar={onFechar} onApagar={onApagar} />
      </form>
    </Modal>
  )
}
