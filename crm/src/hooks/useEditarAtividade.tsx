import { useState } from 'react'
import { NovaAtividadeForm } from '@/components/crm/NovaAtividadeForm'
import { apagarAtividade, atualizarAtividade } from '@/hooks/useAtividades'
import { useConfirmarApagar } from '@/hooks/useConfirmarApagar'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { mensagemErro } from '@/lib/erros'
import type { Atividade, AtividadeEdicao, Cliente, Lead } from '@/lib/types'

interface OpcoesEditarAtividade {
  leads: Lead[]
  clientes: Cliente[]
  // Recarregar a lista onde a atividade aparece (lead ou ficha do cliente).
  onAlterado: () => Promise<unknown> | void
}

/**
 * Editar e apagar uma atividade a partir de qualquer lista (lead, ficha do
 * cliente). Devolve `editar(atividade)` e o modal a montar na página, como o
 * useConfirmarApagar. "Apagar" só aparece a quem tem essa permissão.
 */
export function useEditarAtividade({ leads, clientes, onAlterado }: OpcoesEditarAtividade) {
  const { pode } = useAuth()
  const { toast } = useToast()
  const [aEditar, setAEditar] = useState<Atividade | null>(null)
  const [aGuardar, setAGuardar] = useState(false)
  const { pedirConfirmacao, modalApagar } = useConfirmarApagar(async () => { await onAlterado() })

  const handleGuardar = async (atividade: Atividade, dados: AtividadeEdicao) => {
    setAGuardar(true)
    try {
      await atualizarAtividade(atividade.id, dados)
      await onAlterado()
      setAEditar(null)
      toast({ title: 'Atividade atualizada' })
      return true
    } catch (err: unknown) {
      toast({ title: 'Não foi possível guardar atividade', description: mensagemErro(err), variant: 'destructive' })
      return false
    } finally {
      setAGuardar(false)
    }
  }

  const handlePedirApagar = (atividade: Atividade) => {
    setAEditar(null)
    pedirConfirmacao({
      acao: 'Apagar atividade',
      nome: atividade.titulo,
      mensagemSucesso: 'Atividade apagada',
      apagar: () => apagarAtividade(atividade.id),
    })
  }

  const modal = (
    <>
      {aEditar && (
        <NovaAtividadeForm
          inicial={aEditar}
          leads={leads}
          clientes={clientes}
          responsavelId={aEditar.responsavel_id}
          aCriar={aGuardar}
          // Em edição o formulário usa onGuardar; onCriar é obrigatório na prop mas nunca é chamado aqui.
          onCriar={async () => false}
          onGuardar={(dados) => handleGuardar(aEditar, dados)}
          onCancelar={() => setAEditar(null)}
          onApagar={pode('atividades', 'apagar') ? () => handlePedirApagar(aEditar) : undefined}
        />
      )}
      {modalApagar}
    </>
  )

  return { editar: pode('atividades', 'editar') ? setAEditar : undefined, modal }
}
