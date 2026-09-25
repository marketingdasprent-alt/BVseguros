import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { authFlowType, supabase } from '@/lib/supabase'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { ToastProvider } from '@/hooks/useToast'
import { Button } from '@/components/ui/Button'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Spinner } from '@/components/ui/Spinner'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import DefinirSenha from '@/pages/DefinirSenha'

const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Leads = lazy(() => import('@/pages/Leads'))
const Propostas = lazy(() => import('@/pages/Propostas'))
const Clientes = lazy(() => import('@/pages/Clientes'))
const ClienteFicha = lazy(() => import('@/pages/ClienteFicha'))
const Apolices = lazy(() => import('@/pages/Apolices'))
const Renovacoes = lazy(() => import('@/pages/Renovacoes'))
const Sinistros = lazy(() => import('@/pages/Sinistros'))
const Atividades = lazy(() => import('@/pages/Atividades'))
const Utilizadores = lazy(() => import('@/pages/Utilizadores'))
const Importar = lazy(() => import('@/pages/Importar'))
const Seguradoras = lazy(() => import('@/pages/Seguradoras'))

function AreaPrivada() {
  const { session, loading, profile, profileLoading, profileError, refreshProfile } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand">
        <Loader2 className="animate-spin text-navy/40" size={28} />
      </div>
    )
  }
  if (!session) return <Login />
  if (authFlowType === 'invite' || authFlowType === 'recovery') return <DefinirSenha />
  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand">
        <Loader2 className="animate-spin text-navy/40" size={28} />
      </div>
    )
  }
  if (!profile?.ativo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand p-6">
        <div className="panel form-panel max-w-md space-y-4 text-navy">
          <h1 className="font-display text-xl font-bold">Acesso ao CRM</h1>
          <p className="text-sm text-ink">
            {profileError || 'A sua conta ainda não tem acesso ativo. Contacte o administrador.'}
          </p>
          <Button onClick={() => refreshProfile()}>Tentar novamente</Button>
          <button onClick={() => supabase.auth.signOut()} className="block text-sm text-muted hover:text-ink underline">
            Terminar sessão
          </button>
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={<div className="p-10"><Spinner /></div>}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/propostas" element={<Propostas />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/:id" element={<ClienteFicha />} />
          <Route path="/apolices" element={<Apolices />} />
          <Route path="/renovacoes" element={<Renovacoes />} />
          <Route path="/sinistros" element={<Sinistros />} />
          <Route path="/atividades" element={<Atividades />} />
          <Route path="/utilizadores" element={<Utilizadores />} />
          <Route path="/importar" element={<Importar />} />
          <Route path="/seguradoras" element={<Seguradoras />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <AreaPrivada />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
