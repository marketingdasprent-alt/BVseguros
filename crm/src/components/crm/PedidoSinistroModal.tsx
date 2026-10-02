import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Archive, CheckCircle2, Mail, Phone, RotateCcw, UserCheck } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Campo, CLASSE_INPUT, ContextoFormulario } from '@/components/ui/Campo'
import { ConverterPedidoForm } from '@/components/crm/ConverterPedidoForm'
import { rotuloDetalhe } from '@/lib/pedidosSinistro'
import { ESTADOS_PEDIDO_SINISTRO, RAMOS } from '@/lib/types'
import type { Apolice, Cliente, EstadoPedidoSinistro, PedidoSinistro } from '@/lib/types'
import { TONE_ESTADO_PEDIDO_SINISTRO } from '@/lib/tone'
import { formatarData, SEM_VALOR } from '@/lib/format'
import { Notice } from '@/components/ui/Notice'

interface PedidoSinistroModalProps {
  pedido: PedidoSinistro
  clientes: Cliente[]
  apolices: Apolice[]
  podeEditar: boolean
  aGuardar: boolean
  onFechar: () => void
  onMudarEstado: (estado: EstadoPedidoSinistro) => Promise<void>
  onGuardarNotas: (notas: string) => Promise<void>
  onConverter: (apoliceId: string, descricao: string) => Promise<void>
}

export function PedidoSinistroModal({ pedido, clientes, apolices, podeEditar, aGuardar, onFechar, onMudarEstado, onGuardarNotas, onConverter }: PedidoSinistroModalProps) {
  const [notas, setNotas] = useState(pedido.notas ?? '')
  const detalhes = Object.entries(pedido.detalhes ?? {}).filter(([, v]) => v)
  const estado = ESTADOS_PEDIDO_SINISTRO.find((e) => e.valor === pedido.estado)?.rotulo ?? pedido.estado
  const aberto = pedido.estado === 'novo' || pedido.estado === 'em_tratamento'
  const cliente = pedido.cliente_id ? clientes.find((c) => c.id === pedido.cliente_id) : undefined

  return (
    <Modal title={`Pedido de sinistro: ${pedido.nome}`} subtitle={`Recebido a ${formatarData(pedido.criado_em)} pelo site`} onClose={onFechar} busy={aGuardar} largo>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={TONE_ESTADO_PEDIDO_SINISTRO[pedido.estado]}>{estado}</Badge>
          <a href={`tel:${pedido.telefone}`} className="inline-flex items-center gap-1 text-sm text-navy underline"><Phone size={14} aria-hidden="true" />{pedido.telefone}</a>
          <a href={`mailto:${pedido.email}`} className="inline-flex items-center gap-1 text-sm text-navy underline"><Mail size={14} aria-hidden="true" />{pedido.email}</a>
        </div>

        <ContextoFormulario itens={[
          { rotulo: 'Ramo', valor: RAMOS.find((r) => r.valor === pedido.ramo)?.rotulo ?? pedido.ramo },
          { rotulo: 'Data da ocorrência', valor: formatarData(pedido.data_ocorrencia) },
          { rotulo: 'Local', valor: pedido.local ?? SEM_VALOR },
          { rotulo: 'Apólice / seguradora indicadas', valor: [pedido.numero_apolice, pedido.seguradora].filter(Boolean).join(' · ') || SEM_VALOR },
        ]} />

        <div>
          <p className="text-xs font-medium text-ink">O que aconteceu</p>
          <p className="mt-1 whitespace-pre-line text-sm">{pedido.descricao}</p>
        </div>

        {detalhes.length > 0 && (
          <dl className="grid gap-3 sm:grid-cols-2">
            {detalhes.map(([chave, valor]) => (
              <div key={chave} className="min-w-0">
                <dt className="text-xs text-muted">{rotuloDetalhe(chave)}</dt>
                <dd className="text-sm font-medium">{valor}</dd>
              </div>
            ))}
          </dl>
        )}

        {pedido.estado === 'convertido' && (
          <Notice tone="success" icon={CheckCircle2}>
            Convertido em sinistro{cliente && <> de <Link to={`/clientes/${cliente.id}`} className="font-medium underline">{cliente.nome}</Link></>}.
            {' '}Acompanhe-o no quadro de Sinistros.
          </Notice>
        )}

        {podeEditar && (
          <>
            <Campo label="Notas internas" extra={<span className="text-muted">não são vistas pelo cliente</span>}>
              <textarea className={CLASSE_INPUT} rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} maxLength={2000} />
            </Campo>
            {notas !== (pedido.notas ?? '') && (
              <div className="flex justify-end">
                <Button size="sm" variant="secondary" loading={aGuardar} onClick={() => onGuardarNotas(notas.trim())}>Guardar notas</Button>
              </div>
            )}

            {aberto && <ConverterPedidoForm pedido={pedido} clientes={clientes} apolices={apolices} aGuardar={aGuardar} onConverter={onConverter} />}

            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
              {pedido.estado === 'novo' && (
                <Button variant="secondary" icon={<UserCheck />} disabled={aGuardar} onClick={() => onMudarEstado('em_tratamento')}>Marcar em tratamento</Button>
              )}
              {aberto && (
                <Button variant="ghost" icon={<Archive />} disabled={aGuardar} onClick={() => onMudarEstado('arquivado')}>Arquivar</Button>
              )}
              {pedido.estado === 'arquivado' && (
                <Button variant="secondary" icon={<RotateCcw />} disabled={aGuardar} onClick={() => onMudarEstado('novo')}>Reabrir</Button>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
