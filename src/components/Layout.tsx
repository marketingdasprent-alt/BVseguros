import { NavLink, Outlet } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

const LINKS = [
  { to: '/', rotulo: 'Dashboard', fim: true },
  { to: '/leads', rotulo: 'Leads' },
  { to: '/clientes', rotulo: 'Clientes' },
  { to: '/apolices', rotulo: 'Apólices' },
]

export default function Layout() {
  const { profile } = useAuth()

  return (
    <div className="min-h-screen flex bg-sand">
      <aside className="w-60 shrink-0 bg-navy text-white flex flex-col">
        <div className="flex items-center gap-2 px-5 py-6">
          <img src="/brand/logo-bv-seguros.png" alt="BV Seguros" className="h-8 w-8" />
          <span className="font-display font-bold">BV Seguros</span>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.fim}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive ? 'bg-white/15 font-medium' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {link.rotulo}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-white/10 text-sm">
          <p className="font-medium truncate">{profile?.nome ?? profile?.email}</p>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-white/60 hover:text-white text-xs mt-1"
          >
            Terminar sessão
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-8">
        <Outlet />
      </main>
    </div>
  )
}
