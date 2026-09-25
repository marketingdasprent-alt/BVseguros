import { SearchX } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'

interface SemResultadosProps {
  termo: string
  onLimpar: () => void
}

export function SemResultados({ termo, onLimpar }: SemResultadosProps) {
  return (
    <div className="panel">
      <EmptyState
        icon={SearchX}
        titulo={termo ? `Nenhum resultado para «${termo}»` : 'Nenhum resultado com estes filtros'}
        action={<Button variant="secondary" onClick={onLimpar}>Limpar pesquisa e filtros</Button>}
      />
    </div>
  )
}
