import { useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, MailCheck, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { pedirRecuperacaoSenha } from '@/hooks/useAuth';
import { mensagemErro } from '@/lib/erros';
import type { FormEvent } from 'react';

type Vista = 'entrar' | 'recuperar' | 'recuperacao-enviada';

export default function Login() {
  const [vista, setVista] = useState<Vista>('entrar');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [visible, setVisible] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aSubmeter, setASubmeter] = useState(false);

  const mudarVista = (nova: Vista) => { setErro(null); setVista(nova); };

  const handleEntrar = async (event: FormEvent) => {
    event.preventDefault(); setErro(null); setASubmeter(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) setErro(error.message === 'Invalid login credentials' ? 'Verifique o email e a palavra-passe e tente novamente.' : error.message);
    } catch { setErro('Não foi possível ligar ao serviço. Verifique a ligação e tente novamente.'); }
    finally { setASubmeter(false); }
  };

  const handleRecuperar = async (event: FormEvent) => {
    event.preventDefault(); setErro(null); setASubmeter(true);
    try {
      await pedirRecuperacaoSenha(email);
      mudarVista('recuperacao-enviada');
    } catch (err: unknown) { setErro(mensagemErro(err)); }
    finally { setASubmeter(false); }
  };

  const campoEmail = <label className="auth-field">Email<input autoComplete="username" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="O seu email profissional" /></label>;
  const erroVisivel = erro && <p role="alert" className="mt-4 rounded-lg bg-danger-bg p-3 text-sm text-danger-text">{erro}</p>;
  const voltar = <button type="button" className="text-link mt-6" onClick={() => mudarVista('entrar')}><ArrowLeft size={14} />Voltar ao login</button>;

  return <div className="auth-shell">
    <section className="auth-brand-panel" aria-label="BV Seguros">
      <div className="auth-brand"><img src="/brand/logo-icon-branco.png" width={108} height={120} alt="BV Seguros" /></div>
      <div className="auth-brand-copy"><h2>Mais próximo de cada cliente.</h2><p>Contactos, apólices e acompanhamento. O dia a dia da sua carteira, num só lugar.</p></div>
      <footer>CRM · Gestão de seguros</footer>
    </section>
    <main className="auth-form-area">
      {vista === 'entrar' && <form onSubmit={handleEntrar} className="auth-form">
        <span className="auth-badge"><ShieldCheck size={13} />Área reservada</span>
        <h1>Bem-vindo de volta</h1><p>Entre na sua conta para continuar a gerir a sua carteira.</p>
        {campoEmail}
        <div className="auth-field">
          <span className="flex items-baseline justify-between gap-3">
            <label htmlFor="login-password">Palavra-passe</label>
            <button type="button" className="text-link" onClick={() => mudarVista('recuperar')}>Esqueci a senha</button>
          </span>
          <span className="relative block"><input id="login-password" autoComplete="current-password" type={visible ? 'text' : 'password'} required value={senha} onChange={(event) => setSenha(event.target.value)} style={{ paddingRight: 48 }} /><button type="button" className="icon-button absolute right-1 top-3" aria-label={visible ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></span>
        </div>
        {erroVisivel}
        <Button type="submit" loading={aSubmeter} className="w-full mt-7">Entrar <ArrowRight size={16} /></Button>
        <div className="auth-note"><LockKeyhole size={13} />Acesso reservado à equipa BV Seguros</div>
      </form>}

      {vista === 'recuperar' && <form onSubmit={handleRecuperar} className="auth-form">
        <span className="auth-badge"><LockKeyhole size={13} />Recuperar acesso</span>
        <h1>Esqueci a senha</h1><p>Indique o email da sua conta. Vai receber um link para definir uma senha nova.</p>
        {campoEmail}
        {erroVisivel}
        <Button type="submit" loading={aSubmeter} className="w-full mt-7">Enviar link</Button>
        {voltar}
      </form>}

      {vista === 'recuperacao-enviada' && <div className="auth-form" role="status">
        <span className="auth-badge"><MailCheck size={13} />Pedido enviado</span>
        <h1>Verifique o seu email</h1>
        <p>Se existir uma conta com <strong className="font-medium text-ink">{email}</strong>, vai receber um link para definir uma senha nova. O link é válido durante pouco tempo; se não o encontrar, veja também o spam.</p>
        {voltar}
      </div>}
      <p className="auth-copyright">© {new Date().getFullYear()} BV Seguros · CRM interno</p>
    </main>
  </div>;
}
