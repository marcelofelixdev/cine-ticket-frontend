import { Link, Route, Routes } from 'react-router'
import { LoginPage } from './painel/LoginPage'
import { PainelLayout } from './painel/PainelLayout'
import { PainelInicio, SecaoPage } from './painel/SecaoPage'
import { SiteProvisorio } from './site/SiteProvisorio'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<SiteProvisorio />} />
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
