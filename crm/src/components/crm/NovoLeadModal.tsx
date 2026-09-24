import { useState, type FormEvent } from 'react'
import { UserCheck } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Campo, CLASSE_INPUT, RodapeFormulario } from '@/components/ui/Campo'
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
    <Modal title={inicial ? 'Editar lead' : 'Novo lead'} onClose={onFechar} busy={aCriar}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {inicial?.mensagem && (
          <div className="rounded-lg bg-sand p-3 text-sm">
            <p className="text-xs font-medium text-muted">Mensagem enviada pelo site</p>
            <p className="mt-1 whitespace-pre-line text-ink">{inicial.mensagem}</p>
          </div>
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
          <Button type="button" variant="secondary" icon={<UserCheck />} disabled={aCriar} onClick={onConverter} className="w-full">
            Converter em cliente
          </Button>
        )}

        <RodapeFormulario aGuardar={aCriar} textoGuardar={inicial ? 'Guardar alterações' : 'Criar lead'} onCancelar={onFechar} onApagar={onApagar} />
      </form>
    </Modal>
  )
}
