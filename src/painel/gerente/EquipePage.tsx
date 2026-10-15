import { useState, type FormEvent } from 'react'
import { errosPorCampo, mensagemDeErro } from '../../lib/erros'
import { useCarregar } from '../../lib/useCarregar'
import styles from '../Painel.module.css'
import { cadastrarFuncionario, equipe } from './gerenteApi'

const PAPEL = { MANAGER: 'Gerente', STAFF: 'Funcionário' } as const

/** Funcionários do cinema do gerente; o gerente só cadastra funcionários do próprio cinema. */
export function EquipePage() {
  const membros = useCarregar((signal) => equipe(signal), 'equipe')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [erros, setErros] = useState<Record<string, string>>({})

  async function cadastrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setEnviando(true)
    setErro(null)
    setErros({})
    setMensagem(null)
    try {
      const novo = await cadastrarFuncionario({ nome: nome.trim(), email: email.trim(), senha })
      setMensagem(`${novo.nome} cadastrado. Passe o e-mail e a senha para ele entrar no painel.`)
      setNome('')
      setEmail('')
      setSenha('')
      membros.recarregar()
    } catch (e) {
      setErro(mensagemDeErro(e))
      setErros(errosPorCampo(e))
    } finally {
      setEnviando(false)
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
          {membros.dados && (
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th scope="col">Nome</th>
                  <th scope="col">E-mail</th>
                  <th scope="col">Papel</th>
                </tr>
              </thead>
              <tbody>
                {membros.dados.map((m) => (
                  <tr key={m.id}>
                    <td>{m.nome}</td>
                    <td>{m.email}</td>
                    <td>{PAPEL[m.papel]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
      <section className={`${styles.janela} ${styles.colunaEstreita}`} aria-labelledby="novo-funcionario">
        <h2 id="novo-funcionario" className={styles.janelaTitulo}>
          Novo funcionário
        </h2>
        <form className={`${styles.janelaCorpo} ${styles.formulario}`} onSubmit={cadastrar} noValidate>
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
          <label className={styles.campo}>
            Nome
            <input value={nome} onChange={(e) => setNome(e.target.value)} />
            {erros.nome && <span className={styles.erroDoCampo}>{erros.nome}</span>}
          </label>
          <label className={styles.campo}>
            E-mail
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            {erros.email && <span className={styles.erroDoCampo}>{erros.email}</span>}
          </label>
          <label className={styles.campo}>
            Senha inicial
            <input type="password" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
            {erros.senha && <span className={styles.erroDoCampo}>{erros.senha}</span>}
          </label>
          <button type="submit" className={styles.botaoPrincipal} disabled={enviando}>
            {enviando ? 'Cadastrando…' : 'Cadastrar funcionário'}
          </button>
        </form>
      </section>
    </div>
  )
}
