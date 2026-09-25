import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { dataLocalIso } from '@/lib/format'
import { ESTADOS_SINISTRO } from '@/lib/types'
import type { Apolice, Sinistro, SinistroEdicao, SinistroInsert } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { Campo, CLASSE_INPUT, ContextoFormulario, RodapeFormulario } from '@/components/ui/Campo'

interface NovoSinistroModalProps {
  apolices: Apolice[]
  aCriar: boolean
  onFechar: () => void
  onCriar: (sinistro: SinistroInsert) => Promise<void>
  // Só em edição (a apólice não muda):
  inicial?: Sinistro
  onGuardar?: (dados: SinistroEdicao) => Promise<void>
  onApagar?: () => void
}

export function NovoSinistroModal({ apolices, aCriar, onFechar, onCriar, inicial, onGuardar, onApagar }: NovoSinistroModalProps) {
  const [apoliceId, setApoliceId] = useState(apolices[0]?.id ?? '')
  const [dataOcorrencia, setDataOcorrencia] = useState(inicial?.data_ocorrencia ?? '')
  const [descricao, setDescricao] = useState(inicial?.descricao ?? '')
  const [valorEstimado, setValorEstimado] = useState(inicial?.valor_estimado != null ? String(inicial.valor_estimado) : '')
  const [numero, setNumero] = useState(inicial?.numero_sinistro ?? '')
  const [valorPago, setValorPago] = useState(inicial?.valor_pago != null ? String(inicial.valor_pago) : '')
  const [notas, setNotas] = useState(inicial?.notas ?? '')
  const hoje = dataLocalIso()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (inicial && onGuardar) {
      await onGuardar({
        numero_sinistro: numero.trim() || null,
        data_ocorrencia: dataOcorrencia,
        descricao: descricao.trim(),
        valor_estimado: valorEstimado ? Number(valorEstimado) : null,
        valor_pago: valorPago ? Number(valorPago) : null,
        notas: notas.trim() || null,
      })
      return
    }
    await onCriar({
      apolice_id: apoliceId,
      numero_sinistro: null,
      data_ocorrencia: dataOcorrencia,
      descricao,
      estado: 'participado',
      valor_estimado: valorEstimado ? Number(valorEstimado) : null,
      valor_pago: null,
      notas: null,
    })
  }

  if (apolices.length === 0 && !inicial) {
    return (
      <Modal title="Novo sinistro" onClose={onFechar} busy={aCriar}>
        <div className="space-y-5">
          
          <p className="text-sm text-muted pr-6">Crie primeiro uma apólice para poder participar um sinistro.</p>
          <Button variant="secondary" disabled={aCriar} onClick={onFechar} className="w-full">
            Fechar
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title={inicial ? 'Editar sinistro' : 'Novo sinistro'} onClose={onFechar} busy={aCriar}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {inicial ? (
          <ContextoFormulario itens={[
            { rotulo: 'Apólice', valor: apolices.find((a) => a.id === inicial.apolice_id)?.numero_apolice ?? '—' },
            { rotulo: 'Estado', valor: ESTADOS_SINISTRO.find((e) => e.valor === inicial.estado)?.rotulo ?? inicial.estado },
          ]} />
        ) : (
        <label className="block min-w-0 space-y-2">
          <span className="block text-xs font-medium text-ink">Apólice</span>
          <select
            value={apoliceId}
            onChange={(e) => setApoliceId(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
          >
            {apolices.map((a) => (
              <option key={a.id} value={a.id}>
                {a.numero_apolice} · {a.seguradora}
              </option>
            ))}
          </select>
        </label>
        )}

        {inicial && (
          <Campo label="Nº do sinistro na seguradora">
            <input value={numero} onChange={(e) => setNumero(e.target.value)} className={CLASSE_INPUT} />
          </Campo>
        )}

        <label className="block min-w-0 space-y-2">
          <span className="block text-xs font-medium text-ink">
            Data de ocorrência<span className="text-danger"> *</span>
          </span>
          <input
            required
            type="date"
            max={hoje}
            value={dataOcorrencia}
            onChange={(e) => setDataOcorrencia(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
        </label>

        <label className="block min-w-0 space-y-2">
          <span className="block text-xs font-medium text-ink">
            Descrição<span className="text-danger"> *</span>
          </span>
          <input
            required
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
        </label>

        <label className="block min-w-0 space-y-2">
          <span className="block text-xs font-medium text-ink">Valor estimado (€)</span>
          <input
            type="number"
            step="0.01"
            value={valorEstimado}
            onChange={(e) => setValorEstimado(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
        </label>

        {inicial && (
          <>
            <Campo label="Valor pago (€)">
              <input type="number" step="0.01" min="0" value={valorPago} onChange={(e) => setValorPago(e.target.value)} className={CLASSE_INPUT} />
            </Campo>
            <Campo label="Notas">
              <textarea rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} className={CLASSE_INPUT} />
            </Campo>
          </>
        )}

        <RodapeFormulario aGuardar={aCriar} textoGuardar={inicial ? 'Guardar alterações' : 'Criar sinistro'} onCancelar={onFechar} onApagar={onApagar} />
      </form>
    </Modal>
  )
}
