import { useState } from 'react'
import { api } from '../api'

interface PerfilSecaoProps {
  perfil: string
  canUsuarios: boolean
  carregarAcesso: () => void
  carregar: () => void
}

interface MeData {
  login: string
  perfil: string
  nome: string
  cidades: string[]
  permissoes: string[]
  efetivas: string[]
}

export default function PerfilSecao({
  perfil,
  canUsuarios,
  carregarAcesso,
  carregar,
}: PerfilSecaoProps) {
  const [me, setMe] = useState<MeData | null>(null)
  const [senhaMsg, setSenhaMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [carregando, setCarregando] = useState(false)

  const carregarMe = async () => {
    try {
      const data = await api.me()
      setMe(data)
    } catch (e: any) {
      setSenhaMsg({ tipo: 'erro', texto: e.message || 'Erro ao carregar perfil.' })
    }
  }

  const alterarSenha = async () => {
    setSenhaMsg(null)
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      setSenhaMsg({ tipo: 'erro', texto: 'Preencha todos os campos de senha.' })
      return
    }
    if (novaSenha !== confirmarSenha) {
      setSenhaMsg({ tipo: 'erro', texto: 'Nova senha e confirmação não coincidem.' })
      return
    }
    if (novaSenha.length < 6) {
      setSenhaMsg({ tipo: 'erro', texto: 'Nova senha deve ter pelo menos 6 caracteres.' })
      return
    }
    setCarregando(true)
    try {
      await api.alterarSenha(senhaAtual, novaSenha)
      setSenhaMsg({ tipo: 'ok', texto: 'Senha alterada com sucesso.' })
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmarSenha('')
    } catch (e: any) {
      setSenhaMsg({ tipo: 'erro', texto: e.message || 'Erro ao alterar senha.' })
    } finally {
      setCarregando(false)
    }
  }

  if (!me) return null

  return (
    <>
      <p className="sub">
        Suas informações de usuário. Aqui você pode alterar sua senha.{' '}
        {canUsuarios ? (
          <> Para gerenciar outros usuários, acesse a aba <b>Acesso</b> em Configurações.</>
        ) : null}
      </p>

      <div className="spot-form">
        <h2 style={{ fontSize: '.85rem' }}>Meu Perfil</h2>
        <div className="spot-row">
          <label>
            Login
            <input value={me.login} disabled readOnly />
          </label>
          <label>
            Perfil
            <input value={me.perfil} disabled readOnly />
          </label>
          <label>
            Nome
            <input value={me.nome || '(não definido)'} disabled readOnly />
          </label>
        </div>
        <label>
          Cidades que pode ver (vazio = todas)
          <div className="perm-grid">
            {me.cidades.length ? me.cidades.map((c: string) => (
              <label key={c} className="check">
                <span>{c}</span>
              </label>
            )) : (
              <span style={{ fontStyle: 'italic', color: 'var(--muted)' }}>Todas as cidades</span>
            )}
          </div>
        </label>
        <label>
          Recursos extras além do perfil
          <div className="perm-grid">
            {me.efetivas.length ? me.efetivas.map((r: string) => (
              <label key={r} className="check">
                <span>{r}</span>
              </label>
            )) : (
              <span style={{ fontStyle: 'italic', color: 'var(--muted)' }}>Apenas recursos do perfil</span>
            )}
          </div>
        </label>
      </div>

      <div className="spot-form">
        <h2 style={{ fontSize: '.85rem' }}>Alterar Senha</h2>
        <div className="spot-row">
          <label>
            Senha atual
            <input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} />
          </label>
          <label>
            Nova senha
            <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} />
          </label>
          <label>
            Confirmar nova senha
            <input type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} />
          </label>
        </div>
        {senhaMsg && (
          <p className={`spot-msg ${senhaMsg.tipo === 'ok' ? 'ok' : 'erro'}`}>
            {senhaMsg.texto}
          </p>
        )}
        <div className="toolbar" style={{ marginTop: 8, marginBottom: 0 }}>
          <button disabled={carregando} onClick={alterarSenha}>
            {carregando ? 'Alterando…' : 'Alterar Senha'}
          </button>
        </div>
      </div>
    </>
  )
}
