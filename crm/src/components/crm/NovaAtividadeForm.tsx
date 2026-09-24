import { useState, type FormEvent, type ReactNode } from 'react'
import { TIPOS_ATIVIDADE } from '@/lib/types'
import type { Atividade, AtividadeEdicao, AtividadeInsert, Cliente, Lead, TipoAtividade } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { CLASSE_INPUT, RodapeFormulario } from '@/components/ui/Campo'

interface NovaAtividadeFormProps {
  leads: Lead[]
  clientes: Cliente[]
  responsavelId: string | null
  aCriar: boolean
  onCriar: (atividade: AtividadeInsert) => Promise<boolean>
  // Com inicial, abre num modal para editar essa atividade.
  inicial?: Atividade
  onGuardar?: (dados: AtividadeEdicao) => Promise<boolean>
  onCancelar?: () => void
  onApagar?: () => void
}

export function NovaAtividadeForm({ leads, clientes, responsavelId, aCriar, onCriar, inicial, onGuardar, onCancelar, onApagar }: NovaAtividadeFormProps) {
  const [tipo, setTipo] = useState<TipoAtividade>(inicial?.tipo ?? 'chamada')
  const [titulo, setTitulo] = useState(inicial?.titulo ?? '')
  // Depois de converter, a atividade tem lead e cliente; o cliente é o que conta.
  const [ligadoA, setLigadoA] = useState<'nenhum' | 'lead' | 'cliente'>(
    inicial?.cliente_id ? 'cliente' : inicial?.lead_id ? 'lead' : 'nenhum',
  )
  const [ligadoId, setLigadoId] = useState(inicial?.cliente_id ?? inicial?.lead_id ?? '')
  const [dataPrevista, setDataPrevista] = useState(inicial?.data_prevista ?? '')
  const [notas, setNotas] = useState(inicial?.notas ?? '')

  const listaLigacao = ligadoA === 'lead' ? leads : ligadoA === 'cliente' ? clientes : []

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (inicial && onGuardar) {
      await onGuardar({
        tipo,
        titulo: titulo.trim(),
        notas: notas.trim() || null,
        lead_id: ligadoA === 'lead' && ligadoId ? ligadoId : ligadoA === 'cliente' ? inicial.lead_id : null,
        cliente_id: ligadoA === 'cliente' && ligadoId ? ligadoId : null,
        data_prevista: dataPrevista || null,
      })
      return
    }
    const success = await onCriar({
      tipo,
      titulo,
      notas: notas.trim() || null,
      lead_id: ligadoA === 'lead' && ligadoId ? ligadoId : null,
      cliente_id: ligadoA === 'cliente' && ligadoId ? ligadoId : null,
      responsavel_id: responsavelId,
      concluida: false,
      data_prevista: dataPrevista || null,
      data_atividade: new Date().toISOString(),
    })
    if (!success) return;
    setTitulo('')
    setDataPrevista('')
    setLigadoA('nenhum')
    setLigadoId('')
    setNotas('')
  }

  const campos = (
    <>
      <Campo label="Tipo" required>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoAtividade)}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
        >
          {TIPOS_ATIVIDADE.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.rotulo}
            </option>
          ))}
        </select>
      </Campo>

      <Campo label="Título" required>
        <input
          required
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
        />
      </Campo>

      <Campo label="Associação">
        <select
          value={ligadoA}
          onChange={(e) => {
            setLigadoA(e.target.value as 'nenhum' | 'lead' | 'cliente')
            setLigadoId('')
          }}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
        >
          <option value="nenhum">Sem associação</option>
          <option value="lead">Associar a lead</option>
          <option value="cliente">Associar a cliente</option>
        </select>
      </Campo>

      {ligadoA !== 'nenhum' && (
        <Campo label={ligadoA === 'lead' ? 'Lead' : 'Cliente'}>
          <select
            value={ligadoId}
            onChange={(e) => setLigadoId(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
          >
            <option value="">Selecionar…</option>
            {listaLigacao.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome}
              </option>
            ))}
          </select>
        </Campo>
      )}

      <Campo label="Prazo">
        <input
          type="date"
          value={dataPrevista}
          onChange={(e) => setDataPrevista(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 tabular-nums"
        />
      </Campo>

      <div className="col-span-full">
        <Campo label="Notas">
          <textarea rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} className={CLASSE_INPUT} />
        </Campo>
      </div>
    </>
  )

  if (inicial) {
    return (
      <Modal title="Editar atividade" onClose={onCancelar ?? (() => {})} busy={aCriar}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">{campos}</div>
          <RodapeFormulario aGuardar={aCriar} textoGuardar="Guardar alterações" onCancelar={onCancelar ?? (() => {})} onApagar={onApagar} />
        </form>
      </Modal>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="panel form-panel grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
      <h2 className="form-title">Registar atividade</h2>
      {campos}
      <Button type="submit" loading={aCriar} className="col-span-full md:col-span-3">
        Guardar atividade
      </Button>
    </form>
  )
}

function Campo({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block min-w-0 space-y-2">
      <span className="block text-xs font-medium text-ink">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      {children}
    </label>
  )
}
