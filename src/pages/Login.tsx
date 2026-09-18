import { useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [aSubmeter, setASubmeter] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErro(null)
    setASubmeter(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    setASubmeter(false)
    if (error) setErro(error.message)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sand p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-xl p-8 shadow-sm space-y-5">
        <div className="flex flex-col items-center gap-2 mb-2">
          <img src="/brand/logo-bv-seguros.png" alt="BV Seguros" className="h-14 w-14" />
          <h1 className="font-display text-lg font-bold text-navy">BV Seguros · CRM</h1>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-ink/70">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-ink/70">Palavra-passe</label>
          <input
            type="password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
        </div>

        {erro && <p className="text-sm text-red-600">{erro}</p>}

        <button
          type="submit"
          disabled={aSubmeter}
          className="w-full rounded-lg bg-navy text-white py-2 text-sm font-medium disabled:opacity-50"
        >
          {aSubmeter ? 'A entrar…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
