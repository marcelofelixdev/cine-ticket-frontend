import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { setAccessToken } from '../api/client'
import { AppRoutes } from '../AppRoutes'
import { AuthProvider } from '../auth/AuthProvider'
import { hoje, somarDias } from '../lib/formato'
import { fakeApi, json } from '../test/fakeApi'

const pagina = <T,>(content: T[]) => json({ content, page: { size: 50, number: 0, totalElements: content.length, totalPages: 1 } })

const filme = (id: number, titulo: string, extra: object = {}) => ({
  id,
  titulo,
  tituloOriginal: null,
  sinopse: `Sinopse de ${titulo}.`,
  posterUrl: null,
  backdropUrl: null,
  duracaoEmMinutos: 166,
  classificacao: '14',
  generos: ['Ficção científica'],
  diretor: 'Denis Villeneuve',
  elenco: [
    { nome: 'Zendaya', personagem: 'Chani', fotoUrl: 'https://image.tmdb.org/t/p/w185/zendaya.jpg' },
    { nome: 'Josh Brolin', personagem: 'Gurney Halleck', fotoUrl: null },
  ],
  produtora: 'Legendary',
  trailerUrl: null,
  dataEstreia: null,
  ...extra,
})

const sessao = (id: number, movieId: number, titulo: string, horario: string, formato = '2D', audio = 'LEGENDADO') => ({
  id,
  horarioInicio: `${hoje()}T${horario}:00`,
  valorBase: 42,
  valorMeia: 21,
  movieId,
  movieTitulo: titulo,
  roomNome: 'Sala 1',
  cinemaId: 1,
  cinemaNome: 'Cine Paulista',
  formato,
  audio,
  lugaresLivres: 100,
  meiasRestantes: 40,
})

function abrir() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  )
}

afterEach(() => {
  setAccessToken(null)
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe('vitrine', () => {
  function api() {
    return fakeApi({
      'POST /auth/refresh': () => json({ title: 'Não autenticado' }, 401),
      'GET /cinemas/cidades': () =>
        json([
          { cidade: 'Rio de Janeiro', uf: 'RJ' },
          { cidade: 'São Paulo', uf: 'SP' },
        ]),
      'GET /cinemas': () =>
        pagina([{ id: 1, nome: 'Cine Paulista', endereco: 'Av. Paulista, 1000', cidade: 'São Paulo', uf: 'SP' }]),
      'GET /movies': () => pagina([filme(3, 'Duna: Parte Dois'), filme(4, 'Ainda Estou Aqui', { classificacao: '12' })]),
      'GET /sessions': () =>
        pagina([sessao(10, 3, 'Duna: Parte Dois', '18:00', '3D', 'DUBLADO'), sessao(11, 3, 'Duna: Parte Dois', '21:15')]),
      'GET /movies/em-breve': () => pagina([filme(9, 'Filme do Mês Que Vem', { dataEstreia: '2099-11-06' })]),
    })
  }

  it('mostra o cinema escolhido, os horários da API e o que vem em breve', async () => {
    api()
    abrir()

    expect(await screen.findByRole('heading', { name: 'Em cartaz no Cine Paulista' })).toBeInTheDocument()
    const quadro = screen.getByRole('region', { name: 'Hoje, sessão por sessão' })
    expect(await within(quadro).findByRole('link', { name: 'Duna: Parte Dois às 18:00, 3D DUB' })).toHaveAttribute(
      'href',
      '/sessoes/10',
    )
    // Filme sem sessão no dia continua na grade.
    expect(screen.getByText('Sem sessões neste dia')).toBeInTheDocument()
    expect(screen.getByText('Filme do Mês Que Vem')).toBeInTheDocument()
    expect(screen.getByText('Estreia 06/11')).toBeInTheDocument()
    expect(screen.getByText(/não é endossado nem certificado pelo TMDB/)).toBeInTheDocument()
    // Rolo: o primeiro destaque é o filme com sessão no dia.
    expect(screen.getByRole('button', { name: 'Destacar Duna: Parte Dois' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('filtros, dia e cidade vão para a API', async () => {
    const chamadas = api()
    abrir()
    await screen.findByRole('heading', { name: 'Em cartaz no Cine Paulista' })
    const urls = () => chamadas.mock.calls.map(([url]) => String(url))

    await userEvent.click(screen.getByRole('button', { name: '3D' }))
    expect(urls().some((u) => u.includes('/movies?cinemaId=1&formato=3D'))).toBe(true)
    expect(urls().some((u) => u.includes(`/sessions?cinemaId=1&date=${hoje()}&formato=3D`))).toBe(true)

    const amanha = somarDias(hoje(), 1)
    const botoesDoDia = within(screen.getByRole('group', { name: 'Escolha o dia' })).getAllByRole('button')
    await userEvent.click(botoesDoDia[1])
    expect(urls().some((u) => u.includes(`date=${amanha}`))).toBe(true)

    await userEvent.selectOptions(screen.getByLabelText('Cidade'), 'Rio de Janeiro/RJ')
    expect(urls().some((u) => u.includes('/cinemas?cidade=Rio+de+Janeiro'))).toBe(true)
  })
})

describe('ficha do filme', () => {
  it('mostra a ficha, o trailer e as sessões de cada cinema da cidade', async () => {
    const api = fakeApi({
      'POST /auth/refresh': () => json({ title: 'Não autenticado' }, 401),
      'GET /cinemas/cidades': () => json([{ cidade: 'São Paulo', uf: 'SP' }]),
      'GET /cinemas': () =>
        pagina([{ id: 1, nome: 'Cine Paulista', endereco: 'Av. Paulista, 1000', cidade: 'São Paulo', uf: 'SP' }]),
      'GET /movies/3': () =>
        json(
          filme(3, 'Duna: Parte Dois', {
            tituloOriginal: 'Dune: Part Two',
            trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
            dataEstreia: '2024-02-29',
          }),
        ),
      'GET /sessions': () => pagina([{ ...sessao(10, 3, 'Duna: Parte Dois', '18:00', '3D', 'DUBLADO'), lugaresLivres: 8 }]),
    })
    render(
      <MemoryRouter initialEntries={['/filmes/3']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { level: 1, name: 'Duna: Parte Dois' })).toBeInTheDocument()
    expect(screen.getByText('Em cartaz desde 29/02/2024')).toBeInTheDocument()
    expect(screen.getByText('Chani')).toBeInTheDocument()
    // Com foto, a imagem; sem foto, as iniciais.
    const elenco = screen.getByRole('region', { name: 'Elenco principal' })
    expect(elenco.querySelector('img')).toHaveAttribute('src', 'https://image.tmdb.org/t/p/w185/zendaya.jpg')
    expect(within(elenco).getByText('JB')).toBeInTheDocument()

    const sessao10 = await screen.findByRole('link', { name: /18:00/ })
    expect(sessao10).toHaveAttribute('href', '/sessoes/10')
    expect(sessao10).toHaveTextContent('Últimos 8 lugares · 40 meias')
    // Uma chamada só, filtrada pela cidade na API.
    const sessoes = api.mock.calls.map(([url]) => String(url)).filter((u) => u.includes('/sessions?'))
    expect(sessoes).toEqual([`/api/v1/sessions?movieId=3&cidade=S%C3%A3o+Paulo&date=${hoje()}&size=200`])

    await userEvent.click(screen.getByRole('button', { name: 'Assistir ao trailer' }))
    expect(screen.getByTitle('Trailer de Duna: Parte Dois')).toHaveAttribute(
      'src',
      'https://www.youtube-nocookie.com/embed/Way9Dexny3w?autoplay=1',
    )
  })
})
