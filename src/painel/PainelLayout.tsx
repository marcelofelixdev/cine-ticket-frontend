import { useEffect, useState } from 'react'
import { Navigate, NavLink, Outlet, useLocation } from 'react-router'
import { apiFetch } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { menuDoPainel, NOME_DO_PAPEL, papelDoPainel, visaoDoPainel } from '../auth/papeis'
import type { Usuario } from '../auth/types'
import { Logo } from '../components/Logo'
import { useCarregar } from '../lib/useCarregar'
import { todosOsCinemas } from './admin/adminApi'
import { EscopoContext, guardarCinema, lerCinemaGuardado } from './escopo'
import styles from './Painel.module.css'

/** Estrutura do painel: só entra quem é funcionário, gerente ou admin. */
export function PainelLayout() {
  const { sessao, sair } = useAuth()
  const location = useLocation()
  const [cinemaEscolhido, setCinemaEscolhido] = useState<number | null>(lerCinemaGuardado)

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

  // Só o admin escolhe cinema; para os outros a API usa o cinema do usuário.
  const cinemaId = papel === 'ADMIN' ? cinemaEscolhido : null
  const visao = visaoDoPainel(papel, cinemaId)

  function escolherCinema(id: number | null) {
    guardarCinema(id)
    setCinemaEscolhido(id)
  }

  return (
    <EscopoContext.Provider value={{ visao, cinemaId }}>
      <div className={styles.painel}>
        <header className={styles.topo}>
          <Logo className={styles.logo} />
          {papel === 'ADMIN' ? (
            <SeletorDeCinema cinemaId={cinemaId} onEscolher={escolherCinema} />
          ) : (
            <Local usuario={sessao.usuario} />
          )}
          <span className={styles.espaco} />
          <span className={styles.usuario}>
            {NOME_DO_PAPEL[papel]}: {sessao.usuario.nome}
          </span>
          <button type="button" className={styles.botao} onClick={() => void sair()}>
            Sair
          </button>
        </header>
        <nav className={styles.abas} aria-label="Painel">
          {menuDoPainel(visao).map((item) => (
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
          {/* Trocar de cinema remonta a tela, que busca tudo de novo no cinema novo. */}
          <Outlet key={cinemaId ?? 'rede'} />
        </main>
        <footer className={styles.rodape}>
          <span>Conectado como {sessao.usuario.email}</span>
        </footer>
      </div>
    </EscopoContext.Provider>
  )
}

interface SeletorProps {
  cinemaId: number | null
  onEscolher: (cinemaId: number | null) => void
}

/** O admin vê a rede toda ou entra num cinema para operar sessões, programação e ingressos. */
function SeletorDeCinema({ cinemaId, onEscolher }: SeletorProps) {
  const rede = useCarregar((signal) => todosOsCinemas(signal), 'cinemas')
  return (
    <label className={styles.local}>
      Painel ·{' '}
      <select
        className={styles.seletorDeCinema}
        value={cinemaId ?? ''}
        onChange={(e) => onEscolher(e.target.value ? Number(e.target.value) : null)}
        aria-label="Cinema em que você está"
      >
        <option value="">Rede toda</option>
        {rede.dados?.content.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nome}
          </option>
        ))}
      </select>
    </label>
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
