import { useState } from 'react'
import { api } from '../api'

interface LedsSecaoProps {
  ledsLista: any[]
  podeEditar: boolean
  carregar: () => void
  cidades: { id: string; nome: string; uf: string }[]
  dashLedSelecionado: string | null
  setDashLedSelecionado: (v: string | null) => void
  abrirNovaCampanha: (led?: string) => void
}

export default function LedsSecao({
  ledsLista,
  podeEditar,
  carregar,
  cidades,
  dashLedSelecionado,
  setDashLedSelecionado,
  abrirNovaCampanha,
}: LedsSecaoProps) {
  const [ledMsg, setLedMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)
  const [ledsMenu, setLedsMenu] = useState(false)
  const [ledEditando, setLedEditando] = useState<string | null>(null)
  const [ledForm, setLedForm] = useState({
    codigo: '',
    endereco: '',
    cidade_id: 'aracaju',
    espacos: '',
  })

  const salvarLed = async () => {
    setLedMsg(null)
    if (!ledForm.codigo.trim() || !ledForm.endereco.trim() || !ledForm.cidade_id) {
      setLedMsg({ tipo: 'erro', texto: 'Preencha código, endereço e cidade.' })
      return
    }
    const esp = ledForm.espacos === '' ? null : Number(ledForm.espacos)
    if (esp !== null && (!Number.isInteger(esp) || esp < 1)) {
      setLedMsg({ tipo: 'erro', texto: 'Espaços deve ser inteiro ≥ 1 (ou vazio = padrão).' })
      return
    }
    try {
      if (ledEditando) {
        await api.editarLed(ledEditando, {
          endereco: ledForm.endereco,
          cidade_id: ledForm.cidade_id,
          espacos_total: esp,
          ...(ledForm.codigo !== ledEditando ? { novo_codigo: ledForm.codigo } : {}),
        })
        setLedMsg({ tipo: 'ok', texto: 'LED atualizado.' })
      } else {
        const { status, body } = await api.criarLed({
          ...ledForm,
          espacos_total: esp,
        })
        if (status !== 201) {
          setLedMsg({ tipo: 'erro', texto: body?.erro || `Falha (HTTP ${status}).` })
          return
        }
        setLedMsg({
          tipo: 'ok',
          texto: `LED ${ledForm.codigo} cadastrado (${esp ?? 'padrão'} espaços).`,
        })
      }
      setLedForm({ codigo: '', endereco: '', cidade_id: ledForm.cidade_id, espacos: '' })
      setLedEditando(null)
      carregar()
    } catch (e: any) {
      setLedMsg({ tipo: 'erro', texto: e.message })
    }
  }

  const excluirLed = async (codigo: string) => {
    if (!confirm(`Excluir o LED ${codigo}? (só vazio)`)) return
    try {
      await api.excluirLed(codigo)
      carregar()
    } catch (e: any) {
      setLedMsg({ tipo: 'erro', texto: e.message })
    }
  }

  if (!podeEditar) return null

  return (
    <>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Endereço</th>
              <th>Cidade</th>
              <th>Espaços</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {(ledsLista.length ? ledsLista : []).map((l: any) => (
              <tr key={l.codigo}>
                <td>
                  <b>{l.codigo}</b>
                </td>
                <td>{l.endereco}</td>
                <td>{l.cidade_id}</td>
                <td>
                  <span
                    className="slots"
                    title={`${l.espacos_usados ?? l.campanhas?.length ?? 0} de ${
                      l.espacos_total ?? 8
                    } espaços ocupados`}
                  >
                    <span className="slots-bar">
                      <span
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(((l.espacos_usados ?? l.campanhas?.length ?? 0) /
                              Math.max(1, l.espacos_total ?? 8)) *
                              100),
                          )}%`,
                        }}
                      />
                    </span>
                    {l.espacos_usados ?? l.campanhas?.length ?? 0}/{l.espacos_total ?? 8}
                  </span>
                </td>
                <td className="row-actions">
                  <button
                    onClick={() => {
                      setLedEditando(l.codigo)
                      setLedForm({
                        codigo: l.codigo,
                        endereco: l.endereco,
                        cidade_id: l.cidade_id,
                        espacos:
                          l.espacos_proprio === null || l.espacos_proprio === undefined
                            ? ''
                            : String(l.espacos_proprio),
                      })
                    }}
                  >
                    Editar
                  </button>
                  <button className="danger" onClick={() => excluirLed(l.codigo)}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {podeEditar && (
        <div className="spot-form">
          <h2 style={{ fontSize: '.85rem' }}>
            {ledEditando ? `EDITAR ${ledEditando}` : '＋ NOVO LED'}
          </h2>
          <div className="spot-row" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
            <label>
              Código
              <input
                placeholder="AJU 05"
                value={ledForm.codigo}
                onChange={(e) =>
                  setLedForm({ ...ledForm, codigo: e.target.value.toUpperCase() })
                }
              />
            </label>
            <label>
              Endereço
              <input
                placeholder="Av. ..."
                value={ledForm.endereco}
                onChange={(e) => setLedForm({ ...ledForm, endereco: e.target.value })}
              />
            </label>
            <label>
              Cidade
              <select
                value={ledForm.cidade_id}
                onChange={(e) => setLedForm({ ...ledForm, cidade_id: e.target.value })}
              >
                {(cidades.length ? cidades : [{ id: 'aracaju', nome: 'Aracaju', uf: 'SE' }]).map(
                  (c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}/{c.uf}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label>
              Espaços (vazio = padrão)
              <input
                type="number"
                min={1}
                placeholder="8"
                value={ledForm.espacos}
                onChange={(e) => setLedForm({ ...ledForm, espacos: e.target.value })}
              />
            </label>
          </div>
          {ledMsg && (
            <p className={`spot-msg ${ledMsg.tipo === 'ok' ? 'ok' : 'erro'}`}>
              {ledMsg.texto}
            </p>
          )}
          <div className="toolbar" style={{ marginTop: 8, marginBottom: 0 }}>
            <button onClick={salvarLed}>
              {ledEditando ? 'Salvar alterações' : 'Cadastrar LED'}
            </button>
            {ledEditando && (
              <button
                className="ghost"
                onClick={() => {
                  setLedEditando(null)
                  setLedForm({ codigo: '', endereco: '', cidade_id: ledForm.cidade_id, espacos: '' })
                }}
              >
                Cancelar edição
              </button>
            )}
          </div>
        </div>
      )}
      <div className="toolbar" style={{ marginTop: 12, marginBottom: 0 }}>
        <button className="ghost" onClick={() => setLedsMenu(false)}>
          Fechar
        </button>
      </div>
    </>
  )
}
