import { Search, X } from 'lucide-react'
import type { ReactNode } from 'react'

interface BarraPesquisaProps {
  valor: string
  onChange: (valor: string) => void
  placeholder: string
  rotulo: string
  // Filtros extra à direita (selects, filtro de responsável, ...).
  filtros?: ReactNode
}

export function BarraPesquisa({ valor, onChange, placeholder, rotulo, filtros }: BarraPesquisaProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-[240px] flex-1 sm:max-w-md">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          type="search"
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          aria-label={rotulo}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border py-2 pl-9 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 [&::-webkit-search-cancel-button]:hidden"
        />
        {valor && (
          <button type="button" className="icon-button absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2" aria-label="Limpar pesquisa" onClick={() => onChange('')}>
            <X size={15} />
          </button>
        )}
      </div>
      {filtros && <div className="flex w-full flex-wrap items-center gap-3 sm:ml-auto sm:w-auto">{filtros}</div>}
    </div>
  )
}
