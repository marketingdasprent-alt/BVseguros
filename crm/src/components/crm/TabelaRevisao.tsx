import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatarData } from '@/lib/format'
import { mesesDesde } from '@/lib/rgpd'

export interface LinhaRevisao {
  id: string
  nome: string
  contacto: string
  desde: string
  abrir: string
}

interface TabelaRevisaoProps {
  titulo: string
  descricao: string
  rotuloData: string
  linhas: LinhaRevisao[]
  onApagar?: (linha: LinhaRevisao) => void
  nota?: ReactNode
}

/** Uma lista da revisão de dados: o que passou o prazo, com abrir e (quando se pode) apagar. */
export function TabelaRevisao({ titulo, descricao, rotuloData, linhas, onApagar, nota }: TabelaRevisaoProps) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>{titulo} <span className="ml-1 text-xs font-normal text-muted">{linhas.length}</span></h2>
          <p>{descricao}</p>
        </div>
      </div>
      {linhas.length === 0 ? (
        <EmptyState icon={CheckCircle2} titulo="Nada a rever" descricao="Nenhum registo passou o prazo." />
      ) : (
        <div role="region" aria-label={titulo} tabIndex={0} className="overflow-x-auto scroll-thin">
          <table className="crm-table w-full text-sm">
            <thead className="text-left text-muted">
              <tr>
                <th className="font-semibold uppercase">Nome</th>
                <th className="font-semibold uppercase">Contacto</th>
                <th className="font-semibold uppercase">{rotuloData}</th>
                <th className="font-semibold uppercase"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="font-medium text-ink">{l.nome}</td>
                  <td className="whitespace-nowrap">{l.contacto}</td>
                  <td className="whitespace-nowrap tabular-nums">{formatarData(l.desde)} <span className="text-muted">(há {mesesDesde(l.desde)} meses)</span></td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <Link to={l.abrir} className="text-link">Abrir</Link>
                      {onApagar && <Button variant="ghost-danger" size="sm" onClick={() => onApagar(l)}>Apagar</Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {nota && <p className="border-t border-border px-6 py-3 text-small text-muted">{nota}</p>}
    </section>
  )
}
