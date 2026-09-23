import { useState, type FormEvent, type ReactNode } from 'react'
import { TIPOS_ATIVIDADE } from '@/lib/types'
import type { AtividadeInsert, Cliente, Lead, TipoAtividade } from '@/lib/types'
import { Button } from '@/components/ui/Button'

interface NovaAtividadeFormProps {
  leads: Lead[]
  clientes: Cliente[]
  responsavelId: string | null
  aCriar: boolean
  onCriar: (atividade: AtividadeInsert) => Promise<boolean>
}

export function NovaAtividadeForm({ leads, clientes, responsavelId, aCriar, onCriar }: NovaAtividadeFormProps) {
  const [tipo, setTipo] = useState<TipoAtividade>('chamada')
  const [titulo, setTitulo] = useState('')
  const [ligadoA, setLigadoA] = useState<'nenhum' | 'lead' | 'cliente'>('nenhum')
  const [ligadoId, setLigadoId] = useState('')
  const [dataPrevista, setDataPrevista] = useState('')

  const listaLigacao = ligadoA === 'lead' ? leads : ligadoA === 'cliente' ? clientes : []

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const success = await onCriar({
      tipo,
      titulo,
      notas: null,
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
  }

  return (
    <form onSubmit={handleSubmit} className="panel form-panel grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
      <h2 className="form-title">Registar atividade</h2>
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
