import { useRef, useState, type FormEvent } from 'react'
import { ApiError } from '../../api/client'
import { diaMes, hora, NOME_DO_TIPO } from '../../lib/formato'
import { mensagemDeErro } from '../../lib/erros'
import styles from '../Painel.module.css'
import entrada from './Entrada.module.css'
import { validarIngresso, type EntradaLiberada } from './entradaApi'

type Resultado =
  | { tipo: 'liberada'; ingresso: EntradaLiberada }
  | { tipo: 'recusada'; titulo: string; mensagem: string }

interface Registro {
  quando: string
  texto: string
  liberada: boolean
}

/** Títulos para os erros de POST /tickets/validate; a explicação vem sempre da API. */
const TITULO_DO_ERRO: Record<number, string> = {
  400: 'QR inválido',
  404: 'Ingresso não encontrado',
  409: 'Entrada recusada',
  422: 'Fora do horário',
}

/**
 * Porta da sala: o leitor de QR (que funciona como teclado) ou o funcionário digita o
 * código, a API confere assinatura, situação e horário e marca o ingresso como usado.
 */
export function EntradaPage() {
  const [codigo, setCodigo] = useState('')
  const [validando, setValidando] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [historico, setHistorico] = useState<Registro[]>([])
  const campo = useRef<HTMLInputElement>(null)

  async function validar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const qr = codigo.trim()
    if (!qr) {
      return
    }
    setValidando(true)
    try {
      const ingresso = await validarIngresso(qr)
      setResultado({ tipo: 'liberada', ingresso })
      registrar(`${ingresso.cadeiraAssento} · ${ingresso.filmeTitulo}`, true)
    } catch (e) {
      const titulo = e instanceof ApiError ? (TITULO_DO_ERRO[e.status] ?? 'Erro') : 'Erro'
      setResultado({ tipo: 'recusada', titulo, mensagem: mensagemDeErro(e) })
      registrar(titulo, false)
    } finally {
      setValidando(false)
      setCodigo('')
      campo.current?.focus()
    }
  }

  function registrar(texto: string, liberada: boolean) {
    const quando = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setHistorico((atual) => [{ quando, texto, liberada }, ...atual].slice(0, 10))
  }

  return (
    <section className={styles.janela} aria-labelledby="entrada">
      <h1 id="entrada" className={styles.janelaTitulo}>
        Entrada · validar ingresso
      </h1>
      <div className={styles.janelaCorpo}>
        <form className={entrada.leitura} onSubmit={validar}>
          <label className={styles.campo}>
            Código do QR
            <input
              ref={campo}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              placeholder="Aponte o leitor para o QR do ingresso"
            />
          </label>
          <button type="submit" className={styles.botaoPrincipal} disabled={validando || !codigo.trim()}>
            {validando ? 'Validando…' : 'Validar'}
          </button>
        </form>
        <p className={styles.dica}>O leitor de QR digita o código e aperta Enter sozinho. Também dá para colar o código.</p>

        <div aria-live="polite">
          {resultado?.tipo === 'liberada' && <Liberada ingresso={resultado.ingresso} />}
          {resultado?.tipo === 'recusada' && (
            <div className={entrada.recusada} role="alert">
              <p className={entrada.manchete}>{resultado.titulo}</p>
              <p style={{ margin: 0, color: 'var(--grafite)' }}>{resultado.mensagem}</p>
            </div>
          )}
        </div>

        {historico.length > 0 && (
          <table className={styles.tabela}>
            <caption style={{ textAlign: 'left', fontWeight: 700, padding: '4px 0' }}>Últimas leituras</caption>
            <thead>
              <tr>
                <th scope="col">Hora</th>
                <th scope="col">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {historico.map((r, i) => (
                <tr key={`${r.quando}-${i}`}>
                  <td>{r.quando}</td>
                  <td>
                    {r.liberada ? 'Liberada' : 'Recusada'}: {r.texto}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

function Liberada({ ingresso }: { ingresso: EntradaLiberada }) {
  return (
    <div className={entrada.liberada} role="status">
      <p className={entrada.manchete}>Entrada liberada</p>
      <dl className={entrada.detalhes}>
        <dt>Filme</dt>
        <dd>{ingresso.filmeTitulo}</dd>
        <dt>Sessão</dt>
        <dd>
          {diaMes(ingresso.horarioSessao)} às {hora(ingresso.horarioSessao)} · {ingresso.salaNome}
        </dd>
        <dt>Lugar</dt>
        <dd>
          <strong>{ingresso.cadeiraAssento}</strong>
        </dd>
        <dt>Ingresso</dt>
        <dd>{NOME_DO_TIPO[ingresso.ticketType]}</dd>
      </dl>
      {ingresso.alerta && <p className={entrada.alerta}>{ingresso.alerta}</p>}
    </div>
  )
}
