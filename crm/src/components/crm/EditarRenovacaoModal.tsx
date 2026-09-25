import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { CheckCircle2 } from 'lucide-react'
import { Campo, CLASSE_INPUT, ContextoFormulario, RodapeFormulario } from '@/components/ui/Campo'
import { Notice } from '@/components/ui/Notice'
import { ESTADOS_RENOVACAO } from '@/lib/types'
import type { EstadoRenovacao } from '@/lib/types'
import type { RenovacaoItem } from '@/hooks/useRenovacoes'

type EstadoEditavel = Exclude<EstadoRenovacao, 'renovada'>

interface EditarRenovacaoModalProps {
  item: RenovacaoItem
  nomeCliente: string
  aGuardar: boolean
  onFechar: () => void
  onGuardar: (dados: { estado?: EstadoEditavel; notas: string | null }) => Promise<void>
}

// "Renovada" não aparece aqui: tem o seu próprio formulário, que atualiza também a apólice.
const ESTADOS_EDITAVEIS = ESTADOS_RENOVACAO.filter((e): e is { valor: EstadoEditavel; rotulo: string } => e.valor !== 'renovada')

export function EditarRenovacaoModal({ item, nomeCliente, aGuardar, onFechar, onGuardar }: EditarRenovacaoModalProps) {
  const atual = item.renovacao?.estado ?? 'pendente'
  const isRenovada = atual === 'renovada'
  const [estado, setEstado] = useState<EstadoEditavel>(isRenovada ? 'pendente' : atual)
  const [notas, setNotas] = useState(item.renovacao?.notas ?? '')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await onGuardar({ ...(isRenovada ? {} : { estado }), notas: notas.trim() || null })
  }

  return (
    <Modal title="Editar renovação" onClose={onFechar} busy={aGuardar}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <ContextoFormulario itens={[{ rotulo: 'Apólice', valor: item.apolice.numero_apolice }, { rotulo: 'Cliente', valor: nomeCliente }]} />
        {isRenovada ? (
          <Notice icon={CheckCircle2}>Esta renovação já foi concluída; só as notas podem mudar.</Notice>
        ) : (
          <Campo label="Estado" required>
            <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoEditavel)} className={CLASSE_INPUT}>
              {ESTADOS_EDITAVEIS.map((e) => (
                <option key={e.valor} value={e.valor}>
                  {e.rotulo}
                </option>
              ))}
            </select>
          </Campo>
        )}
        <Campo label="Notas">
          <textarea rows={4} value={notas} onChange={(e) => setNotas(e.target.value)}
            placeholder="Ex.: cliente pediu nova simulação com outra seguradora" className={CLASSE_INPUT} />
        </Campo>
        <RodapeFormulario aGuardar={aGuardar} textoGuardar="Guardar alterações" onCancelar={onFechar} />
      </form>
    </Modal>
  )
}
