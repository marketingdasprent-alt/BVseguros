import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { FilePlus2, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Campo, CLASSE_INPUT } from '@/components/ui/Campo'
import { apoliceSugerida, sugerirClientes } from '@/lib/pedidosSinistro'
import { corresponde } from '@/lib/pesquisa'
import type { Apolice, Cliente, PedidoSinistro } from '@/lib/types'

interface ConverterPedidoFormProps {
  pedido: PedidoSinistro
  clientes: Cliente[]
  apolices: Apolice[]
  aGuardar: boolean
  onConverter: (apoliceId: string, descricao: string) => Promise<void>
}

// Ligar o pedido a um cliente e a uma apólice, e criar o sinistro (converter_pedido_sinistro).
export function ConverterPedidoForm({ pedido, clientes, apolices, aGuardar, onConverter }: ConverterPedidoFormProps) {
  const sugestoes = useMemo(() => sugerirClientes(pedido, clientes, apolices), [pedido, clientes, apolices])
  const [clienteId, setClienteId] = useState(sugestoes[0]?.cliente.id ?? '')
  const [termo, setTermo] = useState('')
  const apolicesDoCliente = useMemo(() => apolices.filter((a) => a.cliente_id === clienteId), [apolices, clienteId])
  const [apoliceId, setApoliceId] = useState(() => apoliceSugerida(pedido, apolices.filter((a) => a.cliente_id === clienteId))?.id ?? '')
  const [descricao, setDescricao] = useState(pedido.descricao)

  const encontrados = useMemo(
    () => (termo.trim() ? clientes.filter((c) => corresponde([c.nome, c.nif, c.email, c.telefone], termo)).slice(0, 8) : []),
    [clientes, termo],
  )

  const escolherCliente = (id: string) => {
    setClienteId(id)
    setApoliceId(apoliceSugerida(pedido, apolices.filter((a) => a.cliente_id === id))?.id ?? '')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (apoliceId) await onConverter(apoliceId, descricao.trim())
  }

  const cliente = clientes.find((c) => c.id === clienteId)

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border p-4">
      <p className="text-sm font-semibold text-ink">Criar sinistro a partir deste pedido</p>

      {sugestoes.length > 0 ? (
        <fieldset className="space-y-2">
          <legend className="text-xs font-medium text-ink">Clientes com dados iguais</legend>
          {sugestoes.map(({ cliente: c, motivos }) => (
            <label key={c.id} className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="radio" name="cliente" checked={clienteId === c.id} onChange={() => escolherCliente(c.id)} />
              <span className="font-medium">{c.nome}</span>
              <span className="text-xs text-muted">mesmo {motivos.join(', ')}</span>
            </label>
          ))}
        </fieldset>
      ) : (
        <p className="text-sm text-muted">
          Sem cliente com o mesmo email, telefone ou nº de apólice. Pesquise abaixo ou{' '}
          <Link to="/clientes" className="font-medium text-navy underline">crie o cliente</Link> e volte a este pedido.
        </p>
      )}

      <Campo label="Procurar outro cliente">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input className={`${CLASSE_INPUT} pl-9`} value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Nome, NIF, email ou telefone" />
        </div>
      </Campo>
      {encontrados.length > 0 && (
        <ul className="max-h-40 space-y-1 overflow-y-auto scroll-thin" aria-label="Clientes encontrados">
          {encontrados.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => { escolherCliente(c.id); setTermo('') }}
                className="w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-ink/[0.04] focus-visible:ring-2 focus-visible:ring-navy">
                {c.nome} <span className="text-xs text-muted">{c.nif ?? c.email ?? c.telefone}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {cliente && (
        <Campo label={`Apólice de ${cliente.nome}`} required>
          {apolicesDoCliente.length > 0 ? (
            <select className={CLASSE_INPUT} value={apoliceId} onChange={(e) => setApoliceId(e.target.value)} required>
              <option value="">Escolha a apólice</option>
              {apolicesDoCliente.map((a) => (
                <option key={a.id} value={a.id}>{a.numero_apolice} · {a.seguradora}</option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-muted">
              Este cliente não tem apólices. <Link to={`/clientes/${cliente.id}`} className="font-medium text-navy underline">Abrir a ficha</Link> para a registar.
            </p>
          )}
        </Campo>
      )}

      <Campo label="Descrição do sinistro" required>
        <textarea className={CLASSE_INPUT} rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} required maxLength={1500} />
      </Campo>

      <div className="flex justify-end">
        <Button type="submit" icon={<FilePlus2 />} loading={aGuardar} disabled={!apoliceId || !descricao.trim()}>
          Criar sinistro
        </Button>
      </div>
    </form>
  )
}
