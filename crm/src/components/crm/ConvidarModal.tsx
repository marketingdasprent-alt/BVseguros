import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Mail, MailCheck } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { Campo, CLASSE_INPUT, RodapeFormulario } from '@/components/ui/Campo'

interface ConvidarModalProps {
  aEnviar: boolean
  onFechar: () => void
  // true = enviado; o modal mostra então o estado de sucesso em vez de fechar.
  onConvidar: (nome: string, email: string) => Promise<boolean>
}

export function ConvidarModal({ aEnviar, onFechar, onConvidar }: ConvidarModalProps) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [enviadoPara, setEnviadoPara] = useState<string | null>(null)
  const botaoFechar = useRef<HTMLButtonElement>(null)
  const campoNome = useRef<HTMLInputElement>(null)

  // O conteúdo muda dentro do mesmo diálogo: levar o foco para onde a pessoa vai agir a seguir.
  useEffect(() => {
    if (enviadoPara) botaoFechar.current?.focus()
  }, [enviadoPara])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const destino = email.trim()
    if (await onConvidar(nome.trim(), destino)) setEnviadoPara(destino)
  }

  const convidarOutra = () => {
    setNome('')
    setEmail('')
    setEnviadoPara(null)
    requestAnimationFrame(() => campoNome.current?.focus())
  }

  return (
    <Modal title="Convidar utilizador" onClose={onFechar} busy={aEnviar}>
      {enviadoPara ? (
        <div className="space-y-5">
          <div className="success-state" role="status">
            <MailCheck size={32} strokeWidth={1.6} aria-hidden="true" />
            <strong className="text-[15px] font-semibold text-ink">Convite enviado</strong>
            <p>Enviámos o convite para <span className="font-medium text-ink">{enviadoPara}</span>.</p>
          </div>
          <div className="form-footer"><div className="form-footer-end">
            <Button variant="secondary" onClick={convidarOutra}>Convidar outra pessoa</Button>
            <Button ref={botaoFechar} onClick={onFechar}>Fechar</Button>
          </div></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Notice tone="info" icon={Mail}>
            A pessoa recebe um email para definir a senha. A conta fica já com acesso, como mediador.
          </Notice>
          <Campo label="Nome" required>
            <input ref={campoNome} required minLength={2} maxLength={120} value={nome} onChange={(e) => setNome(e.target.value)}
              placeholder="Nome e apelido" className={CLASSE_INPUT} />
          </Campo>
          <Campo label="Email" required>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={CLASSE_INPUT} />
          </Campo>
          <RodapeFormulario aGuardar={aEnviar} textoGuardar="Enviar convite" onCancelar={onFechar} />
        </form>
      )}
    </Modal>
  )
}