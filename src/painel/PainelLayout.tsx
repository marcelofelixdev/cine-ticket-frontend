import { useEffect, useState } from 'react'
import { Navigate, NavLink, Outlet, useLocation } from 'react-router'
import { apiFetch } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { menuDoPainel, NOME_DO_PAPEL, papelDoPainel } from '../auth/papeis'
import type { Usuario } from '../auth/types'
import { Logo } from '../components/Logo'
import styles from './Painel.module.css'

/** Estrutura do painel: só entra quem é funcionário, gerente ou admin. */
export function PainelLayout() {
  const { sessao, sair } = useAuth()
  const location = useLocation()

  if (sessao.status === 'carregando') {
    return (
      <div className={styles.painel}>
        <p className={styles.conteudo} role="status">
          Carregando…
        </p>
      </div>
    )
  }
  if (sessao.status === 'anonimo') {
    return <Navigate to="/painel/login" replace state={{ de: location.pathname }} />
  }

  const papel = papelDoPainel(sessao.usuario.roles)
  if (!papel) {
    return (
      <main className={styles.login}>
        <section className={styles.loginJanela} aria-labelledby="sem-acesso">
          <h1 id="sem-acesso" className={styles.janelaTitulo}>
            Sem acesso ao painel
          </h1>
          <div className={styles.janelaCorpo}>
            <p>O painel é só para a equipe dos cinemas. Sua conta é de cliente.</p>
            <button type="button" className={styles.botao} onClick={() => void sair()}>
              Sair
            </button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <div className={styles.painel}>
      <header className={styles.topo}>
        <Logo className={styles.logo} />
        <Local usuario={sessao.usuario} />
        <span className={styles.espaco} />
        <span className={styles.usuario}>
          {NOME_DO_PAPEL[papel]}: {sessao.usuario.nome}
        </span>
        <button type="button" className={styles.botao} onClick={() => void sair()}>
          Sair
        </button>
      </header>
      <nav className={styles.abas} aria-label="Painel">
        {menuDoPainel(papel).map((item) => (
          <NavLink
            key={item.secao}
            to={`/painel/${item.secao}`}
            className={({ isActive }) => (isActive ? styles.abaAtiva : styles.aba)}
          >
            {item.rotulo}
          </NavLink>
        ))}
      </nav>
      <main className={styles.conteudo}>
        <Outlet />
      </main>
      <footer className={styles.rodape}>
        <span>Conectado como {sessao.usuario.email}</span>
      </footer>
    </div>
  )
}

/** Nome do cinema do funcionário ou gerente; o admin vê a rede toda. */
function Local({ usuario }: { usuario: Usuario }) {
  const [nome, setNome] = useState<string | null>(null)

  useEffect(() => {
    if (usuario.cinemaId === null) {
      return
    }
    const controller = new AbortController()
    apiFetch<{ nome: string }>(`/cinemas/${usuario.cinemaId}`, { signal: controller.signal })
      .then((cinema) => setNome(cinema.nome))
      .catch(() => setNome(null))
    return () => controller.abort()
  }, [usuario.cinemaId])

  const texto = usuario.cinemaId === null ? 'Rede' : nome ?? 'Cinema'
  return <span className={styles.local}>Painel · {texto}</span>
}
