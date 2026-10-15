import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { papelDoPainel } from '../auth/papeis'
import { Logo } from '../components/Logo'
import { errosPorCampo } from '../lib/erros'
import styles from './Painel.module.css'

interface DestinoAnterior {
  de?: string
}

export function LoginPage() {
  const { sessao, entrar } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [errosDosCampos, setErrosDosCampos] = useState<Record<string, string>>({})

  const destino = (location.state as DestinoAnterior | null)?.de ?? '/painel'

  if (sessao.status === 'logado' && papelDoPainel(sessao.usuario.roles)) {
    return <Navigate to={destino} replace />
  }

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setEnviando(true)
    setErro(null)
    setErrosDosCampos({})
    try {
      await entrar(email.trim(), senha)
      navigate(destino, { replace: true })
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setErro('E-mail ou senha incorretos.')
      } else if (e instanceof ApiError) {
        setErro(e.message)
        setErrosDosCampos(errosPorCampo(e))
      } else {
        setErro('Não foi possível falar com o servidor. Tente de novo.')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className={styles.login}>
      <div className={styles.loginJanela}>
        <div className={styles.loginMarca}>
          <Logo className={styles.logo} />
        </div>
        <h1 className={styles.janelaTitulo}>Painel da equipe</h1>
        <form className={styles.janelaCorpo} onSubmit={enviar} noValidate>
          {erro && (
            <p className={styles.alerta} role="alert">
              {erro}
            </p>
          )}
          <label className={styles.campo}>
            E-mail
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(errosDosCampos.email)}
            />
            {errosDosCampos.email && <span className={styles.erroDoCampo}>{errosDosCampos.email}</span>}
          </label>
          <label className={styles.campo}>
            Senha
            <input
              type="password"
              autoComplete="current-password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              aria-invalid={Boolean(errosDosCampos.senha)}
            />
            {errosDosCampos.senha && <span className={styles.erroDoCampo}>{errosDosCampos.senha}</span>}
          </label>
          <button type="submit" className={styles.botaoPrincipal} disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  )
}
