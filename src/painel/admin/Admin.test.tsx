import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { chamadas, fakeApi, json, ultimoCorpo } from '../../test/fakeApi'
import { CinemasPage } from './CinemasPage'
import { EquipePage } from './EquipePage'
import { FilmesPage } from './FilmesPage'
import { IngressosPage } from './IngressosPage'
import { PedidosPage } from './PedidosPage'

afterEach(() => vi.unstubAllGlobals())

const pagina = <T,>(content: T[]) => json({ content, page: { size: 20, number: 0, totalElements: content.length, totalPages: 1 } })

const paulista = { id: 1, nome: 'Cine Paulista', cnpj: '12345678000199', endereco: 'Av. Paulista, 1000', cidade: 'São Paulo', uf: 'SP' }
const copacabana = { id: 2, nome: 'Cine Copacabana', cnpj: '98765432000111', endereco: 'Av. Atlântica, 500', cidade: 'Rio de Janeiro', uf: 'RJ' }
const urls = (api: ReturnType<typeof fakeApi>) => api.mock.calls.map(([url]) => String(url))

describe('pedidos de filme (admin)', () => {
  it('abre na fila aguardando, recusa com o motivo e aprova', async () => {
    const pedido = {
      id: 5,
      tmdbId: 1184918,
      titulo: 'Robô Selvagem',
      ano: 2024,
      posterUrl: null,
      cinemaId: 1,
      cinemaNome: 'Cine Paulista',
      solicitadoPor: 'gerente@cineticket.dev',
      status: 'AGUARDANDO_ADMIN',
      motivoRecusa: null,
      criadoEm: '2026-10-14T10:12:00',
      decididoEm: null,
    }
    let recusas = 0
    const api = fakeApi({
      'GET /admin/movie-requests': () => json([pedido]),
      'POST /admin/movie-requests/5/reject': () =>
        ++recusas === 1
          ? json(
              {
                title: 'Dados inválidos',
                detail: 'Um ou mais campos são inválidos.',
                errors: [{ field: 'motivo', message: 'Informe o motivo da recusa' }],
              },
              422,
            )
          : json({ ...pedido, status: 'RECUSADO' }),
      'POST /admin/movie-requests/5/approve': () => json({ ...pedido, status: 'APROVADO' }),
    })
    render(<PedidosPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Recusar Robô Selvagem' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Informe o motivo da recusa')

    await userEvent.type(screen.getByLabelText('Motivo da recusa de Robô Selvagem'), ' Fora do perfil da rede ')
    await userEvent.click(screen.getByRole('button', { name: 'Recusar Robô Selvagem' }))
    expect(await screen.findByText('Pedido de Robô Selvagem recusado.')).toBeInTheDocument()
    expect(ultimoCorpo(api, 'POST /admin/movie-requests/5/reject')).toEqual({ motivo: 'Fora do perfil da rede' })

    await userEvent.click(screen.getByRole('button', { name: 'Aprovar Robô Selvagem' }))
    expect(await screen.findByText(/Robô Selvagem aprovado e enviado ao Cine Paulista/)).toBeInTheDocument()
    expect(urls(api)[0]).toContain('/admin/movie-requests?status=AGUARDANDO_ADMIN')
  })
})

describe('filmes (admin)', () => {
  const duna = {
    id: 3,
    titulo: 'Duna: Parte Dois',
    tmdbId: '693134',
    posterUrl: null,
    duracaoEmMinutos: 166,
    classificacao: '14',
    cinemas: [{ cinemaId: 1, cinemaNome: 'Cine Paulista', status: 'ATIVO' }],
  }

  it('mostra a situação em cada cinema e envia só aos cinemas marcados', async () => {
    const api = fakeApi({
      'GET /admin/movies': () => pagina([duna]),
      'GET /cinemas': () => pagina([paulista, copacabana]),
      'POST /admin/movies/3/offer': () => json([]),
    })
    render(<FilmesPage />)

    expect(await screen.findByText('Cine Paulista: Em cartaz')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Enviar Duna: Parte Dois aos cinemas' }))

    const jaTem = await screen.findByRole('checkbox', { name: /Cine Paulista/ })
    expect(jaTem).toBeChecked()
    expect(jaTem).toBeDisabled()
    await userEvent.click(screen.getByRole('checkbox', { name: /Cine Copacabana/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(await screen.findByText(/Duna: Parte Dois enviado/)).toBeInTheDocument()
    expect(ultimoCorpo(api, 'POST /admin/movies/3/offer')).toEqual({ cinemaIds: [2] })
  })

  it('cadastra pelo TMDB e corrige a classificação', async () => {
    const api = fakeApi({
      'GET /admin/movies': () => pagina([duna]),
      'GET /tmdb/search': () =>
        json([{ tmdbId: 1184918, titulo: 'Robô Selvagem', tituloOriginal: null, ano: 2024, posterUrl: null, sinopse: null, filmeId: null }]),
      'POST /movies': () => json({ id: 9, titulo: 'Robô Selvagem' }, 201),
      'GET /movies/3': () =>
        json({ id: 3, titulo: 'Duna: Parte Dois', duracaoEmMinutos: 166, classificacao: '14', sinopse: 'Paul.', dataEstreia: '2024-02-29' }),
      'PUT /movies/3': () => json({}),
    })
    render(<FilmesPage />)

    await userEvent.type(screen.getByPlaceholderText('Nome do filme'), 'robô')
    await userEvent.click(screen.getByRole('button', { name: 'Buscar no TMDB' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Cadastrar Robô Selvagem' }))
    expect(await screen.findByText('Robô Selvagem cadastrado. Envie aos cinemas pela lista.')).toBeInTheDocument()
    expect(ultimoCorpo(api, 'POST /movies')).toEqual({ tmdbId: 1184918 })

    await userEvent.click(screen.getByRole('button', { name: 'Corrigir Duna: Parte Dois' }))
    await userEvent.selectOptions(await screen.findByLabelText('Classificação'), '16')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar correção' }))
    expect(await screen.findByText('Filme corrigido.')).toBeInTheDocument()
    expect(ultimoCorpo(api, 'PUT /movies/3')).toEqual({
      titulo: 'Duna: Parte Dois',
      duracaoEmMinutos: 166,
      classificacao: '16',
      dataEstreia: '2024-02-29',
      sinopse: 'Paul.',
    })
  })
})

describe('cinemas e salas', () => {
  it('cria a sala com corredores, mostra a prévia e pede as salas ordenadas por cinema', async () => {
    const api = fakeApi({
      'GET /cinemas': () => pagina([paulista, copacabana]),
      'GET /rooms': () =>
        pagina([{ id: 1, nome: 'Sala 1', capacidade: 120, cinemaId: 1, cinemaNome: 'Cine Paulista', cadeirasPorFila: 12, corredores: [2, 8] }]),
      'POST /rooms': () =>
        json({ id: 2, nome: 'Sala 3', capacidade: 96, cinemaId: 2, cinemaNome: 'Cine Copacabana', cadeirasPorFila: 12, corredores: [3, 9] }, 201),
    })
    render(<CinemasPage />)

    expect(await screen.findByRole('cell', { name: '2, 8' })).toBeInTheDocument()
    const form = screen.getByRole('region', { name: 'Nova sala' })
    await userEvent.selectOptions(within(form).getByLabelText('Cinema'), '2')
    await userEvent.type(within(form).getByLabelText('Nome'), 'Sala 3')
    await userEvent.type(within(form).getByLabelText('Capacidade'), '96')
    await userEvent.clear(within(form).getByLabelText('Cadeiras por fila'))
    await userEvent.type(within(form).getByLabelText('Cadeiras por fila'), '12')
    await userEvent.type(within(form).getByLabelText('Corredores depois das cadeiras'), '3, 9')

    expect(within(form).getByRole('img', { name: 'Prévia da sala: 96 lugares em 8 filas (A a H)' })).toBeInTheDocument()
    await userEvent.click(within(form).getByRole('button', { name: 'Criar sala' }))

    expect(await within(form).findByText('Sala 3 do Cine Copacabana salva.')).toBeInTheDocument()
    expect(ultimoCorpo(api, 'POST /rooms')).toEqual({ nome: 'Sala 3', capacidade: 96, cinemaId: 2, cadeirasPorFila: 12, corredores: [3, 9] })
    expect(urls(api).some((u) => u.includes('/rooms?page=0&size=20&sort=cinema.nome,asc&sort=nome,asc'))).toBe(true)
  })

  it('mostra o conflito da API ao excluir cinema com sessões', async () => {
    const api = fakeApi({
      'GET /cinemas': () => pagina([paulista]),
      'GET /rooms': () => pagina([]),
      'DELETE /cinemas/1': () =>
        json({ title: 'Conflito', detail: 'O cinema possui salas com sessões cadastradas e não pode ser excluído.' }, 409),
    })
    render(<CinemasPage />)

    const linha = (await screen.findByRole('cell', { name: 'Cine Paulista' })).closest('tr') as HTMLElement
    await userEvent.click(within(linha).getByRole('button', { name: 'Excluir' }))
    await userEvent.click(within(linha).getByRole('button', { name: 'Sim, excluir Cine Paulista' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('possui salas com sessões')
    expect(chamadas(api, 'DELETE /cinemas/1')).toBe(1)
  })
})

describe('equipe da rede', () => {
  it('filtra por cinema e cadastra com papel e cinema', async () => {
    const api = fakeApi({
      'GET /cinemas': () => pagina([paulista, copacabana]),
      'GET /admin/team': () =>
        json([{ id: 1, nome: 'Carlos Lima', email: 'gerente@cineticket.dev', papel: 'MANAGER', cinemaId: 1, cinemaNome: 'Cine Paulista' }]),
      'POST /admin/team': () =>
        json({ id: 2, nome: 'Bia Rocha', email: 'bia@cinema.dev', papel: 'STAFF', cinemaId: 2, cinemaNome: 'Cine Copacabana' }, 201),
    })
    render(<EquipePage />)

    expect(await screen.findByRole('cell', { name: 'Cine Paulista' })).toBeInTheDocument()
    await userEvent.selectOptions(screen.getByLabelText('Mostrar o cinema'), '2')
    expect(urls(api)).toContain('/api/v1/admin/team?cinemaId=2')

    await userEvent.selectOptions(screen.getByLabelText('Papel'), 'STAFF')
    await userEvent.selectOptions(screen.getByLabelText('Cinema'), '2')
    await userEvent.type(screen.getByLabelText('Nome'), 'Bia Rocha')
    await userEvent.type(screen.getByLabelText('E-mail'), 'bia@cinema.dev')
    await userEvent.type(screen.getByLabelText('Senha inicial'), 'senha-forte-123')
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar' }))

    expect(await screen.findByText(/Bia Rocha cadastrado como funcionário do Cine Copacabana/)).toBeInTheDocument()
    expect(ultimoCorpo(api, 'POST /admin/team')).toEqual({
      nome: 'Bia Rocha',
      email: 'bia@cinema.dev',
      senha: 'senha-forte-123',
      papel: 'STAFF',
      cinemaId: 2,
    })
  })
})

describe('ingressos da rede', () => {
  it('filtra por cinema e abre o resumo da sessão', async () => {
    const api = fakeApi({
      'GET /cinemas': () => pagina([paulista, copacabana]),
      'GET /admin/tickets': () =>
        pagina([
          {
            id: 1,
            status: 'APPROVED',
            canal: 'ONLINE',
            formaPagamento: null,
            sessionId: 7,
            filmeTitulo: 'Duna: Parte Dois',
            salaNome: 'Sala 1',
            horarioSessao: '2099-01-01T18:00:00',
            assento: 'A-1',
            tipo: 'INTEIRA',
            valorPago: 42,
            clienteEmail: 'cliente@cineticket.dev',
            vendidoPor: null,
            reembolso: null,
            utilizadoEm: null,
            criadoEm: '2098-12-31T10:00:00',
          },
        ]),
      'GET /admin/sessions/7/summary': () =>
        json({
          sessionId: 7,
          filmeTitulo: 'Duna: Parte Dois',
          salaNome: 'Sala 1',
          horarioSessao: '2099-01-01T18:00:00',
          ativa: true,
          lugares: 120,
          vendidos: 100,
          reservados: 2,
          livres: 18,
          meias: 30,
          entradas: 0,
          receitaTotal: 3570,
          receitaOnline: 3000,
          receitaBalcao: 570,
          receitaBalcaoPorForma: { PIX: 570 },
        }),
    })
    render(<IngressosPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Resumo da sessão do ingresso 1' }))
    expect(await screen.findByText('120 · 100 vendidos · 2 reservados · 18 livres')).toBeInTheDocument()

    await userEvent.selectOptions(screen.getByLabelText('Cinema'), '2')
    await userEvent.click(screen.getByRole('button', { name: 'Filtrar' }))
    expect(urls(api).at(-1)).toContain('/admin/tickets?page=0&size=20&cinemaId=2')
  })
})
