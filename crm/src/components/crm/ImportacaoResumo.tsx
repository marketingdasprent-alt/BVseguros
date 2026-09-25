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
