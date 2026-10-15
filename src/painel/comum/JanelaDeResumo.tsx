import { hora, moeda, NOME_DA_FORMA } from '../../lib/formato'
import type { FormaPagamento } from '../../lib/tipos'
import { useCarregar } from '../../lib/useCarregar'
import styles from '../Painel.module.css'
import type { ResumoDaSessao } from './painelApi'

interface Props {
  id: number
  /** GET /manager/sessions/{id}/summary ou /admin/sessions/{id}/summary. */
  buscar: (id: number, signal: AbortSignal) => Promise<ResumoDaSessao>
}

/** Ocupação, meias, entradas e receita de uma sessão, como a API calcula. */
export function JanelaDeResumo({ id, buscar }: Props) {
  const resumo = useCarregar((signal) => buscar(id, signal), String(id))
  const r = resumo.dados
  return (
    <section className={styles.janela} aria-labelledby="resumo">
      <h2 id="resumo" className={styles.janelaTitulo}>
        {r ? `Resumo · ${r.filmeTitulo} · ${hora(r.horarioSessao)} · ${r.salaNome}` : 'Resumo da sessão'}
      </h2>
      <div className={styles.janelaCorpo}>
        {resumo.erro && <p className={styles.alerta}>{resumo.erro}</p>}
        {r && (
          <table className={styles.tabela}>
            <tbody>
              <tr>
                <th scope="row">Lugares</th>
                <td>
                  {r.lugares} · {r.vendidos} vendidos · {r.reservados} reservados · {r.livres} livres
                </td>
              </tr>
              <tr>
                <th scope="row">Meias</th>
                <td>{r.meias}</td>
              </tr>
              <tr>
                <th scope="row">Entradas na sala</th>
                <td>{r.entradas}</td>
              </tr>
              <tr>
                <th scope="row">Receita</th>
                <td>
                  {moeda(r.receitaTotal)} (online {moeda(r.receitaOnline)}, balcão {moeda(r.receitaBalcao)})
                </td>
              </tr>
              <tr>
                <th scope="row">Balcão por forma</th>
                <td>
                  {Object.entries(r.receitaBalcaoPorForma)
                    .map(([forma, valor]) => `${NOME_DA_FORMA[forma as FormaPagamento]} ${moeda(valor ?? 0)}`)
                    .join(' · ') || '—'}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}
