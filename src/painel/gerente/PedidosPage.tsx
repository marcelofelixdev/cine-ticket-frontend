import { dataCompleta } from '../../lib/formato'
import { useCarregar } from '../../lib/useCarregar'
import { Avisos } from '../comum/Avisos'
import { BuscaNoTmdb } from '../comum/BuscaNoTmdb'
import { NOME_DA_SITUACAO_DO_PEDIDO } from '../comum/painelApi'
import { useAcao } from '../comum/useAcao'
import styles from '../Painel.module.css'
import { pedidosDoCinema, pedirFilme } from './gerenteApi'

/** O gerente busca no TMDB e pede o filme; o admin aprova ou recusa. */
export function PedidosPage() {
  const pedidos = useCarregar((signal) => pedidosDoCinema(signal), 'pedidos')
  const acao = useAcao()

  return (
    <div className={styles.colunas}>
      <section className={`${styles.janela} ${styles.colunaEstreita}`} aria-labelledby="pedir">
        <h1 id="pedir" className={styles.janelaTitulo}>
          Pedir filme ao admin
        </h1>
        <div className={styles.janelaCorpo}>
          <Avisos sucesso={acao.sucesso} erro={acao.erro} />
          <BuscaNoTmdb
            acao="Pedir"
            onEscolher={async (filme) => {
              if (
                await acao.executar(async () => {
                  await pedirFilme(filme.tmdbId)
                  return `Pedido de ${filme.titulo} enviado ao admin.`
                })
              ) {
                pedidos.recarregar()
              }
            }}
          />
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
                        {NOME_DA_SITUACAO_DO_PEDIDO[p.status]}
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
