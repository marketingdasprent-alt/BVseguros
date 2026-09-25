import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { useToast } from '@/hooks/useToast'
import { mensagemErro } from '@/lib/erros'

interface PedidoApagar {
  // Ex.: "Apagar cliente", "Excluir conta": é o título do modal e o texto do botão.
  acao: string
  nome: string
  aviso?: string
  mensagemSucesso?: string
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
      toast({ title: pedido.mensagemSucesso ?? 'Registo apagado' })
      setPedido(null)
    } catch (err: unknown) {
      toast({ title: 'Não foi possível concluir', description: mensagemErro(err), variant: 'destructive' })
    } finally {
      setAApagar(false)
    }
  }

  const modal = pedido && (
    <Modal title={pedido.acao} onClose={() => setPedido(null)} busy={aApagar}>
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-ink">
          Vai {pedido.acao.toLowerCase().startsWith('excluir') ? 'excluir' : 'apagar'}{' '}
          <strong className="font-semibold">{pedido.nome}</strong>. Esta ação não pode ser desfeita.
        </p>
        {pedido.aviso && <Notice tone="danger" icon={AlertTriangle}>{pedido.aviso}</Notice>}
        <div className="form-footer"><div className="form-footer-end">
          {/* Foco no Cancelar: um Enter por engano não apaga nada. */}
          <Button variant="secondary" disabled={aApagar} onClick={() => setPedido(null)} data-autofocus>
            Cancelar
          </Button>
          <Button variant="danger" loading={aApagar} onClick={handleConfirmar}>
            {pedido.acao}
          </Button>
        </div></div>
      </div>
    </Modal>
  )

  return { pedirConfirmacao: setPedido, modalApagar: modal }
}
