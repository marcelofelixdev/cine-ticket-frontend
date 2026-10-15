import { useState, type FormEvent } from 'react'
import { mensagemDeErro } from '../../lib/erros'
import { dataCompleta } from '../../lib/formato'
import { useCarregar } from '../../lib/useCarregar'
import styles from '../Painel.module.css'
import { buscarNoTmdb, pedidosDoCinema, pedirFilme, type FilmeDoTmdb, type PedidoDeFilme } from './gerenteApi'

const SITUACAO: Record<PedidoDeFilme['status'], string> = {
  AGUARDANDO_ADMIN: 'Aguardando o admin',
  APROVADO: 'Aprovado',
  RECUSADO: 'Recusado',
}

/** O gerente busca no TMDB e pede o filme; o admin aprova ou recusa. */
export function PedidosPage() {
  const pedidos = useCarregar((signal) => pedidosDoCinema(signal), 'pedidos')
  const [termo, setTermo] = useState('')
  const [resultados, setResultados] = useState<FilmeDoTmdb[] | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  async function buscar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (termo.trim().length < 2) {
      return
    }
    setBuscando(true)
    setErro(null)
    try {
      setResultados(await buscarNoTmdb(termo.trim()))
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setBuscando(false)
    }
  }

  async function pedir(filme: FilmeDoTmdb) {
    setErro(null)
    setMensagem(null)
    try {
      await pedirFilme(filme.tmdbId)
      setMensagem(`Pedido de ${filme.titulo} enviado ao admin.`)
      pedidos.recarregar()
    } catch (e) {
      setErro(mensagemDeErro(e))
    }
  }

  return (
    <div className={styles.colunas}>
      <section className={`${styles.janela} ${styles.colunaEstreita}`} aria-labelledby="pedir">
        <h1 id="pedir" className={styles.janelaTitulo}>
          Pedir filme ao admin
        </h1>
        <div className={styles.janelaCorpo}>
          <form className={styles.acoes} onSubmit={buscar} role="search">
            <label className={styles.campo} style={{ flex: '1 1 200px' }}>
              <span className="visually-hidden">Buscar no TMDB</span>
              <input value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Nome do filme" />
            </label>
            <button type="submit" className={styles.botao} disabled={buscando || termo.trim().length < 2}>
              {buscando ? 'Buscando…' : 'Buscar no TMDB'}
            </button>
          </form>
          {mensagem && (
            <p className={styles.sucesso} role="status">
              {mensagem}
            </p>
          )}
          {erro && (
            <p className={styles.alerta} role="alert">
              {erro}
            </p>
          )}
          {resultados?.length === 0 && <p>Nada encontrado no TMDB.</p>}
          {resultados && resultados.length > 0 && (
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th scope="col">
                    <span className="visually-hidden">Pôster</span>
                  </th>
                  <th scope="col">Filme</th>
                  <th scope="col">
                    <span className="visually-hidden">Ação</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((filme) => (
                  <tr key={filme.tmdbId}>
                    <td>{filme.posterUrl ? <img className={styles.poster} src={filme.posterUrl} alt="" /> : null}</td>
                    <td>
                      {filme.titulo} {filme.ano ? `(${filme.ano})` : ''}
                      {filme.filmeId !== null && <div className={styles.dica}>Já está no catálogo da rede</div>}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.botao}
                        aria-label={`Pedir ${filme.titulo}`}
                        onClick={() => void pedir(filme)}
                      >
                        Pedir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className={styles.dica}>Dados e imagens do TMDB.</p>
        </div>
      </section>

      <section className={`${styles.janela} ${styles.colunaLarga}`} aria-labelledby="meus-pedidos">
        <h2 id="meus-pedidos" className={styles.janelaTitulo}>
          Pedidos do cinema
        </h2>
        <div className={styles.janelaCorpo}>
          {pedidos.erro && <p className={styles.alerta}>{pedidos.erro}</p>}
          {pedidos.dados?.length === 0 && <p>Nenhum pedido ainda.</p>}
          {pedidos.dados && pedidos.dados.length > 0 && (
            <div className={styles.rolagem}>
              <table className={styles.tabela}>
                <thead>
                  <tr>
                    <th scope="col">Filme</th>
                    <th scope="col">Pedido em</th>
                    <th scope="col">Por</th>
                    <th scope="col">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.dados.map((p) => (
                    <tr key={p.id}>
                      <td>
                        {p.titulo} {p.ano ? `(${p.ano})` : ''}
                      </td>
                      <td>{dataCompleta(p.criadoEm)}</td>
                      <td>{p.solicitadoPor ?? '—'}</td>
                      <td>
                        {SITUACAO[p.status]}
                        {p.motivoRecusa && `: ${p.motivoRecusa}`}
                        {p.status === 'APROVADO' && <div className={styles.dica}>Confirme na aba Programação.</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
