import styles from '../Painel.module.css'
import { CampoDeTexto } from './CampoDeTexto'
import { NOME_DO_PAPEL_DA_EQUIPE, type DadosDeAcesso, type MembroDaEquipe } from './painelApi'

interface TabelaProps {
  membros: MembroDaEquipe[]
  /** Mostra a coluna Cinema (lista da rede). */
  comCinema?: boolean
}

export function TabelaDeEquipe({ membros, comCinema = false }: TabelaProps) {
  if (membros.length === 0) {
    return <p>Ninguém cadastrado.</p>
  }
  return (
    <div className={styles.rolagem}>
      <table className={styles.tabela}>
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">E-mail</th>
            <th scope="col">Papel</th>
            {comCinema && <th scope="col">Cinema</th>}
          </tr>
        </thead>
        <tbody>
          {membros.map((m) => (
            <tr key={m.id}>
              <td>{m.nome}</td>
              <td>{m.email}</td>
              <td>{NOME_DO_PAPEL_DA_EQUIPE[m.papel]}</td>
              {comCinema && <td>{m.cinemaNome}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface CamposProps {
  dados: DadosDeAcesso
  onMudar: (dados: DadosDeAcesso) => void
  /** Erros da API por campo (422). */
  erros: Record<string, string>
}

/** Nome, e-mail e senha inicial; as regras (tamanho da senha, e-mail único) ficam na API. */
export function CamposDeAcesso({ dados, onMudar, erros }: CamposProps) {
  return (
    <>
      <CampoDeTexto rotulo="Nome" valor={dados.nome} onMudar={(nome) => onMudar({ ...dados, nome })} erro={erros.nome} />
      <CampoDeTexto
        rotulo="E-mail"
        type="email"
        valor={dados.email}
        onMudar={(email) => onMudar({ ...dados, email })}
        erro={erros.email}
      />
      <CampoDeTexto
        rotulo="Senha inicial"
        type="password"
        autoComplete="new-password"
        valor={dados.senha}
        onMudar={(senha) => onMudar({ ...dados, senha })}
        erro={erros.senha}
      />
    </>
  )
}
