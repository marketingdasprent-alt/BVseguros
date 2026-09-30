import { AlertTriangle, CheckCircle2, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import type { ErroLinha } from '@/lib/importacao'

const MAX_ERROS_VISIVEIS = 50

export function ListaErros({ erros, titulo, onDescarregar }: { erros: ErroLinha[]; titulo: string; onDescarregar: () => void }) {
  if (erros.length === 0) return null
  return (
    <Notice tone="danger" icon={AlertTriangle}
      action={<Button variant="secondary" size="sm" icon={<Download />} onClick={onDescarregar}>Relatório</Button>}>
      <p className="font-medium">{titulo}</p>
      <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto scroll-thin text-[13px]">
        {erros.slice(0, MAX_ERROS_VISIVEIS).map((e) => (
          <li key={`${e.linha}-${e.mensagem}`}><span className="font-semibold tabular-nums">Linha {e.linha}:</span> {e.mensagem}</li>
        ))}
        {erros.length > MAX_ERROS_VISIVEIS && <li>… e mais {erros.length - MAX_ERROS_VISIVEIS}. Descarregue o relatório para ver todos.</li>}
      </ul>
    </Notice>
  )
}

export function Contagens({ itens }: { itens: { rotulo: string; valor: number; tom?: 'success' | 'danger' }[] }) {
  return (
    <section className="metrics-strip" style={{ gridTemplateColumns: `repeat(${itens.length}, minmax(0, 1fr))` }}>
      {itens.map((i) => (
        <div key={i.rotulo} className="metric">
          <span className="metric-label">
            {i.rotulo}
            {i.tom === 'success' && <CheckCircle2 size={17} className="text-success" aria-hidden="true" />}
            {i.tom === 'danger' && i.valor > 0 && <AlertTriangle size={17} className="text-danger" aria-hidden="true" />}
          </span>
          <strong className="metric-value">{new Intl.NumberFormat('pt-PT').format(i.valor)}</strong>
        </div>
      ))}
    </section>
  )
}

// Linhas prontas a importar. Lidas pela IA mostram-se mais para dar para conferir antes de importar.
export function PreVisualizacao<T>({ validas, cabecalho, maximo }: { validas: { linha: number; dados: T }[]; cabecalho: string[]; maximo: number }) {
  if (validas.length === 0) return null
  const visiveis = validas.slice(0, maximo)
  return (
    <div className="table-panel">
      <div className="data-panel-heading">Pré-visualização<span>{visiveis.length === validas.length ? `${validas.length} ${validas.length === 1 ? 'linha' : 'linhas'}` : `primeiras ${visiveis.length} de ${validas.length}`}</span></div>
      <div role="region" aria-label="Pré-visualização" tabIndex={0} className="max-h-[28rem] overflow-auto scroll-thin">
        <table className="crm-table w-full text-sm">
          <thead className="text-left text-muted">
            <tr><th className="font-semibold uppercase">Linha</th>{cabecalho.map((c) => <th key={c} className="whitespace-nowrap font-semibold uppercase">{c.replace(/_/g, ' ')}</th>)}</tr>
          </thead>
          <tbody>
            {visiveis.map((v) => (
              <tr key={v.linha} className="border-t border-border">
                <td className="tabular-nums">{v.linha}</td>
                {cabecalho.map((c) => <td key={c} className="whitespace-nowrap">{String((v.dados as unknown as Record<string, unknown>)[c] ?? '—')}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
