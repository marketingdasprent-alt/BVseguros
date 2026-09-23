import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Contact, Shield, RefreshCw, AlertTriangle, CheckSquare } from 'lucide-react';

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

interface NavigationProps { onNavigate?: () => void; }

export function Navigation({ onNavigate }: NavigationProps) {
  return (
    <nav className="sidebar-nav" aria-label="Navegação principal">
      {groups.map((group) => (
        <div className="nav-group" key={group.title}>
          <p className="nav-group-title nav-label">{group.title}</p>
          {group.links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={onNavigate} aria-label={label} title={label}
              className={({ isActive }) => `nav-item${isActive ? ' is-active' : ''}`}>
              <Icon size={19} strokeWidth={1.65} /><span className="nav-label">{label}</span>
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}
