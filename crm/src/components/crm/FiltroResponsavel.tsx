import { FILTROS_RESPONSAVEL } from '@/lib/responsavel'
import type { FiltroResponsavel as Filtro } from '@/lib/responsavel'
import { Segmented } from '@/components/ui/Segmented'

interface FiltroResponsavelProps {
  valor: Filtro
  onChange: (valor: Filtro) => void
}

export function FiltroResponsavel({ valor, onChange }: FiltroResponsavelProps) {
  return (
    <Segmented rotulo="Filtrar por responsável" opcoes={FILTROS_RESPONSAVEL} valor={valor} onChange={onChange} />
  )
}
