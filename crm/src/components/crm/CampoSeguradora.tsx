import { useState } from 'react'
import { CLASSE_INPUT } from '@/components/ui/Campo'

interface CampoSeguradoraProps {
  valor: string
  onChange: (valor: string) => void
  // Nomes das seguradoras ativas. Sem lista (ainda a carregar ou sem migração), fica um campo de texto.
  opcoes?: string[]
}

const OUTRA = '__outra__'

// Lista das seguradoras + "Outra…". Um nome novo entra na lista sozinho ao gravar
// (trigger normalizar_seguradora), e o admin arruma-a depois em "Seguradoras".
export function CampoSeguradora({ valor, onChange, opcoes }: CampoSeguradoraProps) {
  const opcaoAtual = opcoes?.find((o) => o.toLowerCase() === valor.trim().toLowerCase())
  const [outra, setOutra] = useState(!!valor && !opcaoAtual && !!opcoes?.length)

  if (!opcoes?.length) {
    return <input required value={valor} onChange={(e) => onChange(e.target.value)} className={CLASSE_INPUT} />
  }

  return (
    <div className="space-y-2">
      <select required={!outra} value={outra ? OUTRA : opcaoAtual ?? valor} className={CLASSE_INPUT}
        onChange={(e) => {
          if (e.target.value === OUTRA) { setOutra(true); onChange('') }
          else { setOutra(false); onChange(e.target.value) }
        }}>
        <option value="" disabled>Escolher…</option>
        {opcoes.map((o) => <option key={o} value={o}>{o}</option>)}
        <option value={OUTRA}>Outra…</option>
      </select>
      {outra && (
        <input required value={valor} onChange={(e) => onChange(e.target.value)} placeholder="Nome da seguradora"
          aria-label="Nome da seguradora" className={CLASSE_INPUT} />
      )}
    </div>
  )
}
