import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import type { FormEvent } from 'react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [visible, setVisible] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aSubmeter, setASubmeter] = useState(false);
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault(); setErro(null); setASubmeter(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) setErro(error.message === 'Invalid login credentials' ? 'Verifique o email e a palavra-passe e tente novamente.' : error.message);
    } catch { setErro('Não foi possível ligar ao serviço. Verifique a ligação e tente novamente.'); }
    finally { setASubmeter(false); }
  };
  return <div className="auth-shell">
    <section className="auth-brand-panel" aria-label="BV Seguros">
      <div className="auth-brand"><img src="/brand/logo-icon-branco.png" width={108} height={120} alt="BV Seguros" /></div>
      <div className="auth-brand-copy"><h2>Mais próximo de cada cliente.</h2><p>Contactos, apólices e acompanhamento. O dia a dia da sua carteira, num só lugar.</p></div>
      <footer>CRM · Gestão de seguros</footer>
    </section>
    <main className="auth-form-area">
      <form onSubmit={handleSubmit} className="auth-form">
        <span className="auth-badge"><ShieldCheck size={13} />Área reservada</span>
        <h1>Bem-vindo de volta</h1><p>Entre na sua conta para continuar a gerir a sua carteira.</p>
        <label className="auth-field">Email<input autoComplete="username" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="O seu email profissional" /></label>
        <div className="auth-field"><label htmlFor="login-password">Palavra-passe</label><span className="relative block"><input id="login-password" autoComplete="current-password" type={visible ? 'text' : 'password'} required value={senha} onChange={(event) => setSenha(event.target.value)} style={{ paddingRight: 48 }} /><button type="button" className="icon-button absolute right-1 top-3" aria-label={visible ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></div>
        {erro && <p role="alert" className="mt-4 rounded-lg bg-danger-bg p-3 text-sm text-danger-text">{erro}</p>}
        <Button type="submit" loading={aSubmeter} className="w-full mt-7">Entrar <ArrowRight size={16} /></Button>
        <div className="auth-note"><LockKeyhole size={13} />Acesso reservado à equipa BV Seguros</div>
      </form>
      <p className="auth-copyright">© {new Date().getFullYear()} BV Seguros · CRM interno</p>
    </main>
  </div>;
}
