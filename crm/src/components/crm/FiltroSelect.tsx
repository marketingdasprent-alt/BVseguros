interface FiltroSelectProps {
  rotulo: string
  todos: string
  valor: string
  opcoes: { valor: string; rotulo: string }[]
  onChange: (valor: string) => void
}

// Filtro de lista ao lado da pesquisa. "" = sem filtro.
export function FiltroSelect({ rotulo, todos, valor, opcoes, onChange }: FiltroSelectProps) {
  return (
    <label className="min-w-0 flex-1 sm:flex-none">
      <span className="sr-only">{rotulo}</span>
      <select value={valor} onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 sm:w-auto ${valor ? 'border-navy/40 font-medium text-navy' : 'border-border'}`}>
        <option value="">{todos}</option>
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>{o.rotulo}</option>
        ))}
      </select>
    </label>
  )
}
