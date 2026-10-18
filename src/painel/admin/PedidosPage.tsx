import { useState } from 'react'
import { dataCompleta } from '../../lib/formato'
import { useCarregar } from '../../lib/useCarregar'
import { Avisos } from '../comum/Avisos'
import { NOME_DA_SITUACAO_DO_PEDIDO, type PedidoDeFilme, type SituacaoDoPedido } from '../comum/painelApi'
import { useAcao, type Acao } from '../../lib/useAcao'
import styles from '../Painel.module.css'
import { aprovarPedido, pedidosDaRede, recusarPedido } from './adminApi'

const SITUACOES = Object.keys(NOME_DA_SITUACAO_DO_PEDIDO) as SituacaoDoPedido[]

/** Fila de pedidos dos gerentes: aprovar traz a ficha do TMDB e envia o filme ao cinema que pediu. */
export function PedidosPage() {
  const [situacao, setSituacao] = useState<SituacaoDoPedido | ''>('AGUARDANDO_ADMIN')
  const pedidos = useCarregar((signal) => pedidosDaRede(situacao, signal), situacao)
  const acao = useAcao()

  return (
    <section className={styles.janela} aria-labelledby="pedidos">
      <h1 id="pedidos" className={styles.janelaTitulo}>
        Pedidos de filme
      </h1>
      <div className={styles.janelaCorpo}>
        <label className={styles.campo} style={{ maxWidth: 260 }}>
          Situação
          <select value={situacao} onChange={(e) => setSituacao(e.target.value as SituacaoDoPedido | '')}>
            <option value="">Todas</option>
            {SITUACOES.map((s) => (
              <option key={s} value={s}>
                {NOME_DA_SITUACAO_DO_PEDIDO[s]}
              </option>
            ))}
          </select>
        </label>
        <Avisos sucesso={acao.sucesso} erro={acao.erros.motivo ?? acao.erro} />
        {pedidos.erro && <p className={styles.alerta}>{pedidos.erro}</p>}
        {pedidos.dados?.length === 0 && <p>Nenhum pedido nesta situação.</p>}
        {pedidos.dados && pedidos.dados.length > 0 && (
          <div className={styles.rolagem}>
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th scope="col">Filme (TMDB)</th>
                  <th scope="col">Cinema</th>
                  <th scope="col">Pedido por</th>
                  <th scope="col">Em</th>
                  <th scope="col">Decisão</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.dados.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.titulo}</strong> {p.ano ? `(${p.ano})` : ''}
                    </td>
                    <td>{p.cinemaNome}</td>
                    <td>{p.solicitadoPor ?? '—'}</td>
                    <td>{dataCompleta(p.criadoEm)}</td>
                    <td>
                      {p.status === 'AGUARDANDO_ADMIN' ? (
                        <Decisao pedido={p} acao={acao} onDecidido={pedidos.recarregar} />
                      ) : (
                        <>
                          {NOME_DA_SITUACAO_DO_PEDIDO[p.status]}
                          {p.motivoRecusa && `: ${p.motivoRecusa}`}
                          {p.decididoEm && <div className={styles.dica}>em {dataCompleta(p.decididoEm)}</div>}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className={styles.dica}>
          Aprovar busca a ficha completa no TMDB e envia o filme para o cinema que pediu. O gerente ainda confirma na
          programação dele.
        </p>
      </div>
    </section>
  )
}

interface DecisaoProps {
  pedido: PedidoDeFilme
  acao: Acao
  onDecidido: () => void
}

function Decisao({ pedido, acao, onDecidido }: DecisaoProps) {
  const [motivo, setMotivo] = useState('')

  async function decidir(chamada: () => Promise<string>) {
    if (await acao.executar(chamada)) {
      onDecidido()
    }
  }

  return (
    <div className={styles.acoes} style={{ alignItems: 'center' }}>
      <button
        type="button"
        className={styles.botaoPrincipal}
        disabled={acao.enviando}
        aria-label={`Aprovar ${pedido.titulo}`}
        onClick={() =>
          void decidir(async () => {
            await aprovarPedido(pedido.id)
            return `${pedido.titulo} aprovado e enviado ao ${pedido.cinemaNome}. O gerente confirma na programação.`
          })
        }
      >
        Aprovar
      </button>
      <label className={styles.campo} style={{ flex: '1 1 160px' }}>
        <span className="visually-hidden">Motivo da recusa de {pedido.titulo}</span>
        <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo da recusa" />
      </label>
      <button
        type="button"
        className={styles.botao}
        disabled={acao.enviando}
        aria-label={`Recusar ${pedido.titulo}`}
        onClick={() =>
          void decidir(async () => {
            await recusarPedido(pedido.id, motivo.trim())
            return `Pedido de ${pedido.titulo} recusado.`
          })
        }
      >
        Recusar
      </button>
    </div>
  )
}
