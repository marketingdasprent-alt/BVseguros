import { useState, type FormEvent } from 'react'
import { RAMOS, ESTADOS_APOLICE } from '@/lib/types'
import type { Apolice, ApoliceInsert, Cliente, EstadoApolice, Ramo } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Campo, CLASSE_INPUT, RodapeFormulario } from '@/components/ui/Campo'

interface NovoApoliceFormProps {
  clientes: Cliente[]
  aCriar: boolean
  onCriar: (apolice: ApoliceInsert) => Promise<boolean>
  // Com `inicial`, o formulário abre num modal para editar essa apólice.
  inicial?: Apolice
  onCancelar?: () => void
  onApagar?: () => void
}

export function NovoApoliceForm({ clientes, aCriar, onCriar, inicial, onCancelar, onApagar }: NovoApoliceFormProps) {
  const [clienteId, setClienteId] = useState(inicial?.cliente_id ?? clientes[0]?.id ?? '')
  const [numero, setNumero] = useState(inicial?.numero_apolice ?? '')
  const [ramo, setRamo] = useState<Ramo>(inicial?.ramo ?? 'auto')
  const [seguradora, setSeguradora] = useState(inicial?.seguradora ?? '')
  const [premio, setPremio] = useState(inicial?.premio_anual != null ? String(inicial.premio_anual) : '')
  const [dataInicio, setDataInicio] = useState(inicial?.data_inicio ?? '')
  const [dataFim, setDataFim] = useState(inicial?.data_fim ?? '')
  const [estado, setEstado] = useState<EstadoApolice>(inicial?.estado ?? 'ativa')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const success = await onCriar({
      cliente_id: clienteId,
      numero_apolice: numero.trim(),
      ramo,
      seguradora: seguradora.trim(),
      premio_anual: premio ? Number(premio) : null,
      data_inicio: dataInicio,
      data_fim: dataFim || null,
      estado,
    })
    if (!success || inicial) return
    setNumero('')
    setSeguradora('')
    setPremio('')
    setDataInicio('')
    setDataFim('')
  }

  if (clientes.length === 0) {
    return (
      <div className="panel p-5">
        <p className="text-sm text-muted">Cria primeiro um cliente para poderes associar uma apólice.</p>
      </div>
    )
  }

  const campos = (
    <>
      <Campo label="Cliente" required>
        <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className={CLASSE_INPUT}>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </Campo>
      <Campo label="Nº apólice" required>
        <input required value={numero} onChange={(e) => setNumero(e.target.value)} className={CLASSE_INPUT} />
      </Campo>
      <Campo label="Ramo" required>
        <select value={ramo} onChange={(e) => setRamo(e.target.value as Ramo)} className={CLASSE_INPUT}>
          {RAMOS.map((r) => (
            <option key={r.valor} value={r.valor}>
              {r.rotulo}
            </option>
          ))}
        </select>
      </Campo>
      <Campo label="Seguradora" required>
        <input required value={seguradora} onChange={(e) => setSeguradora(e.target.value)} className={CLASSE_INPUT} />
      </Campo>
      <Campo label="Prémio anual (€)">
        <input type="number" step="0.01" min="0" value={premio} onChange={(e) => setPremio(e.target.value)} className={`${CLASSE_INPUT} tabular-nums`} />
      </Campo>
      <Campo label="Data de início" required>
        <input required type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className={`${CLASSE_INPUT} tabular-nums`} />
      </Campo>
      <Campo label="Data de fim">
        <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className={`${CLASSE_INPUT} tabular-nums`} />
      </Campo>
      {inicial && (
        <Campo label="Estado" required>
          <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoApolice)} className={CLASSE_INPUT}>
            {ESTADOS_APOLICE.map((est) => (
              <option key={est.valor} value={est.valor}>
                {est.rotulo}
              </option>
            ))}
          </select>
        </Campo>
      )}
    </>
  )

  if (inicial) {
    return (
      <Modal title="Editar apólice" onClose={onCancelar ?? (() => {})} busy={aCriar}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">{campos}</div>
          <RodapeFormulario aGuardar={aCriar} textoGuardar="Guardar alterações" onCancelar={onCancelar ?? (() => {})} onApagar={onApagar} />
        </form>
      </Modal>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="panel form-panel grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
      <h2 className="form-title">Nova apólice</h2>
      {campos}
      <Button type="submit" loading={aCriar} className="col-span-full md:col-span-3">
        Guardar apólice
      </Button>
    </form>
  )
}
