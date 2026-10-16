import { useState, type FormEvent } from 'react'
import { mensagemDeErro } from '../../lib/erros'
import styles from '../Painel.module.css'
import { buscarNoTmdb, type FilmeDoTmdb } from './painelApi'

interface Props {
  /** Texto do botão de cada resultado ("Pedir", "Cadastrar"). */
  acao: string
  onEscolher: (filme: FilmeDoTmdb) => Promise<void>
}

/** Busca no TMDB pela API e lista os resultados com uma ação em cada um. */
export function BuscaNoTmdb({ acao, onEscolher }: Props) {
  const [termo, setTermo] = useState('')
  const [resultados, setResultados] = useState<FilmeDoTmdb[] | null>(null)
  const [buscando, setBuscando] = useState(false)
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

  return (
    <>
      <form className={styles.acoes} onSubmit={buscar} role="search">
        <label className={styles.campo} style={{ flex: '1 1 200px' }}>
          <span className="visually-hidden">Buscar no TMDB</span>
          <input value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Nome do filme" />
        </label>
        <button type="submit" className={styles.botao} disabled={buscando || termo.trim().length < 2}>
          {buscando ? 'Buscando…' : 'Buscar no TMDB'}
        </button>
      </form>
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
                    aria-label={`${acao} ${filme.titulo}`}
                    onClick={() => void onEscolher(filme)}
                  >
                    {acao}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className={styles.dica}>Dados e imagens do TMDB.</p>
    </>
  )
}
