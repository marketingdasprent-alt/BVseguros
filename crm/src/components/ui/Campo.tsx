import type { ReactNode } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const CLASSE_INPUT =
  'w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30'

interface CampoProps {
  label: string
  required?: boolean
  className?: string
  extra?: ReactNode
  children: ReactNode
}

export function Campo({ label, required, className = '', extra, children }: CampoProps) {
  return (
    <label className={`block min-w-0 space-y-2 ${className}`}>
      <span className="flex items-baseline justify-between gap-2 text-xs font-medium text-ink">
        <span>
          {label}
          {required && <span className="ml-0.5 text-danger" aria-hidden="true">*</span>}
        </span>
        {extra}
      </span>
      {children}
    </label>
  )
}

interface ContextoFormularioProps {
  itens: { rotulo: string; valor: ReactNode }[]
}

// O registo que está a ser editado, igual no topo de todos os modais.
export function ContextoFormulario({ itens }: ContextoFormularioProps) {
  return (
    <dl className="form-context grid gap-4 sm:grid-cols-2">
      {itens.map(({ rotulo, valor }) => (
        <div key={rotulo} className="min-w-0">
          <dt>{rotulo}</dt>
          <dd>{valor}</dd>
        </div>
      ))}
    </dl>
  )
}

interface RodapeFormularioProps {
  aGuardar: boolean
  textoGuardar: string
  onCancelar: () => void
  onApagar?: () => void
  desativarGuardar?: boolean
  // Ação secundária à esquerda (ex.: "Marcar só como convertido").
  inicio?: ReactNode
}

// "Apagar" só aparece quando a página o passa (admin).
export function RodapeFormulario({ aGuardar, textoGuardar, onCancelar, onApagar, desativarGuardar, inicio }: RodapeFormularioProps) {
  return (
    <div className="form-footer">
      {(onApagar || inicio) && (
        <div className="form-footer-start">
          {onApagar && (
            <Button type="button" variant="ghost-danger" icon={<Trash2 />} disabled={aGuardar} onClick={onApagar}>
              Apagar
            </Button>
          )}
          {inicio}
        </div>
      )}
      {/* Cancelar + guardar mudam de linha juntos quando não cabem. */}
      <div className="form-footer-end">
        <Button type="button" variant="secondary" disabled={aGuardar} onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" loading={aGuardar} disabled={desativarGuardar}>
          {textoGuardar}
        </Button>
      </div>
    </div>
  )
}
