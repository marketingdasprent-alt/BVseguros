import { AlertTriangle, CheckSquare, FileText, Mail, MessageSquare, Phone, Shield, StickyNote, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatarData, formatarDataRelativa, formatarMoeda } from '@/lib/format'
import { ESTADOS_APOLICE, ESTADOS_PROPOSTA, ESTADOS_SINISTRO, RAMOS, TIPOS_ATIVIDADE } from '@/lib/types'
import type { Apolice, Atividade, Proposta, Sinistro } from '@/lib/types'
import { TONE_ESTADO_APOLICE, TONE_ESTADO_PROPOSTA, TONE_ESTADO_SINISTRO } from '@/lib/tone'

const rotulo = <T extends string>(lista: { valor: T; rotulo: string }[], valor: T) => lista.find((i) => i.valor === valor)?.rotulo ?? valor

function Secao({ titulo, contagem, acao, children }: { titulo: string; contagem: number; acao?: ReactNode; children: ReactNode }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>{titulo} <span className="ml-1 text-xs font-normal text-muted">{contagem}</span></h2>
        {acao}
      </div>
      {children}
    </section>
  )
}

export function FichaApolices({ apolices, acao }: { apolices: Apolice[]; acao?: ReactNode }) {
  return (
    <Secao titulo="Apólices" contagem={apolices.length} acao={acao}>
      {apolices.length === 0 ? (
        <EmptyState icon={Shield} titulo="Sem apólices" descricao="As apólices deste cliente aparecem aqui." />
      ) : (
        <div role="region" aria-label="Apólices do cliente" tabIndex={0} className="overflow-x-auto scroll-thin">
          <table className="crm-table w-full text-sm">
            <thead className="text-left text-muted">
              <tr>
                {['Nº apólice', 'Ramo', 'Seguradora', 'Prémio anual', 'Fim', 'Estado'].map((h) => (
                  <th key={h} className={`whitespace-nowrap font-semibold uppercase ${h === 'Prémio anual' ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apolices.map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="whitespace-nowrap">{a.numero_apolice}</td>
                  <td className="whitespace-nowrap">{rotulo(RAMOS, a.ramo)}</td>
                  <td className="whitespace-nowrap">{a.seguradora}</td>
                  <td className="whitespace-nowrap text-right tabular-nums">{a.premio_anual != null ? formatarMoeda(a.premio_anual) : '—'}</td>
                  <td className="whitespace-nowrap tabular-nums">{a.data_fim ? formatarData(a.data_fim) : '—'}</td>
                  <td className="whitespace-nowrap"><Badge tone={TONE_ESTADO_APOLICE[a.estado]}>{rotulo(ESTADOS_APOLICE, a.estado)}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Secao>
  )
}

function Linha({ icone: Icone, titulo, detalhe, direita }: { icone: LucideIcon; titulo: ReactNode; detalhe: ReactNode; direita?: ReactNode }) {
  return (
    <li className="activity-row">
      <Icone size={16} className="shrink-0 text-[#72839a]" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <strong>{titulo}</strong>
        <small>{detalhe}</small>
      </div>
      {direita}
    </li>
  )
}

export function FichaPropostasSinistros({ propostas, sinistros, numeroApolice }: {
  propostas: Proposta[]
  sinistros: Sinistro[]
  numeroApolice: (id: string) => string
}) {
  return (
    <div className="dashboard-columns">
      <Secao titulo="Propostas" contagem={propostas.length}>
        {propostas.length === 0 ? <EmptyState icon={FileText} titulo="Sem propostas" /> : (
          <ul>
            {propostas.map((p) => (
              <Linha key={p.id} icone={FileText} titulo={`${rotulo(RAMOS, p.ramo)} · ${p.seguradora}`}
                detalhe={p.premio_anual_estimado != null ? `Prémio estimado ${formatarMoeda(p.premio_anual_estimado)}` : 'Sem prémio estimado'}
                direita={<Badge tone={TONE_ESTADO_PROPOSTA[p.estado]}>{rotulo(ESTADOS_PROPOSTA, p.estado)}</Badge>} />
            ))}
          </ul>
        )}
      </Secao>
      <Secao titulo="Sinistros" contagem={sinistros.length}>
        {sinistros.length === 0 ? <EmptyState icon={AlertTriangle} titulo="Sem sinistros" /> : (
          <ul>
            {sinistros.map((s) => (
              <Linha key={s.id} icone={AlertTriangle} titulo={s.descricao}
                detalhe={`Apólice ${numeroApolice(s.apolice_id)} · ${formatarData(s.data_ocorrencia)}`}
                direita={<Badge tone={TONE_ESTADO_SINISTRO[s.estado]}>{rotulo(ESTADOS_SINISTRO, s.estado)}</Badge>} />
            ))}
          </ul>
        )}
      </Secao>
    </div>
  )
}

const ICONE_ATIVIDADE: Record<Atividade['tipo'], LucideIcon> = {
  chamada: Phone, email: Mail, reuniao: Users, tarefa: CheckSquare, nota: StickyNote,
}

export function FichaAtividades({ atividades, acao }: { atividades: Atividade[]; acao?: ReactNode }) {
  return (
    <Secao titulo="Atividades" contagem={atividades.length} acao={acao}>
      {atividades.length === 0 ? (
        <EmptyState icon={MessageSquare} titulo="Sem atividades" descricao="Chamadas, emails, reuniões e tarefas com este cliente aparecem aqui." />
      ) : (
        <ul>
          {atividades.map((a) => (
            <Linha key={a.id} icone={ICONE_ATIVIDADE[a.tipo] ?? MessageSquare} titulo={a.titulo}
              detalhe={<>{rotulo(TIPOS_ATIVIDADE, a.tipo)} · {formatarDataRelativa(a.data_atividade)}{a.notas ? ` · ${a.notas}` : ''}</>}
              direita={a.tipo === 'tarefa' ? <Badge tone={a.concluida ? 'success' : 'neutral'}>{a.concluida ? 'Concluída' : 'Pendente'}</Badge> : undefined} />
          ))}
        </ul>
      )}
    </Secao>
  )
}
