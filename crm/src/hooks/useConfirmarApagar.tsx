import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import { mensagemErro } from '@/lib/erros'

interface PedidoApagar {
  titulo: string
  nome: string
  aviso?: string
  apagar: () => Promise<void>
}

// Confirmação obrigatória antes de apagar (AGENTS.md secção 10), igual em todas as páginas.
export function useConfirmarApagar(onApagado: () => Promise<void> | void) {
  const { toast } = useToast()
  const [pedido, setPedido] = useState<PedidoApagar | null>(null)
  const [aApagar, setAApagar] = useState(false)

  const handleConfirmar = async () => {
    if (!pedido) return
    setAApagar(true)
    try {
      await pedido.apagar()
      await onApagado()
      toast({ title: 'Registo apagado' })
      setPedido(null)
    } catch (err: unknown) {
      toast({ title: 'Erro ao apagar', description: mensagemErro(err), variant: 'destructive' })
    } finally {
      setAApagar(false)
    }
  }

  const modal = pedido && (
    <Modal title={`Apagar ${pedido.titulo.toLowerCase()}`} onClose={() => setPedido(null)} busy={aApagar}>
      <div className="space-y-5">
        <p className="text-sm text-ink">
          Vai apagar <strong className="font-medium">{pedido.nome}</strong>. Esta ação não pode ser desfeita.
        </p>
        {pedido.aviso && <p className="rounded-lg bg-danger-bg p-3 text-sm text-danger-text">{pedido.aviso}</p>}
        <div className="flex gap-2 pt-2">
          <Button variant="secondary" disabled={aApagar} onClick={() => setPedido(null)} className="flex-1">
            Cancelar
          </Button>
          <Button variant="destructive" loading={aApagar} onClick={handleConfirmar} className="flex-1">
            Apagar
          </Button>
        </div>
      </div>
    </Modal>
  )

  return { pedirConfirmacao: setPedido, modalApagar: modal }
}
