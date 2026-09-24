import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

export const CLASSE_INPUT =
  'w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30'

interface CampoProps {
  label: string
  required?: boolean
  className?: string
  children: ReactNode
}

export function Campo({ label, required, className = '', children }: CampoProps) {
  return (
    <label className={`block min-w-0 space-y-2 ${className}`}>
      <span className="block text-xs font-medium text-ink">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      {children}
    </label>
  )
}

interface RodapeFormularioProps {
  aGuardar: boolean
  textoGuardar: string
  onCancelar: () => void
  onApagar?: () => void
  desativarGuardar?: boolean
}

// Rodapé comum dos formulários em modal; "Apagar" só aparece quando a página o passa (admin).
export function RodapeFormulario({ aGuardar, textoGuardar, onCancelar, onApagar, desativarGuardar }: RodapeFormularioProps) {
  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {onApagar && (
        <Button type="button" variant="destructive" disabled={aGuardar} onClick={onApagar} className="sm:mr-auto">
          Apagar
        </Button>
      )}
      <Button type="button" variant="secondary" disabled={aGuardar} onClick={onCancelar} className="flex-1 sm:flex-none">
        Cancelar
      </Button>
      <Button type="submit" loading={aGuardar} disabled={desativarGuardar} className="flex-1 sm:flex-none">
        {textoGuardar}
      </Button>
    </div>
  )
}
