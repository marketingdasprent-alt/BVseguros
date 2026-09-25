import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Contact, Shield, RefreshCw, AlertTriangle, CheckSquare, UserCog, FileUp, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const groups = [
  { title: 'Visão geral', links: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard }] },
  { title: 'Comercial', links: [
    { to: '/leads', label: 'Leads', icon: Users }, { to: '/propostas', label: 'Propostas', icon: FileText }, { to: '/clientes', label: 'Clientes', icon: Contact },
  ] },
  { title: 'Carteira', links: [
    { to: '/apolices', label: 'Apólices', icon: Shield }, { to: '/renovacoes', label: 'Renovações', icon: RefreshCw }, { to: '/sinistros', label: 'Sinistros', icon: AlertTriangle },
  ] },
  { title: 'Organização', links: [{ to: '/atividades', label: 'Atividades', icon: CheckSquare }] },
];

const adminGroup = { title: 'Administração', links: [
  { to: '/utilizadores', label: 'Utilizadores', icon: UserCog }, { to: '/seguradoras', label: 'Seguradoras', icon: Building2 }, { to: '/importar', label: 'Importar', icon: FileUp },
] };

interface NavigationProps {
  onNavigate?: () => void;
  // Números ao lado de um item (ex.: pedidos do site por tratar em Leads). Vêm do Layout, que só subscreve uma vez.
  contagens?: Record<string, number>;
}

export function Navigation({ onNavigate, contagens = {} }: NavigationProps) {
  const { isAdmin } = useAuth();
  return (
    <nav className="sidebar-nav" aria-label="Navegação principal">
      {(isAdmin ? [...groups, adminGroup] : groups).map((group) => (
        <div className="nav-group" key={group.title}>
          <p className="nav-group-title nav-label">{group.title}</p>
          {group.links.map(({ to, label, icon: Icon }) => {
            const n = contagens[to] ?? 0;
            const descricao = n > 0 ? `${label} (${n} ${n === 1 ? 'pedido do site por tratar' : 'pedidos do site por tratar'})` : label;
            return (
              <NavLink key={to} to={to} end={to === '/'} onClick={onNavigate} aria-label={descricao} title={descricao}
                className={({ isActive }) => `nav-item${isActive ? ' is-active' : ''}`}>
                <span className="nav-icon"><Icon size={19} strokeWidth={1.65} />{n > 0 && <span className="nav-dot" aria-hidden="true" />}</span>
                <span className="nav-label">{label}</span>
                {n > 0 && <span className="nav-count nav-label" aria-hidden="true">{n > 99 ? '99+' : n}</span>}
              </NavLink>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
