import { hora, versao } from '../../lib/formato'
import styles from '../Painel.module.css'
import caixa from './Caixa.module.css'
import type { SessaoDoDia } from '../comum/sessaoDoDia'

interface Props {
  sessoes: SessaoDoDia[]
  selecionada: number | null
  onEscolher: (id: number) => void
}

export function SessoesDoDia({ sessoes, selecionada, onEscolher }: Props) {
  if (sessoes.length === 0) {
    return <p className={styles.dica}>Nenhuma sessão neste dia.</p>
  }
  return (
    <div className={styles.rolagem}>
      <table className={styles.tabela}>
        <thead>
          <tr>
            <th scope="col">Hora</th>
            <th scope="col">Filme</th>
            <th scope="col">Sala</th>
            <th scope="col">Livres</th>
          </tr>
        </thead>
        <tbody>
          {sessoes.map((sessao) => (
            <tr key={sessao.id} className={sessao.id === selecionada ? caixa.linhaSelecionada : undefined}>
              <td>
                <button
                  type="button"
                  className={caixa.horario}
                  aria-pressed={sessao.id === selecionada}
                  aria-label={`${hora(sessao.horarioInicio)}, ${sessao.movieTitulo}`}
                  onClick={() => onEscolher(sessao.id)}
                >
                  {hora(sessao.horarioInicio)}
                </button>{' '}
                <span>{versao(sessao.formato, sessao.audio)}</span>
                {!sessao.vendasAbertas && <div className={caixa.encerrada}>vendas encerradas</div>}
              </td>
              <td>{sessao.movieTitulo}</td>
              <td>{sessao.roomNome}</td>
              <td>
                {sessao.lugares - sessao.ocupados}/{sessao.lugares}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
