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
import { formatarData, formatarDataRelativa, SEM_VALOR } from '@/lib/format'
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
  const comConversao = podeEditar && aberto
  const temAcoes = podeEditar && (aberto || pedido.estado === 'arquivado')

  return (
    <Modal title={`Pedido de sinistro: ${pedido.nome}`} subtitle={`Recebido pelo site · ${formatarDataRelativa(pedido.criado_em)}`}
      onClose={onFechar} busy={aGuardar} ecraInteiro>
      <div className="editor-ecra">
        <div className={`editor-ecra__grelha${comConversao ? '' : ' editor-ecra__grelha--simples'}`}>
          <section className="editor-ecra__painel" aria-labelledby="pedido-sinistro-titulo">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 id="pedido-sinistro-titulo" className="editor-ecra__titulo">O que o cliente participou</h3>
              <Badge tone={TONE_ESTADO_PEDIDO_SINISTRO[pedido.estado]}>{estado}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <a href={`tel:${pedido.telefone}`} className="inline-flex items-center gap-1.5 text-sm text-navy underline tabular-nums"><Phone size={14} aria-hidden="true" />{pedido.telefone}</a>
              <a href={`mailto:${pedido.email}`} className="inline-flex min-w-0 items-center gap-1.5 text-sm text-navy underline [overflow-wrap:anywhere]"><Mail size={14} aria-hidden="true" />{pedido.email}</a>
            </div>

            <ContextoFormulario itens={[
              { rotulo: 'Ramo', valor: RAMOS.find((r) => r.valor === pedido.ramo)?.rotulo ?? pedido.ramo },
              { rotulo: 'Data da ocorrência', valor: formatarData(pedido.data_ocorrencia) },
              { rotulo: 'Local', valor: pedido.local ?? SEM_VALOR },
              { rotulo: 'Apólice / seguradora indicadas', valor: [pedido.numero_apolice, pedido.seguradora].filter(Boolean).join(' · ') || SEM_VALOR },
            ]} />

            <div>
              <h4 className="mensagem-site__titulo">O que aconteceu</h4>
              <p className="whitespace-pre-line text-sm leading-relaxed [overflow-wrap:anywhere]">{pedido.descricao}</p>
            </div>

            {detalhes.length > 0 && (
              <div>
                <h4 className="mensagem-site__titulo">Respostas do formulário</h4>
                <dl className="mensagem-site__lista">
                  {detalhes.map(([chave, valor]) => (
                    <div key={chave} className="contents">
                      <dt>{rotuloDetalhe(chave)}</dt>
                      <dd>{valor}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {pedido.estado === 'convertido' && (
              <Notice tone="success" icon={CheckCircle2}>
                Convertido em sinistro{cliente && <> de <Link to={`/clientes/${cliente.id}`} className="font-medium underline">{cliente.nome}</Link></>}.
                {' '}Acompanhe-o no quadro de Sinistros.
              </Notice>
            )}

            {podeEditar && (
              <div className="space-y-2">
                <Campo label="Notas internas" extra={<span className="text-muted">não são vistas pelo cliente</span>}>
                  <textarea className={CLASSE_INPUT} rows={4} value={notas} onChange={(e) => setNotas(e.target.value)} maxLength={2000} />
                </Campo>
                {notas !== (pedido.notas ?? '') && (
                  <div className="flex justify-end">
                    <Button size="sm" variant="secondary" loading={aGuardar} onClick={() => onGuardarNotas(notas.trim())}>Guardar notas</Button>
                  </div>
                )}
              </div>
            )}
          </section>

          {comConversao && (
            <aside className="editor-ecra__lateral">
              <ConverterPedidoForm pedido={pedido} clientes={clientes} apolices={apolices} aGuardar={aGuardar} onConverter={onConverter} />
            </aside>
          )}
        </div>

        {temAcoes && (
          <div className="editor-ecra__rodape">
            <div className="form-footer">
              <div className="form-footer-end">
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
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
