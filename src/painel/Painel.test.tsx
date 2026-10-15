import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { setAccessToken } from '../api/client'
import { AppRoutes } from '../AppRoutes'
import { AuthProvider } from '../auth/AuthProvider'
import type { Usuario } from '../auth/types'
import { fakeApi, json, type Rota } from '../test/fakeApi'

const semSessao: Rota = () => json({ title: 'Não autenticado' }, 401)
const token: Rota = () => json({ token: 'tk', expiresIn: 900 })

function usuario(roles: string[], cinemaId: number | null = 1): Usuario {
  return { id: 7, nome: 'Ana Souza', email: 'ana@cinema.dev', roles, dataNascimento: null, cinemaId }
}

function abrir(caminho: string) {
  render(
    <MemoryRouter initialEntries={[caminho]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  )
}

afterEach(() => {
  setAccessToken(null)
  vi.unstubAllGlobals()
  sessionStorage.clear()
})

describe('painel', () => {
  it('sem sessão manda para o login', async () => {
    fakeApi({ 'POST /auth/refresh': semSessao })

    abrir('/painel/sessoes')

    expect(await screen.findByRole('heading', { name: 'Painel da equipe' })).toBeInTheDocument()
  })

  it('login do funcionário abre o caixa e mostra só as abas dele', async () => {
    fakeApi({
      'POST /auth/refresh': semSessao,
      'POST /auth/login': token,
      'GET /users/me': () => json(usuario(['ROLE_STAFF'])),
      'GET /cinemas/1': () => json({ id: 1, nome: 'Cine Paulista' }),
      'GET /box-office/sessions': () => json([]),
    })
    abrir('/painel')

    await userEvent.type(await screen.findByLabelText('E-mail'), 'ana@cinema.dev')
    await userEvent.type(screen.getByLabelText('Senha'), 'segredo123')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('heading', { name: /^Sessões · / })).toBeInTheDocument()
    const abas = screen.getAllByRole('link').map((a) => a.textContent)
    expect(abas).toEqual(['Caixa', 'Devoluções', 'Entrada (validar QR)'])
    expect(await screen.findByText('Painel · Cine Paulista')).toBeInTheDocument()
  })

  it('senha errada mostra o aviso sem detalhes', async () => {
    fakeApi({
      'POST /auth/refresh': semSessao,
      'POST /auth/login': () => json({ title: 'Não autenticado', detail: 'Bad credentials' }, 401),
    })
    abrir('/painel/login')

    await userEvent.type(await screen.findByLabelText('E-mail'), 'ana@cinema.dev')
    await userEvent.type(screen.getByLabelText('Senha'), 'errada')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.')
  })

  it('sessão salva no cookie volta ao recarregar a página', async () => {
    fakeApi({
      'POST /auth/refresh': token,
      'GET /users/me': () => json(usuario(['ROLE_ADMIN'], null)),
    })

    abrir('/painel')

    expect(await screen.findByRole('heading', { name: 'Pedidos de filme' })).toBeInTheDocument()
    expect(screen.getByLabelText('Cinema em que você está')).toHaveValue('')
  })

  it('admin entra num cinema: abas do cinema e chamadas com o cinemaId', async () => {
    const api = fakeApi({
      'POST /auth/refresh': token,
      'GET /users/me': () => json(usuario(['ROLE_ADMIN'], null)),
      'GET /cinemas': () =>
        json({
          content: [{ id: 2, nome: 'Cine Copacabana', cnpj: '1', endereco: 'Rua', cidade: 'Rio de Janeiro', uf: 'RJ' }],
          page: { size: 100, number: 0, totalElements: 1, totalPages: 1 },
        }),
      'GET /admin/movie-requests': () => json([]),
      'GET /manager/sessions': () => json([]),
      'GET /manager/programacao': () => json([]),
      'GET /manager/rooms': () => json([]),
    })

    abrir('/painel')
    await screen.findByRole('option', { name: 'Cine Copacabana' })
    await userEvent.selectOptions(screen.getByLabelText('Cinema em que você está'), '2')

    const abas = screen.getByRole('navigation', { name: 'Painel' })
    expect(abas).toHaveTextContent('SessõesProgramaçãoIngressos')
    await userEvent.click(screen.getByRole('link', { name: 'Sessões' }))
    expect(await screen.findByText('Nenhuma sessão neste dia.', { exact: false })).toBeInTheDocument()
    const urls = api.mock.calls.map(([url]) => String(url))
    expect(urls.some((u) => u.includes('/manager/sessions?date=') && u.endsWith('&cinemaId=2'))).toBe(true)
    expect(urls).toContain('/api/v1/manager/rooms?cinemaId=2')

    // Voltar para a rede devolve as abas do admin.
    await userEvent.selectOptions(screen.getByLabelText('Cinema em que você está'), '')
    expect(await screen.findByRole('heading', { name: 'Pedidos de filme' })).toBeInTheDocument()
  })

  it('seção de outro papel volta para o início do painel', async () => {
    fakeApi({
      'POST /auth/refresh': token,
      'GET /users/me': () => json(usuario(['ROLE_ADMIN'], null)),
    })

    abrir('/painel/caixa')

    expect(await screen.findByRole('heading', { name: 'Pedidos de filme' })).toBeInTheDocument()
  })

  it('cliente logado não entra', async () => {
    fakeApi({
      'POST /auth/refresh': token,
      'GET /users/me': () => json(usuario(['ROLE_USER'], null)),
    })

    abrir('/painel')

    expect(await screen.findByRole('heading', { name: 'Sem acesso ao painel' })).toBeInTheDocument()
  })
})
