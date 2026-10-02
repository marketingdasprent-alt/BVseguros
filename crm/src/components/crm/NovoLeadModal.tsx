import { useState, type FormEvent } from 'react'
import { UserCheck } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Campo, CLASSE_INPUT, RodapeFormulario } from '@/components/ui/Campo'
import { Notice } from '@/components/ui/Notice'
import { MensagemSite } from '@/components/crm/MensagemSite'
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
  const mensagem = inicial?.mensagem

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
    <Modal title={inicial ? 'Editar lead' : 'Novo lead'} subtitle={inicial?.nome} onClose={onFechar} busy={aCriar} ecraInteiro>
      <form onSubmit={handleSubmit} className="editor-ecra">
        {/* No DOM o pedido vem primeiro (lê-se antes de editar); em desktop fica à direita do formulário. */}
        <div className={`editor-ecra__grelha${mensagem ? '' : ' editor-ecra__grelha--simples'}`}>
          {mensagem && (
            <aside className="editor-ecra__lateral">
              <MensagemSite texto={mensagem} />
            </aside>
          )}

          <section className="editor-ecra__painel" aria-labelledby="editor-ecra-titulo">
            <h3 id="editor-ecra-titulo" className="editor-ecra__titulo">Dados do lead</h3>
            <div className="editor-ecra__campos">
              <Campo label="Nome" required>
                <input required value={nome} onChange={(e) => setNome(e.target.value)} className={CLASSE_INPUT} autoComplete="off" />
              </Campo>
              <Campo label="Telefone" required>
                <input required type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} className={`${CLASSE_INPUT} tabular-nums`} autoComplete="off" />
              </Campo>
              <Campo label="Email">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={CLASSE_INPUT} autoComplete="off" />
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
              <Campo label="Notas" className="editor-ecra__largo">
                <textarea rows={6} value={notas} onChange={(e) => setNotas(e.target.value)} className={CLASSE_INPUT}
                  placeholder="O que combinou com o cliente, próximos passos, seguradoras a consultar…" />
              </Campo>
            </div>

            {onConverter && (
              <Notice tone="info" icon={UserCheck}
                action={<Button type="button" variant="secondary" size="sm" disabled={aCriar} onClick={onConverter}>Converter em cliente</Button>}>
                Este lead está pronto a passar a cliente?
              </Notice>
            )}
          </section>
        </div>

        <div className="editor-ecra__rodape">
          <RodapeFormulario aGuardar={aCriar} textoGuardar={inicial ? 'Guardar alterações' : 'Criar lead'} onCancelar={onFechar} onApagar={onApagar} />
        </div>
      </form>
    </Modal>
  )
}
