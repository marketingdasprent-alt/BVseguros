import { useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'

export default function DefinirSenha() {
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
    setAGuardar(false)

    if (error) {
      setErro(error.message)
      return
    }
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
          <h1 className="font-display text-lg font-bold text-navy">Definir senha</h1>
          <p className="text-sm text-muted text-center">
            Escolha a senha para aceder ao CRM da BV Seguros.
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
      </form>
    </div>
  )
}
