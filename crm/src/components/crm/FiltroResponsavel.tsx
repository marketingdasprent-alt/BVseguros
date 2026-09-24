import { FILTROS_RESPONSAVEL } from '@/lib/responsavel'
import type { FiltroResponsavel as Filtro } from '@/lib/responsavel'

interface FiltroResponsavelProps {
  valor: Filtro
  onChange: (valor: Filtro) => void
}

export function FiltroResponsavel({ valor, onChange }: FiltroResponsavelProps) {
  return (
    <div role="group" aria-label="Filtrar por responsável" className="inline-flex rounded-lg border border-border bg-white p-0.5">
      {FILTROS_RESPONSAVEL.map((f) => (
        <button
          key={f.valor}
          type="button"
          aria-pressed={valor === f.valor}
          onClick={() => onChange(f.valor)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy ${
            valor === f.valor ? 'bg-navy text-white' : 'text-muted hover:text-ink'
          }`}
        >
          {f.rotulo}
        </button>
      ))}
    </div>
  )
}
