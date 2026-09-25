import { useId, useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Campo, CLASSE_INPUT, RodapeFormulario } from '@/components/ui/Campo'
import { Pessoa } from '@/components/ui/Pessoa'
import type { MembroEquipa } from '@/lib/types'

interface AtribuirResponsavelModalProps {
  nomeRegisto: string
  responsavelAtual: string | null
  membros: MembroEquipa[]
  aGuardar: boolean
  onFechar: () => void
  onConfirmar: (responsavelId: string | null) => Promise<void>
}

// Acima disto a lista de pessoas fica longa demais; volta a um select.
const MAX_OPCOES_VISIVEIS = 8

export function AtribuirResponsavelModal({ nomeRegisto, responsavelAtual, membros, aGuardar, onFechar, onConfirmar }: AtribuirResponsavelModalProps) {
  // Um responsável que perdeu o acesso não está na lista; começa em "Sem responsável".
  const [escolhido, setEscolhido] = useState(
    responsavelAtual && membros.some((m) => m.id === responsavelAtual) ? responsavelAtual : '',
  )
  const grupo = useId()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await onConfirmar(escolhido || null)
  }

  const opcoes = [{ id: '', nome: null as string | null }, ...membros.map((m) => ({ id: m.id, nome: m.nome as string | null }))]

  return (
    <Modal title="Atribuir responsável" subtitle={nomeRegisto} onClose={onFechar} busy={aGuardar}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {membros.length > MAX_OPCOES_VISIVEIS ? (
          <Campo label="Responsável">
            <select value={escolhido} onChange={(e) => setEscolhido(e.target.value)} className={CLASSE_INPUT}>
              {opcoes.map((o) => (
                <option key={o.id} value={o.id}>{o.nome ?? 'Sem responsável'}</option>
              ))}
            </select>
          </Campo>
        ) : (
          <fieldset>
            <legend className="mb-2 text-xs font-medium text-ink">Responsável</legend>
            <div className="choice-list">
              {opcoes.map((o) => (
                <label key={o.id} className="choice">
                  <input type="radio" name={grupo} value={o.id} checked={escolhido === o.id} onChange={() => setEscolhido(o.id)} />
                  {o.nome ? <Pessoa nome={o.nome} /> : <span className="text-muted">Sem responsável</span>}
                  {escolhido === o.id && <Check size={16} className="text-navy" aria-hidden="true" />}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <RodapeFormulario aGuardar={aGuardar} textoGuardar="Guardar" onCancelar={onFechar}
          desativarGuardar={escolhido === (responsavelAtual ?? '')} />
      </form>
    </Modal>
  )
}
