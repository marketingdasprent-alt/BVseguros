import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'

interface ErroCarregarProps {
  /** O que falhou, já com artigo: "as apólices", "o cliente". */
  oQue: string
  erro?: unknown
  onTentarNovamente: () => void
}

// A mensagem técnica (Supabase, rede) vai para a consola; o utilizador vê sempre texto em PT e uma saída.
export function ErroCarregar({ oQue, erro, onTentarNovamente }: ErroCarregarProps) {
  useEffect(() => {
    if (erro) console.error(`Falha ao carregar ${oQue}:`, erro)
  }, [erro, oQue])

  return (
    <Notice tone="danger" icon={AlertTriangle} alerta
      action={<Button variant="secondary" size="sm" onClick={onTentarNovamente}>Tentar novamente</Button>}>
      Não foi possível carregar {oQue}. Verifique a ligação e tente novamente.
    </Notice>
  )
}
