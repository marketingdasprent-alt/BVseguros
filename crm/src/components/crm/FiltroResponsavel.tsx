import { FILTROS_RESPONSAVEL } from '@/lib/responsavel'
import type { FiltroResponsavel as Filtro } from '@/lib/responsavel'

interface FiltroResponsavelProps {
  valor: Filtro
  onChange: (valor: Filtro) => void
}

export function FiltroResponsavel({ valor, onChange }: FiltroResponsavelProps) {
  return (
    <div role="group" aria-label="Filtrar por responsável" className="segmented">
      {FILTROS_RESPONSAVEL.map((f) => (
        <button key={f.valor} type="button" aria-pressed={valor === f.valor} onClick={() => onChange(f.valor)}>
          {f.rotulo}
        </button>
      ))}
    </div>
  )
}
