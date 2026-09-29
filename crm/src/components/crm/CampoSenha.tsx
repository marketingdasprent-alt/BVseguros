import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Campo, CLASSE_INPUT } from '@/components/ui/Campo'

interface CampoSenhaProps {
  label: string
  valor: string
  onChange: (valor: string) => void
}

// Senha escolhida pelo admin para outra pessoa: "Mostrar" ajuda a confirmar o que se vai partilhar.
export function CampoSenha({ label, valor, onChange }: CampoSenhaProps) {
  const [visivel, setVisivel] = useState(false)
  return (
    <Campo label={label} required
      extra={<span className="font-normal text-muted">Mínimo 8 caracteres</span>}>
      <span className="relative block">
        <input required minLength={8} maxLength={72} type={visivel ? 'text' : 'password'} autoComplete="new-password"
          value={valor} onChange={(e) => onChange(e.target.value)} className={`${CLASSE_INPUT} pr-10`} />
        <button type="button" onClick={() => setVisivel(!visivel)} aria-label={visivel ? 'Esconder senha' : 'Mostrar senha'}
          aria-pressed={visivel} className="icon-button absolute right-1 top-1/2 -translate-y-1/2">
          {visivel ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </span>
    </Campo>
  )
}
