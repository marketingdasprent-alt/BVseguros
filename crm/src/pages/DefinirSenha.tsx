import { useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'

interface DefinirSenhaProps {
  // Primeiro acesso com uma senha escolhida pelo admin: tem de a trocar antes de entrar.
  obrigatoria?: boolean
}

export default function DefinirSenha({ obrigatoria = false }: DefinirSenhaProps) {
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [aGuardar, setAGuardar] = useState(false)
  const [concluido, setConcluido] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErro(null)

    if (senha.length < 8) {
      setErro('A senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (senha !== confirmar) {
      setErro('As senhas não coincidem.')
      return
    }

    setAGuardar(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    if (error) {
      setAGuardar(false)
      setErro(/different from the old/i.test(error.message) ? 'A senha nova tem de ser diferente da atual.' : error.message)
      return
    }
    // Desliga o pedido de troca; se falhar, o pior é voltar a pedir a senha no próximo acesso.
    const { error: erroFlag } = await supabase.rpc('senha_trocada')
    if (erroFlag) console.error(erroFlag)
    setAGuardar(false)
    setConcluido(true)
  }

  if (concluido) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand p-6">
        <div className="w-full max-w-sm bg-white rounded-xl p-8 border border-border space-y-4 text-center">
          <h1 className="font-display text-lg font-bold text-navy">Senha definida</h1>
          <p className="text-sm text-muted">Já pode continuar para o CRM.</p>
          <Button onClick={() => window.location.assign('/')} className="w-full">
            Continuar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sand p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-xl p-8 border border-border space-y-5">
        <div className="flex flex-col items-center gap-2 mb-2">
          <img src="/brand/logo-icon.png" alt="BV Seguros" className="h-14 w-auto" />
          <h1 className="font-display text-lg font-bold text-navy">{obrigatoria ? 'Escolha uma senha nova' : 'Definir senha'}</h1>
          <p className="text-sm text-muted text-center">
            {obrigatoria
              ? 'A senha com que entrou foi definida pelo administrador. Por segurança, escolha uma só sua antes de continuar.'
              : 'Escolha a senha para aceder ao CRM da BV Seguros.'}
          </p>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-ink">Nova senha</span>
          <input
            type="password" autoComplete="new-password"
            required
            minLength={8}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-ink">Confirmar senha</span>
          <input
            type="password" autoComplete="new-password"
            required
            minLength={8}
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
        </label>

        {erro && <p role="alert" className="text-sm text-danger-text">{erro}</p>}

        <Button type="submit" loading={aGuardar} className="w-full">
          Definir senha
        </Button>
        {obrigatoria && (
          <button type="button" onClick={() => supabase.auth.signOut()} className="block w-full text-center text-sm text-muted underline hover:text-ink">
            Terminar sessão
          </button>
        )}
      </form>
    </div>
  )
}
