import { useEffect, useId, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, LayoutDashboard, Users, FileText, Contact, Shield, RefreshCw, AlertTriangle, UserCog, FileUp, Building2, KeyRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { Modulo } from '@/lib/permissoes';

interface LinkMenu { to: string; label: string; icon: LucideIcon; modulo?: Modulo }
interface GrupoMenu { title: string; links: LinkMenu[] }

const groups: GrupoMenu[] = [
  { title: 'Visão geral', links: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, modulo: 'dashboard' }] },
  { title: 'Comercial', links: [
    { to: '/leads', label: 'Leads', icon: Users, modulo: 'leads' }, { to: '/propostas', label: 'Propostas', icon: FileText, modulo: 'propostas' },
    { to: '/clientes', label: 'Clientes', icon: Contact, modulo: 'clientes' },
  ] },
  { title: 'Carteira', links: [
    { to: '/apolices', label: 'Apólices', icon: Shield, modulo: 'apolices' }, { to: '/renovacoes', label: 'Renovações', icon: RefreshCw, modulo: 'renovacoes' },
    { to: '/sinistros', label: 'Sinistros', icon: AlertTriangle, modulo: 'sinistros' },
  ] },
];

// Só o administrador; não depende dos grupos, para ninguém ficar sem como gerir o CRM.
const adminGroup: GrupoMenu = { title: 'Administração', links: [
  { to: '/utilizadores', label: 'Utilizadores', icon: UserCog }, { to: '/grupos', label: 'Grupos', icon: KeyRound },
  { to: '/seguradoras', label: 'Seguradoras', icon: Building2 }, { to: '/importar', label: 'Importar', icon: FileUp },
] };

interface NavigationProps {
  onNavigate?: () => void;
  // Números ao lado de um item (ex.: pedidos do site por tratar em Leads). Vêm do Layout, que só subscreve uma vez.
  contagens?: Record<string, number>;
}

const CHAVE_FECHADOS = 'crm.nav.gruposFechados';
// Administração começa fechada: é a que menos se usa e é a que empurrava o menu para scroll.
const FECHADOS_INICIAIS = ['Administração'];

function lerFechados(): string[] {
  try {
    const guardado = localStorage.getItem(CHAVE_FECHADOS);
    return guardado ? (JSON.parse(guardado) as string[]) : FECHADOS_INICIAIS;
  } catch {
    return FECHADOS_INICIAIS; // localStorage indisponível (modo privado): fica o estado inicial.
  }
}

export function Navigation({ onNavigate, contagens = {} }: NavigationProps) {
  const { isAdmin, pode } = useAuth();
  const { pathname } = useLocation();
  const idBase = useId(); // Sidebar e drawer montam a navegação em simultâneo; ids têm de ser únicos.
  const [fechados, setFechados] = useState(lerFechados);
  const visiveis = (isAdmin ? [...groups, adminGroup] : groups)
    .map((g) => ({ ...g, links: g.links.filter((l) => !l.modulo || pode(l.modulo, 'ver')) }))
    .filter((g) => g.links.length > 0);
  const grupoActivo = visiveis.find((g) => g.links.some(({ to }) => (to === '/' ? pathname === '/' : pathname.startsWith(to))))?.title;

  const guardar = (novos: string[]) => {
    setFechados(novos);
    try { localStorage.setItem(CHAVE_FECHADOS, JSON.stringify(novos)); } catch { /* sem persistência, o estado vale só nesta sessão */ }
  };
  const alternar = (titulo: string) => guardar(fechados.includes(titulo) ? fechados.filter((t) => t !== titulo) : [...fechados, titulo]);

  // Ao entrar numa página cujo grupo está fechado, abre-o para o item activo ficar à vista.
  useEffect(() => {
    if (grupoActivo && fechados.includes(grupoActivo)) guardar(fechados.filter((t) => t !== grupoActivo));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grupoActivo]);

  return (
    <nav className="sidebar-nav" aria-label="Navegação principal">
      {visiveis.map((group) => {
        const isAberto = !fechados.includes(group.title);
        const pendentes = group.links.reduce((total, { to }) => total + (contagens[to] ?? 0), 0);
        const idLinks = `${idBase}-${group.title.normalize('NFD').replace(/[^a-zA-Z]/g, '').toLowerCase()}`;
        return (
        <div className={`nav-group${isAberto ? '' : ' is-closed'}`} key={group.title}>
          <button type="button" className="nav-group-title nav-label" aria-expanded={isAberto} aria-controls={idLinks} onClick={() => alternar(group.title)}>
            <span>{group.title}</span>
            {!isAberto && pendentes > 0 && <span className="nav-count" aria-label={`${pendentes} por tratar`}>{pendentes > 99 ? '99+' : pendentes}</span>}
            <ChevronDown size={14} className="nav-group-chevron" aria-hidden="true" />
          </button>
          <div className="nav-group-links" id={idLinks}>
          {group.links.map(({ to, label, icon: Icon }) => {
            const n = contagens[to] ?? 0;
            const tipo = to === '/sinistros' ? 'de sinistro' : 'de proposta';
            const descricao = n > 0 ? `${label} (${n} ${n === 1 ? `pedido ${tipo} do site por tratar` : `pedidos ${tipo} do site por tratar`})` : label;
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
        </div>
        );
      })}
    </nav>
  );
}
