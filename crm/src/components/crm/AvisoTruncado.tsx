import { Info } from 'lucide-react'
import { Notice } from '@/components/ui/Notice'

interface AvisoTruncadoProps {
  truncado: { mostrados: number; total: number } | null
}

// Só aparece se a lista passar o tecto de useSupabaseTable (lib/paginacao.ts).
export function AvisoTruncado({ truncado }: AvisoTruncadoProps) {
  if (!truncado) return null
  const f = new Intl.NumberFormat('pt-PT')
  return (
    <Notice icon={Info}>
      A mostrar os primeiros {f.format(truncado.mostrados)} de {f.format(truncado.total)} registos. Use a pesquisa para encontrar os restantes.
    </Notice>
  )
}
