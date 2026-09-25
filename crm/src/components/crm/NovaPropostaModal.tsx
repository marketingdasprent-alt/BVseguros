import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { RAMOS } from '@/lib/types'
import type { Cliente, Lead, Proposta, PropostaEdicao, PropostaInsert, Ramo } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { Campo, CLASSE_INPUT, ContextoFormulario, RodapeFormulario } from '@/components/ui/Campo'
import { CampoSeguradora } from '@/components/crm/CampoSeguradora'

interface NovaPropostaModalProps {
  leads: Lead[]
  clientes: Cliente[]
  aCriar: boolean
  onFechar: () => void
  onCriar: (proposta: PropostaInsert) => Promise<void>
  // Só em edição (a origem não muda):
  inicial?: Proposta
  nomeOrigem?: string
  onGuardar?: (dados: PropostaEdicao) => Promise<void>
  onApagar?: () => void
  seguradoras?: string[]
}

export function NovaPropostaModal({ leads, clientes, aCriar, onFechar, onCriar, inicial, nomeOrigem, onGuardar, onApagar, seguradoras }: NovaPropostaModalProps) {
  const [origem, setOrigem] = useState<'lead' | 'cliente'>(leads.length > 0 ? 'lead' : 'cliente')
  const [origemId, setOrigemId] = useState(leads[0]?.id ?? clientes[0]?.id ?? '')
  const [ramo, setRamo] = useState<Ramo>(inicial?.ramo ?? 'auto')
  const [seguradora, setSeguradora] = useState(inicial?.seguradora ?? '')
  const [premio, setPremio] = useState(inicial?.premio_anual_estimado != null ? String(inicial.premio_anual_estimado) : '')
  const [coberturas, setCoberturas] = useState(inicial?.coberturas ?? '')
  const [notas, setNotas] = useState(inicial?.notas ?? '')

  const listaOrigem = origem === 'lead' ? leads : clientes

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (inicial && onGuardar) {
      await onGuardar({
        ramo,
        seguradora: seguradora.trim(),
        premio_anual_estimado: premio ? Number(premio) : null,
        coberturas: coberturas.trim() || null,
        notas: notas.trim() || null,
      })
      return
    }
    await onCriar({
      lead_id: origem === 'lead' ? origemId : null,
      cliente_id: origem === 'cliente' ? origemId : null,
      ramo,
      seguradora,
      premio_anual_estimado: premio ? Number(premio) : null,
      coberturas: null,
      estado: 'rascunho',
      notas: null,
    })
  }

  return (
    <Modal title={inicial ? 'Editar proposta' : 'Nova proposta'} onClose={onFechar} busy={aCriar}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {inicial ? (
          <ContextoFormulario itens={[{ rotulo: inicial.lead_id ? 'Lead' : 'Cliente', valor: nomeOrigem }]} />
        ) : (<>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={origem === 'lead' ? 'primary' : 'secondary'}
            size="sm"
            className="flex-1"
            onClick={() => {
              setOrigem('lead')
              setOrigemId(leads[0]?.id ?? '')
            }}
          >
            A partir de lead
          </Button>
          <Button
            type="button"
            variant={origem === 'cliente' ? 'primary' : 'secondary'}
            size="sm"
            className="flex-1"
            onClick={() => {
              setOrigem('cliente')
              setOrigemId(clientes[0]?.id ?? '')
            }}
          >
            A partir de cliente
          </Button>
        </div>

        {listaOrigem.length === 0 ? (
          <p className="text-sm text-muted">
            {origem === 'lead' ? 'Sem leads registados.' : 'Sem clientes registados.'}
          </p>
        ) : (
          <label className="block min-w-0 space-y-2">
            <span className="block text-xs font-medium text-ink">
              {origem === 'lead' ? 'Lead' : 'Cliente'}
              <span className="text-danger"> *</span>
            </span>
            <select
              value={origemId}
              onChange={(e) => setOrigemId(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
            >
              {listaOrigem.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                </option>
              ))}
            </select>
          </label>
        )}
        </>)}

        <label className="block min-w-0 space-y-2">
          <span className="block text-xs font-medium text-ink">Ramo</span>
          <select
            value={ramo}
            onChange={(e) => setRamo(e.target.value as Ramo)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
          >
            {RAMOS.map((r) => (
              <option key={r.valor} value={r.valor}>
                {r.rotulo}
              </option>
            ))}
          </select>
        </label>

        <Campo label="Seguradora" required>
          <CampoSeguradora valor={seguradora} onChange={setSeguradora} opcoes={seguradoras} />
        </Campo>

        <label className="block min-w-0 space-y-2">
          <span className="block text-xs font-medium text-ink">Prémio anual estimado (€)</span>
          <input
            type="number"
            step="0.01"
            value={premio}
            onChange={(e) => setPremio(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
        </label>

        {inicial && (
          <>
            <Campo label="Coberturas">
              <textarea rows={2} value={coberturas} onChange={(e) => setCoberturas(e.target.value)} className={CLASSE_INPUT} />
            </Campo>
            <Campo label="Notas">
              <textarea rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} className={CLASSE_INPUT} />
            </Campo>
          </>
        )}

        <RodapeFormulario aGuardar={aCriar} textoGuardar={inicial ? 'Guardar alterações' : 'Criar proposta'} onCancelar={onFechar}
          onApagar={onApagar} desativarGuardar={!inicial && listaOrigem.length === 0} />
      </form>
    </Modal>
  )
}
