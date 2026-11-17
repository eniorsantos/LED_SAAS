import { API, api } from '../api'

interface BackupProps {
  bkMsg: { tipo: 'ok' | 'erro'; texto: string } | null
  setBkMsg: (t: { tipo: 'ok' | 'erro'; texto: string } | null) => void
  canConfig: boolean
}

export default function BackupSecao({
  bkMsg,
  setBkMsg,
  canConfig,
}: BackupProps) {
  const baixarBackup = async () => {
    setBkMsg(null)
    try {
      const token = localStorage.getItem('led_token')
      const resp = await fetch(`${API}/api/backup`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const blob = await resp.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `backup-led.json`
      a.click()
      URL.revokeObjectURL(a.href)
      setBkMsg({ tipo: 'ok', texto: 'Backup baixado.' })
    } catch (e: any) {
      setBkMsg({ tipo: 'erro', texto: e.message })
    }
  }

  const restaurarBackup = async (file: File | undefined) => {
    if (!file) return
    setBkMsg(null)
    try {
      const txt = await file.text()
      let body: any
      try {
        body = JSON.parse(txt)
      } catch {
        throw new Error('arquivo inválido (JSON)')
      }
      if (!body.tabelas) throw new Error('arquivo inválido (sem tabelas)')
      if (!confirm('Restaurar SUBSTITUI todo o banco. Continuar?')) return
      const token = localStorage.getItem('led_token')
      const resp = await fetch(`${API}/api/backup/restaurar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      })
      const r = await resp.json().catch(() => ({}))
      if (!resp.ok) throw new Error(r.erro || `HTTP ${resp.status}`)
      setBkMsg({
        tipo: 'ok',
        texto: `Restaurado: ${r.contagem?.campanhas ?? 0} campanhas, ${r.contagem?.reservas ?? 0} reservas.`,
      })
    } catch (e: any) {
      setBkMsg({ tipo: 'erro', texto: e.message })
    }
  }

  if (!canConfig) return null

  return (
    <>
      <p className="sub">
        Baixa o banco inteiro em JSON; restaurar{' '}
        <b>substitui tudo</b> — faça um backup antes.
      </p>
      <div className="toolbar" style={{ marginBottom: 0 }}>
        <button onClick={baixarBackup}>⬇ Baixar backup</button>
        <label className="toolbar-upload" title="Restaurar a partir de um backup JSON">
          ⬆ Restaurar backup
          <input
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => {
              restaurarBackup(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </label>
      </div>
      {bkMsg && (
        <p className={`spot-msg ${bkMsg.tipo === 'ok' ? 'ok' : 'erro'}`}>
          {bkMsg.texto}
        </p>
      )}
    </>
  )
}
