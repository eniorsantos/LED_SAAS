import { useState } from 'react';
import { api } from '../api';

interface LoginProps {
  token: string;
  login: string;
  setLogin: (v: string) => void;
  senha: string;
  setSenha: (v: string) => void;
  logando: boolean;
  setLogando: (v: boolean) => void;
  loginErro: string;
  setLoginErro: (v: string) => void;
  logo: string | null;
  onLogin: (resultado: { token: string; perfil: string; nome: string }) => void;
}

export default function Login({
  login,
  setLogin,
  senha,
  setSenha,
  logando,
  setLogando,
  loginErro,
  setLoginErro,
  logo,
  onLogin,
}: LoginProps) {
  const [localErro, setLocalErro] = useState(loginErro);

  const fazerLogin = async () => {
    setLogando(true);
    setLocalErro('');
    try {
      const r = await api.login(login, senha);
      onLogin(r);
    } catch {
      setLocalErro('Login inválido — use admin/admin123 (demo). Entrando offline…');
    } finally {
      setLogando(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="card login-card">
        <div className="brand" style={{ marginBottom: 12 }}>
          {logo ? (
            <img className="brand-logo" src={logo} alt="Marca Controle de LED" />
          ) : (
            <div className="icon" aria-hidden="true">
              📺
            </div>
          )}
          <div>
            <h1>CONTROLE DE LED</h1>
            <span>PAINÉIS DE VEICULAÇÃO</span>
          </div>
        </div>
        <h2>Login</h2>
        <p className="sub">Fluxo §5 · perfis §9.2 (admin / regional / operador / visualizador)</p>
        <label htmlFor="login-input">Login</label>
        <input
          id="login-input"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          placeholder="login"
          aria-describedby={localErro ? 'login-erro' : undefined}
        />
        <label htmlFor="senha-input">Senha</label>
        <input
          id="senha-input"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="senha"
          aria-describedby={localErro ? 'login-erro' : undefined}
        />
        {localErro && (
          <p
            id="login-erro"
            className="sub"
            style={{ color: 'var(--red)' }}
            role="alert"
            aria-live="polite"
          >
            {localErro}
          </p>
        )}
        <button onClick={fazerLogin} disabled={logando}>
          {logando ? 'Entrando…' : 'Entrar'}
        </button>
        <p className="sub" style={{ marginTop: 10 }}>
          Demo: admin/admin123 · viewer/view123
        </p>
      </div>
    </div>
  );
}
