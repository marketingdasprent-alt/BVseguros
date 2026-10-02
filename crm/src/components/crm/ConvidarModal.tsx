import { useEffect, useRef, useState, type FormEvent } from 'react'
import { KeyRound, Mail, MailCheck, UserCheck } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { Campo, CLASSE_INPUT, RodapeFormulario } from '@/components/ui/Campo'
import { CampoSenha } from '@/components/crm/CampoSenha'
import type { NovaConta } from '@/hooks/useUtilizadores'
import type { Grupo } from '@/lib/types'
import { Segmented } from '@/components/ui/Segmented'

interface ConvidarModalProps {
  aEnviar: boolean
  grupos: Grupo[]
  onFechar: () => void
  // true = criado/enviado; o modal mostra então o estado de sucesso em vez de fechar.
  onCriar: (conta: NovaConta) => Promise<boolean>
}

// Valor do select para "Administrador": não é um grupo, é acesso total.
const ADMIN = '__admin'

export function ConvidarModal({ aEnviar, grupos, onFechar, onCriar }: ConvidarModalProps) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  // Com um só grupo, fica já escolhido.
  const [grupo, setGrupo] = useState(grupos.length === 1 ? grupos[0].id : '')
  const [comSenha, setComSenha] = useState(false)
  const [senha, setSenha] = useState('')
  const [feito, setFeito] = useState<{ email: string; comSenha: boolean } | null>(null)
  const botaoFechar = useRef<HTMLButtonElement>(null)
  const campoNome = useRef<HTMLInputElement>(null)

  // O conteúdo muda dentro do mesmo diálogo: levar o foco para onde a pessoa vai agir a seguir.
  useEffect(() => {
    if (feito) botaoFechar.current?.focus()
  }, [feito])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const destino = email.trim()
    const conta: NovaConta = {
      nome: nome.trim(), email: destino, admin: grupo === ADMIN,
      grupoId: grupo && grupo !== ADMIN ? grupo : null, senha: comSenha ? senha : null,
    }
    if (await onCriar(conta)) {
      setSenha('')
      setFeito({ email: destino, comSenha })
    }
  }

  const adicionarOutra = () => {
    setNome('')
    setEmail('')
    setFeito(null)
    requestAnimationFrame(() => campoNome.current?.focus())
  }

  return (
    <Modal title="Novo utilizador" onClose={onFechar} busy={aEnviar}>
      {feito ? (
        <div className="space-y-5">
          <div className="success-state" role="status">
            {feito.comSenha ? <UserCheck size={32} strokeWidth={1.6} aria-hidden="true" /> : <MailCheck size={32} strokeWidth={1.6} aria-hidden="true" />}
            <strong className="text-panel font-semibold text-ink">{feito.comSenha ? 'Conta criada' : 'Convite enviado'}</strong>
            {feito.comSenha ? (
              <p><span className="font-medium text-ink">{feito.email}</span> já pode entrar com a senha que definiu. No primeiro acesso, o CRM pede uma senha nova.</p>
            ) : (
              <p>Enviámos o convite para <span className="font-medium text-ink">{feito.email}</span>.</p>
            )}
          </div>
          <div className="form-footer"><div className="form-footer-end">
            <Button variant="secondary" onClick={adicionarOutra}>Adicionar outra pessoa</Button>
            <Button ref={botaoFechar} onClick={onFechar}>Fechar</Button>
          </div></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Segmented rotulo="Como dar acesso" valor={comSenha ? 'senha' : 'convite'} onChange={(v) => setComSenha(v === 'senha')} opcoes={[
            { valor: 'convite', rotulo: 'Enviar convite por email' },
            { valor: 'senha', rotulo: 'Criar já com senha' },
          ]} />
          <Notice tone="info" icon={comSenha ? KeyRound : Mail}>
            {comSenha
              ? 'A conta fica logo pronta, sem email. Passe a senha à pessoa por um canal seguro; no primeiro acesso ela escolhe uma nova.'
              : 'A pessoa recebe um email para definir a senha. A conta fica já com acesso, com as permissões escolhidas.'}
          </Notice>
          <Campo label="Nome" required>
            <input ref={campoNome} required minLength={2} maxLength={120} value={nome} onChange={(e) => setNome(e.target.value)}
              placeholder="Nome e apelido" className={CLASSE_INPUT} />
          </Campo>
          <Campo label="Email" required>
            <input required type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} className={CLASSE_INPUT} />
          </Campo>
          <Campo label="Grupo" required>
            <select required value={grupo} onChange={(e) => setGrupo(e.target.value)} className={CLASSE_INPUT}>
              <option value="">Escolher grupo…</option>
              {grupos.map((g) => <option key={g.id} value={g.id}>{g.nome}</option>)}
              <option value={ADMIN}>Administrador (acesso total)</option>
            </select>
          </Campo>
          {comSenha && <CampoSenha label="Senha inicial" valor={senha} onChange={setSenha} />}
          <RodapeFormulario aGuardar={aEnviar} textoGuardar={comSenha ? 'Criar conta' : 'Enviar convite'} onCancelar={onFechar} />
        </form>
      )}
    </Modal>
  )
}
