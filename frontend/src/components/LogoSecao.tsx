import { useState } from 'react'
import { api } from '../api'

interface LogoProps {
  logo: string | null
  logoPrev: string | null
  setLogo: (v: string | null) => void
  setLogoPrev: (v: string | null) => void
  logoMsg: { tipo: 'ok' | 'erro'; texto: string } | null
  setLogoMsg: (t: { tipo: 'ok' | 'erro'; texto: string } | null) => void
  canConfig: boolean
}

export default function LogoSecao({
  logo,
  logoPrev,
  setLogo,
  setLogoPrev,
  logoMsg,
  setLogoMsg,
  canConfig,
}: LogoProps) {
  const lerLogo = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setLogoMsg({ tipo: 'erro', texto: 'Envie um arquivo de imagem.' })
      return
    }
    if (file.size > 512 * 1024) {
      setLogoMsg({ tipo: 'erro', texto: 'Máximo 512KB.' })
      return
    }
    const rd = new FileReader()
    rd.onload = () => {
      setLogoPrev(String(rd.result))
      setLogoMsg(null)
    }
    rd.readAsDataURL(file)
  }

  const salvarLogo = async () => {
    if (!logoPrev) return
    setLogoMsg(null)
    try {
      await api.salvarLogo(logoPrev)
      setLogo(logoPrev)
      setLogoPrev(null)
      setLogoMsg({ tipo: 'ok', texto: 'Logo salva.' })
    } catch (e: any) {
      setLogoMsg({ tipo: 'erro', texto: e.message })
    }
  }

  const removerLogo = async () => {
    try {
      await api.removerLogo()
      setLogo(null)
      setLogoPrev(null)
      setLogoMsg({ tipo: 'ok', texto: 'Logo removida.' })
    } catch (e: any) {
      setLogoMsg({ tipo: 'erro', texto: e.message })
    }
  }

  if (!canConfig) return null

  return (
    <>
      <p className="sub">
        Logo da empresa no lugar do ícone, em tamanho fixo (38px), persistida no back-end.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        {logoPrev || logo ? (
          <img className="brand-logo" src={(logoPrev || logo) as string} alt="prévia" />
        ) : (
          <div
            className="icon"
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'var(--panel2)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            —
          </div>
        )}
        <div className="toolbar" style={{ margin: 0 }}>
          <label className="toolbar-upload" title="PNG, JPG, GIF, WebP ou SVG até 512KB">
            Escolher imagem
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                lerLogo(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </label>
        </div>
      </div>
      {logoMsg && (
        <p className={`spot-msg ${logoMsg.tipo === 'ok' ? 'ok' : 'erro'}`}>
          {logoMsg.texto}
        </p>
      )}
      <div className="toolbar" style={{ marginTop: 8, marginBottom: 0 }}>
        <button disabled={!logoPrev} onClick={salvarLogo}>
          Salvar logo
        </button>
        {(logo || logoPrev) && (
          <button className="ghost" onClick={removerLogo}>
            Remover
          </button>
        )}
      </div>
    </>
  )
}
