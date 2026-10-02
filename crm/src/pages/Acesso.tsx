import { useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Loader2 } from 'lucide-react'
import { clienteIsolado, supabase } from '@/lib/supabase'
import { definirSenhaIsolada, entrarComSessao, lerLinkAcesso, pedeSenha, verificarLink } from '@/lib/acesso'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import DefinirSenha from '@/pages/DefinirSenha'

type Etapa = 'aviso' | 'formulario' | 'link-invalido' | 'email-confirmado'

const TEXTOS = {
  invite: { titulo: 'Definir senha', descricao: 'Escolha a senha para aceder ao CRM da BV Seguros.' },
  recovery: { titulo: 'Definir uma senha nova', descricao: 'Escolha a senha nova para aceder ao CRM da BV Seguros.' },
}

function Painel({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-sand p-6">
      <div className="w-full max-w-sm bg-white rounded-xl p-8 border border-border space-y-4 text-center">
        <img src="/brand/logo-icon.png" alt="BV Seguros" className="mx-auto h-14 w-auto" />
        <h1 className="font-display text-lg font-bold text-navy">{titulo}</h1>
        {children}
      </div>
    </div>
  )
}

const irParaCrm = () => window.location.assign('/')

/**
 * Destino dos links dos emails (convite, recuperar senha, alterar email). Abrir a
 * página não gasta o token nem inicia sessão: isso só acontece ao enviar, num cliente
 * em memória, e a sessão só passa para o CRM depois de a senha estar definida.
 */
export default function Acesso() {
  const { session, profile, loading } = useAuth()
  const [link] = useState(() => lerLinkAcesso(window.location.search))
  const [isolado] = useState(clienteIsolado)
  const [etapa, setEtapa] = useState<Etapa | null>(null)
  const [aConfirmar, setAConfirmar] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  // Depois de verificado, o token já foi gasto: novas tentativas de senha usam esta sessão em memória.
  const sessaoNova = useRef<Session | null>(null)

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-sand"><Loader2 className="animate-spin text-navy/40" size={28} /></div>
  }

  if (!link || etapa === 'link-invalido') {
    return (
      <Painel titulo="Este link já foi usado ou expirou">
        <p className="text-sm text-muted">Se era um convite, peça a um administrador que o reenvie. Se queria mudar a senha, use "Esqueci a senha" no ecrã de entrada.</p>
        <Button onClick={irParaCrm} className="w-full">Ir para o CRM</Button>
      </Painel>
    )
  }

  const etapaAtual = etapa ?? (session ? 'aviso' : 'formulario')

  if (etapaAtual === 'aviso') {
    const quem = profile?.nome ? `${profile.nome} (${session?.user.email})` : session?.user.email
    return (
      <Painel titulo="Já tem sessão iniciada">
        <p className="text-sm text-muted">
          Neste browser está com sessão iniciada como <strong className="text-ink">{quem}</strong>. Se este link for de
          outra conta, essa sessão termina quando concluir. Até lá, nada muda.
        </p>
        <Button onClick={() => setEtapa('formulario')} className="w-full">Continuar com este link</Button>
        <button type="button" onClick={irParaCrm} className="block w-full text-center text-sm text-muted underline hover:text-ink">
          Cancelar e voltar ao CRM
        </button>
      </Painel>
    )
  }

  if (etapaAtual === 'email-confirmado') {
    return (
      <Painel titulo="Email confirmado">
        <p className="text-sm text-muted">Se lhe for pedido, confirme também o link enviado para o outro endereço. Depois, entre com o email novo.</p>
        <Button onClick={irParaCrm} className="w-full">Ir para o CRM</Button>
      </Painel>
    )
  }

  if (!pedeSenha(link.tipo)) {
    const confirmar = async () => {
      setEtapa('formulario')
      setAConfirmar(true)
      setErro(null)
      const r = await verificarLink(isolado, link)
      setAConfirmar(false)
      if (r.ok) setEtapa('email-confirmado')
      else if (r.linkInvalido) setEtapa('link-invalido')
      else setErro(r.erro)
    }
    return (
      <Painel titulo="Confirmar email">
        <p className="text-sm text-muted">Confirme o endereço de email da sua conta no CRM da BV Seguros.</p>
        {erro && <p role="alert" className="text-sm text-danger-text">{erro}</p>}
        <Button onClick={confirmar} loading={aConfirmar} className="w-full">Confirmar email</Button>
      </Painel>
    )
  }

  const aoGuardar = async (senha: string): Promise<string | null> => {
    // Fixa a etapa: a sessão do CRM vai mudar a seguir e não pode voltar a mostrar o aviso.
    setEtapa('formulario')
    if (!sessaoNova.current) {
      const r = await verificarLink(isolado, link)
      if (!r.ok) {
        if (r.linkInvalido) setEtapa('link-invalido')
        return r.erro
      }
      if (!r.sessao) return 'Não foi possível validar o link. Peça um novo.'
      sessaoNova.current = r.sessao
    }
    const senhaOk = await definirSenhaIsolada(isolado, senha)
    if (!senhaOk.ok) return senhaOk.erro
    const entrou = await entrarComSessao(supabase, sessaoNova.current)
    return entrou.ok ? null : entrou.erro
  }

  const textos = link.tipo === 'invite' ? TEXTOS.invite : TEXTOS.recovery
  return <DefinirSenha aoGuardar={aoGuardar} titulo={textos.titulo} descricao={textos.descricao} />
}
