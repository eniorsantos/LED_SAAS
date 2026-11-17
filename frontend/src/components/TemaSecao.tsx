import { useState } from 'react'
import { api, salvarTema } from '../api'

interface TemaProps {
  tema: { vars: Record<string, string>; rotulos: Record<string, string> }
  setTema: (t: any) => void
  temaMsg: { tipo: 'ok' | 'erro'; texto: string } | null
  setTemaMsg: (t: { tipo: 'ok' | 'erro'; texto: string } | null) => void
  canConfig: boolean
}

export default function TemaSecao({
  tema,
  setTema,
  temaMsg,
  setTemaMsg,
  canConfig,
}: TemaProps) {
  const salvarTemaAtual = async (restaurar = false) => {
    setTemaMsg(null)
    try {
      const r = await salvarTema(restaurar ? {} : tema.vars, restaurar)
      setTema((t: any) => ({ ...t, vars: r.vars }))
      setTemaMsg({
        tipo: 'ok',
        texto: restaurar ? 'Paleta padrão restaurada.' : 'Paleta salva e aplicada.',
      })
    } catch (e: any) {
      setTemaMsg({ tipo: 'erro', texto: e.message })
    }
  }

  if (!canConfig) return null

  return (
    <>
      <p className="sub">
        Paleta do projeto: fundo, fontes, destaques e gráficos. Aplica na hora em todo o painel.
      </p>
      <div className="perm-grid">
        {Object.keys(tema.rotulos).map((k) => (
          <label key={k} className="check">
            {tema.rotulos[k]}
            <input
              type="color"
              value={tema.vars[k] || '#000000'}
              onChange={(e) =>
                setTema((t: any) => ({
                  ...t,
                  vars: { ...t.vars, [k]: e.target.value },
                }))
              }
            />
            <small style={{ color: 'var(--muted)' }}>{tema.vars[k]}</small>
          </label>
        ))}
      </div>
      {Object.keys(tema.vars).length === 0 && <p className="sub">Carregando paleta…</p>}
      {temaMsg && (
        <p className={`spot-msg ${temaMsg.tipo === 'ok' ? 'ok' : 'erro'}`}>
          {temaMsg.texto}
        </p>
      )}
      <div className="toolbar" style={{ marginTop: 8, marginBottom: 0 }}>
        <button onClick={() => salvarTemaAtual(false)}>Salvar cores</button>
        <button className="ghost" onClick={() => salvarTemaAtual(true)}>
          Restaurar padrão
        </button>
      </div>
    </>
  )
}
