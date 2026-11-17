import { api } from '../api'

interface ImportarProps {
  importMsg: { tipo: 'ok' | 'erro'; texto: string } | null
  setImportMsg: (t: { tipo: 'ok' | 'erro'; texto: string } | null) => void
  canImportar: boolean
}

export default function ImportarSecao({
  importMsg,
  setImportMsg,
  canImportar,
}: ImportarProps) {
  const importarArquivo = async (file: File | undefined) => {
    if (!file) return
    setImportMsg(null)
    try {
      const csv = await file.text()
      const r = await api.importarPlanilha(csv)
      const det = r.ignoradas.length
        ? ` Ignoradas (${r.ignoradas.length}): ` +
          r.ignoradas.slice(0, 5).map((x) => `linha ${x.linha} (${x.motivo})`).join(' · ') +
          (r.ignoradas.length > 5 ? ' …' : '')
        : ''
      const res = r.reservas_criadas ? ` (+${r.reservas_criadas} reserva(s))` : ''
      setImportMsg({
        tipo: r.ignoradas.length ? 'erro' : 'ok',
        texto: `Importadas ${r.criadas} de ${r.total}${res}.${det}`,
      })
    } catch (e: any) {
      setImportMsg({ tipo: 'erro', texto: e.message })
    }
  }

  if (!canImportar) return null

  return (
    <>
      <p className="sub">
        Planilha no padrão Cidade;LED;Anunciante;Início;Fim;
        ReservaN_Anunciante;ReservaN_Início;ReservaN_Fim — datas BR, ISO ou por extenso.
      </p>
      <div className="toolbar" style={{ marginBottom: 0 }}>
        <label className="toolbar-upload" title="Importar planilha">
          ⬆ Importar planilha
          <input
            type="file"
            accept=".csv,.txt"
            hidden
            onChange={(e) => {
              importarArquivo(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </label>
        <a href={api.modeloImportUrl}>
          <button className="ghost" type="button">
            ⬇ Modelo
          </button>
        </a>
      </div>
      {importMsg && <p className={`spot-msg ${importMsg.tipo}`}>{importMsg.texto}</p>}
    </>
  )
}
