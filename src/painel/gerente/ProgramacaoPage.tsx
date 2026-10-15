import { useState } from 'react'
import { mensagemDeErro } from '../../lib/erros'
import { dataCompleta, duracao } from '../../lib/formato'
import { useCarregar } from '../../lib/useCarregar'
import { ConfirmarEmDoisPassos } from '../comum/ConfirmarEmDoisPassos'
import styles from '../Painel.module.css'
import { confirmarFilme, programacao, type ItemDaProgramacao } from './gerenteApi'

/** Filmes do cinema: os enviados pelo admin esperam a confirmação do gerente para entrar em cartaz. */
export function ProgramacaoPage() {
  const itens = useCarregar((signal) => programacao(signal), 'programacao')
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  async function confirmar(item: ItemDaProgramacao) {
    setErro(null)
    try {
      await confirmarFilme(item.movieId)
      setMensagem(`${item.titulo} entrou na programação. Já dá para criar sessões.`)
      itens.recarregar()
    } catch (e) {
      setErro(mensagemDeErro(e))
    }
  }

  // Aguardando confirmação primeiro.
  const ordenados = [...(itens.dados ?? [])].sort((a, b) =>
    a.status === b.status ? a.titulo.localeCompare(b.titulo) : a.status === 'AGUARDANDO_GERENTE' ? -1 : 1,
  )

  return (
    <section className={styles.janela} aria-labelledby="programacao">
      <h1 id="programacao" className={styles.janelaTitulo}>
        Programação do cinema
      </h1>
      <div className={styles.janelaCorpo}>
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
        {itens.erro && <p className={styles.alerta}>{itens.erro}</p>}
        {itens.dados?.length === 0 && <p>Nenhum filme na programação. Peça um filme na aba Pedidos de filme.</p>}
        {ordenados.length > 0 && (
          <div className={styles.rolagem}>
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th scope="col">
                    <span className="visually-hidden">Pôster</span>
                  </th>
                  <th scope="col">Filme</th>
                  <th scope="col">Classificação</th>
                  <th scope="col">Duração</th>
                  <th scope="col">Situação</th>
                </tr>
              </thead>
              <tbody>
                {ordenados.map((item) => (
                  <tr key={item.movieId}>
                    <td>{item.posterUrl ? <img className={styles.poster} src={item.posterUrl} alt="" /> : null}</td>
                    <td>{item.titulo}</td>
                    <td>{item.classificacao ?? '—'}</td>
                    <td>{duracao(item.duracaoEmMinutos)}</td>
                    <td>
                      {item.status === 'ATIVO' ? (
                        `Em cartaz${item.confirmadoEm ? ` desde ${dataCompleta(item.confirmadoEm)}` : ''}`
                      ) : (
                        <span className={styles.acoes}>
                          <span>Aguardando sua confirmação</span>
                          <ConfirmarEmDoisPassos
                            rotulo="Confirmar"
                            confirmar="Sim, pôr em cartaz"
                            onConfirmar={() => confirmar(item)}
                          />
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
