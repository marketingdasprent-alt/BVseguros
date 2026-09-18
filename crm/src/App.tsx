import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { ToastProvider } from '@/hooks/useToast'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Leads from '@/pages/Leads'
import Clientes from '@/pages/Clientes'
import Apolices from '@/pages/Apolices'

function AreaPrivada() {
  const { session, loading, profile, profileError, refreshProfile } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand text-navy/50 text-sm">
        A carregar…
      </div>
    )
  }
  if (!session) return <Login />
  if (!profile?.ativo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand p-6">
        <div className="max-w-md bg-white rounded-xl p-8 space-y-4 text-navy">
          <h1 className="font-display text-xl font-bold">Acesso ao CRM</h1>
          <p className="text-sm">
            {profileError || 'A sua conta ainda não tem acesso ativo. Contacte o administrador.'}
          </p>
          <button onClick={() => refreshProfile()} className="rounded-lg bg-navy text-white px-4 py-2 text-sm">
            Tentar novamente
          </button>
          <button onClick={() => supabase.auth.signOut()} className="block text-sm underline">
            Terminar sessão
          </button>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/apolices" element={<Apolices />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AreaPrivada />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
