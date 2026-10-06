import { CheckCircle2, FileText, Users } from 'lucide-react'
import type { TipoImportacao } from '@/lib/importacao'

const OPCOES: { valor: TipoImportacao; titulo: string; descricao: string; Icone: typeof Users }[] = [
  { valor: 'clientes', titulo: 'Clientes', descricao: 'Nome, contactos, NIF e morada. Comece por aqui.', Icone: Users },
  { valor: 'apolices', titulo: 'Apólices', descricao: 'Ligam-se ao cliente pelo NIF: importe depois dos clientes.', Icone: FileText },
]

interface ImportarTipoProps {
  valor: TipoImportacao | null
  onChange: (tipo: TipoImportacao) => void
  disabled?: boolean
}

/** Passo 1: escolha grande e explícita do que se vai importar (rádios nativos, para o teclado funcionar sem mais). */
export function ImportarTipo({ valor, onChange, disabled }: ImportarTipoProps) {
  return (
    <fieldset disabled={disabled}>
      <legend className="import-step-title"><span className="import-step-number">1</span>O que quer importar?</legend>
      <div className="choice-cards">
        {OPCOES.map(({ valor: v, titulo, descricao, Icone }) => (
          <label key={v} className="choice-card">
            <input type="radio" name="tipo-importacao" value={v} checked={valor === v} onChange={() => onChange(v)} className="sr-only" />
            <span className="choice-card-icon"><Icone size={22} aria-hidden="true" /></span>
            <span className="choice-card-text">
              <strong>{titulo}</strong>
              <small>{descricao}</small>
            </span>
            <CheckCircle2 size={20} className="choice-card-check" aria-hidden="true" />
          </label>
        ))}
      </div>
    </fieldset>
  )
}
