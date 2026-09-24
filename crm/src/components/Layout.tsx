import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { Navigation } from '@/components/crm/Navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabase';

export default function Layout() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const drawer = useRef<HTMLDialogElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const name = profile?.nome || profile?.email || 'Conta';
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!drawerOpen) return;
    const element = drawer.current;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = 'hidden';
    const media = window.matchMedia('(min-width: 640px)');
    const onResize = () => { if (media.matches) setDrawerOpen(false); };
    media.addEventListener('change', onResize);
    return () => {
      element?.close(); document.body.style.overflow = overflow;
      media.removeEventListener('change', onResize); menuButton.current?.focus();
    };
  }, [drawerOpen]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: unknown) {
      toast({ title: 'Não foi possível terminar a sessão', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' });
    } finally { setSigningOut(false); }
  };
  const brand = <div className="sidebar-brand"><img src="/brand/logo-icon-branco.png" alt="BV Seguros" width={36} height={40} /></div>;
  const account = (
    <div className="sidebar-account">
      <div className="account-identity" title={name}>
        <span className="account-avatar" aria-hidden="true">{initials}</span>
        <div className="nav-label min-w-0"><strong>{name}</strong><span>{profile?.email}</span></div>
      </div>
      <button type="button" className="sign-out" onClick={handleSignOut} disabled={signingOut} aria-label="Terminar sessão" title="Terminar sessão">
        <LogOut size={16} /><span className="nav-label">{signingOut ? 'A terminar…' : 'Terminar sessão'}</span>
      </button>
    </div>
  );
  return (
    <div className="app-shell">
      <a className="skip-link" href="#conteudo">Saltar para o conteúdo</a>
      <div className="mobile-header">
        <button ref={menuButton} type="button" className="icon-button" aria-label="Abrir menu" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}><Menu size={22} /></button>
        <img src="/brand/logo-icon-branco.png" alt="BV Seguros" width={27} height={30} />
      </div>
      <aside className={`app-sidebar${collapsed ? ' is-collapsed' : ''}`}>
        {brand}<Navigation />
        <button type="button" className="collapse-toggle" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expandir navegação' : 'Recolher navegação'} title={collapsed ? 'Expandir navegação' : 'Recolher navegação'}>
          {collapsed ? <PanelLeftOpen size={18} /> : <><PanelLeftClose size={18} /><span>Recolher menu</span></>}
        </button>
        {account}
      </aside>
      {drawerOpen && <dialog ref={drawer} className="navigation-drawer" aria-label="Menu de navegação" onCancel={() => setDrawerOpen(false)}>
        <div className="relative">{brand}<button type="button" className="icon-button absolute right-3 top-1/2 -translate-y-1/2" aria-label="Fechar menu" onClick={() => setDrawerOpen(false)}><X size={20} /></button></div>
        <Navigation onNavigate={() => setDrawerOpen(false)} />{account}
      </dialog>}
      <main id="conteudo" tabIndex={-1} className="app-main"><Outlet /></main>
    </div>
  );
}
