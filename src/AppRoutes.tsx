import { Link, Route, Routes } from 'react-router'
import { LoginPage } from './painel/LoginPage'
import { PainelLayout } from './painel/PainelLayout'
import { PainelInicio, SecaoPage } from './painel/SecaoPage'
import { EmConstrucao } from './site/EmConstrucao'
import { HomePage } from './site/home/HomePage'
import { SiteLayout } from './site/SiteLayout'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="filmes/:id" element={<EmConstrucao titulo="Ficha do filme" />} />
        <Route path="sessoes/:id" element={<EmConstrucao titulo="Escolha dos lugares" />} />
        <Route path="entrar" element={<EmConstrucao titulo="Entrar" />} />
        <Route path="meus-ingressos" element={<EmConstrucao titulo="Meus ingressos" />} />
      </Route>
      <Route path="/painel/login" element={<LoginPage />} />
      <Route path="/painel" element={<PainelLayout />}>
        <Route index element={<PainelInicio />} />
        <Route path=":secao" element={<SecaoPage />} />
      </Route>
      <Route path="*" element={<NaoEncontrada />} />
    </Routes>
  )
}

function NaoEncontrada() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Página não encontrada</h1>
      <Link to="/">Voltar para o início</Link>
    </main>
  )
}
