import { useState, type FormEvent } from 'react'
import { useCarregar } from '../../lib/useCarregar'
import { Avisos } from '../comum/Avisos'
import { CamposDeAcesso, TabelaDeEquipe } from '../comum/Equipe'
import { ACESSO_VAZIO } from '../comum/painelApi'
import { useAcao } from '../../lib/useAcao'
import styles from '../Painel.module.css'
import { cadastrarFuncionario, equipe } from './gerenteApi'

/** Funcionários do cinema do gerente; o gerente só cadastra funcionários do próprio cinema. */
export function EquipePage() {
  const membros = useCarregar((signal) => equipe(signal), 'equipe')
  const [dados, setDados] = useState(ACESSO_VAZIO)
  const acao = useAcao()

  async function cadastrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const ok = await acao.executar(async () => {
      const novo = await cadastrarFuncionario({ ...dados, nome: dados.nome.trim(), email: dados.email.trim() })
      return `${novo.nome} cadastrado. Passe o e-mail e a senha para ele entrar no painel.`
    })
    if (ok) {
      setDados(ACESSO_VAZIO)
      membros.recarregar()
    }
  }

  return (
    <div className={styles.colunas}>
      <section className={`${styles.janela} ${styles.colunaLarga}`} aria-labelledby="equipe">
        <h1 id="equipe" className={styles.janelaTitulo}>
          Equipe do cinema
        </h1>
        <div className={styles.janelaCorpo}>
          {membros.erro && <p className={styles.alerta}>{membros.erro}</p>}
          {membros.dados && <TabelaDeEquipe membros={membros.dados} />}
        </div>
      </section>
      <section className={`${styles.janela} ${styles.colunaEstreita}`} aria-labelledby="novo-funcionario">
        <h2 id="novo-funcionario" className={styles.janelaTitulo}>
          Novo funcionário
        </h2>
        <form className={`${styles.janelaCorpo} ${styles.formulario}`} onSubmit={cadastrar} noValidate>
          <Avisos sucesso={acao.sucesso} erro={acao.erro} />
          <CamposDeAcesso dados={dados} onMudar={setDados} erros={acao.erros} />
          <button type="submit" className={styles.botaoPrincipal} disabled={acao.enviando}>
            {acao.enviando ? 'Cadastrando…' : 'Cadastrar funcionário'}
          </button>
        </form>
      </section>
    </div>
  )
}
