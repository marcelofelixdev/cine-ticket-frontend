import { useState } from 'react'
import { diaMes, hora, moeda, NOME_DA_FORMA } from '../../lib/formato'
import { mensagemDeErro } from '../../lib/erros'
import { useCarregar } from '../../lib/useCarregar'
import { ConfirmarEmDoisPassos } from '../comum/ConfirmarEmDoisPassos'
import styles from '../Painel.module.css'
import { confirmarDevolucao, devolucoesPendentes, type Devolucao } from './caixaApi'

/** Vendas de balcão de sessões canceladas: o cliente volta ao caixa e recebe o valor. */
export function DevolucoesPage() {
  const pendentes = useCarregar((signal) => devolucoesPendentes(signal), 'pendentes')
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  async function confirmar(devolucao: Devolucao) {
    setErro(null)
    try {
      await confirmarDevolucao(devolucao.ticketId)
      setMensagem(`Devolução de ${moeda(devolucao.valor)} do lugar ${devolucao.assento} registrada.`)
      pendentes.recarregar()
    } catch (e) {
      setErro(mensagemDeErro(e))
    }
  }

  return (
    <section className={styles.janela} aria-labelledby="devolucoes">
      <h1 id="devolucoes" className={styles.janelaTitulo}>
        Devoluções pendentes no caixa
      </h1>
      <div className={styles.janelaCorpo}>
        <p className={styles.dica}>
          Ingressos vendidos no balcão para sessões canceladas. Devolva o valor ao cliente, de preferência na mesma forma
          de pagamento, e confirme aqui.
        </p>
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
        {pendentes.erro && <p className={styles.alerta}>{pendentes.erro}</p>}
        {pendentes.dados?.length === 0 && <p>Nenhuma devolução pendente.</p>}
        {pendentes.dados && pendentes.dados.length > 0 && (
          <div className={styles.rolagem}>
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th scope="col">Ingresso</th>
                  <th scope="col">Filme e sessão</th>
                  <th scope="col">Lugar</th>
                  <th scope="col">Pago com</th>
                  <th scope="col">Valor</th>
                  <th scope="col">Cliente</th>
                  <th scope="col">
                    <span className="visually-hidden">Ação</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pendentes.dados.map((d) => (
                  <tr key={d.ticketId}>
                    <td>#{d.ticketId}</td>
                    <td>
                      {d.filmeTitulo} · {diaMes(d.horarioSessao)} {hora(d.horarioSessao)} · {d.salaNome}
                    </td>
                    <td>{d.assento}</td>
                    <td>{NOME_DA_FORMA[d.formaPagamento]}</td>
                    <td>{moeda(d.valor)}</td>
                    <td>{d.clienteEmail ?? '(sem e-mail)'}</td>
                    <td>
                      <ConfirmarEmDoisPassos
                        rotulo="Confirmar devolução"
                        confirmar={`Devolvi ${moeda(d.valor)}`}
                        onConfirmar={() => confirmar(d)}
                      />
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
