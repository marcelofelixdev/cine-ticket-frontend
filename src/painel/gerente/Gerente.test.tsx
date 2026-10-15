import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { chamadas, fakeApi, json, ultimoCorpo } from '../../test/fakeApi'
import { EquipePage } from './EquipePage'
import { IngressosPage } from './IngressosPage'
import { PedidosPage } from './PedidosPage'
import { ProgramacaoPage } from './ProgramacaoPage'
import { SessoesPage } from './SessoesPage'

afterEach(() => vi.unstubAllGlobals())

const sessao = {
  id: 7,
  horarioInicio: '2099-01-01T18:00:00',
  horarioFim: '2099-01-01T20:46:00',
  movieTitulo: 'Duna: Parte Dois',
  classificacao: '14',
  roomNome: 'Sala 1',
  formato: '3D',
  audio: 'DUBLADO',
  valorBase: 42,
  valorMeia: 21,
  lugares: 120,
  ocupados: 112,
  meias: 41,
  receita: 2745,
  vendasAbertas: true,
}

describe('sessões do gerente', () => {
  it('mostra ocupação e receita, cancela em dois passos e cria sessão com os dados do formulário', async () => {
    let lista = [sessao]
    const api = fakeApi({
      'GET /manager/sessions': () => json(lista),
      'DELETE /manager/sessions/7': () => {
        lista = []
        return new Response(null, { status: 204 })
      },
      'GET /manager/programacao': () =>
        json([
          { movieId: 3, titulo: 'Duna: Parte Dois', posterUrl: null, classificacao: '14', duracaoEmMinutos: 166, status: 'ATIVO', confirmadoEm: null },
          { movieId: 4, titulo: 'Filme Novo', posterUrl: null, classificacao: 'L', duracaoEmMinutos: 90, status: 'AGUARDANDO_GERENTE', confirmadoEm: null },
        ]),
      'GET /manager/rooms': () => json([{ id: 1, nome: 'Sala 1', capacidade: 120 }]),
      'POST /manager/sessions': () =>
        json({ title: 'Conflito', detail: 'Conflito de horário: a sala já estará ocupada neste período.' }, 409),
    })
    render(<SessoesPage />)

    const linha = (await screen.findByRole('cell', { name: 'Duna: Parte Dois' })).closest('tr') as HTMLElement
    expect(within(linha).getByText('112/120')).toBeInTheDocument()
    expect(within(linha).getByText(/2\.745,00/)).toBeInTheDocument()

    await userEvent.click(within(linha).getByRole('button', { name: 'Cancelar' }))
    await userEvent.click(within(linha).getByRole('button', { name: 'Sim, cancelar sessão' }))
    expect(await screen.findByText(/cancelada\. Compras online foram estornadas/)).toBeInTheDocument()
    expect(chamadas(api, 'DELETE /manager/sessions/7')).toBe(1)

    // Só filmes em cartaz entram no formulário.
    const filme = screen.getByLabelText('Filme (em cartaz neste cinema)')
    expect(within(filme).queryByText(/Filme Novo/)).not.toBeInTheDocument()
    await userEvent.selectOptions(filme, '3')
    await userEvent.selectOptions(screen.getByLabelText('Sala'), '1')
    await userEvent.clear(screen.getByLabelText('Data'))
    await userEvent.type(screen.getByLabelText('Data'), '2099-01-02')
    await userEvent.selectOptions(screen.getByLabelText('Formato'), '3D')
    await userEvent.type(screen.getByLabelText('Preço da inteira (R$)'), '42,50')
    await userEvent.click(screen.getByRole('button', { name: 'Criar sessão' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Conflito de horário')
    expect(ultimoCorpo(api, 'POST /manager/sessions')).toEqual({
      movieId: 3,
      roomId: 1,
      horarioInicio: '2099-01-02T19:00:00',
      valorBase: 42.5,
      formato: '3D',
      audio: 'LEGENDADO',
    })
  })

  it('cancelar no demo mostra a recusa da API', async () => {
    fakeApi({
      'GET /manager/sessions': () => json([sessao]),
      'DELETE /manager/sessions/7': () =>
        json({ title: 'Acesso negado', detail: 'Cancelar sessões fica desativado na demonstração pública.' }, 403),
      'GET /manager/programacao': () => json([]),
      'GET /manager/rooms': () => json([]),
    })
    render(<SessoesPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Sim, cancelar sessão' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('desativado na demonstração pública')
  })
})

describe('programação', () => {
  it('confirma o filme enviado pelo admin', async () => {
    let status = 'AGUARDANDO_GERENTE'
    const api = fakeApi({
      'GET /manager/programacao': () =>
        json([{ movieId: 4, titulo: 'Filme Novo', posterUrl: null, classificacao: 'L', duracaoEmMinutos: 90, status, confirmadoEm: null }]),
      'POST /manager/programacao/4/confirm': () => {
        status = 'ATIVO'
        return json({})
      },
    })
    render(<ProgramacaoPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Confirmar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Sim, pôr em cartaz' }))

    expect(await screen.findByText('Filme Novo entrou na programação. Já dá para criar sessões.')).toBeInTheDocument()
    expect(await screen.findByText('Em cartaz')).toBeInTheDocument()
    expect(chamadas(api, 'POST /manager/programacao/4/confirm')).toBe(1)
  })
})

describe('pedidos de filme', () => {
  it('busca no TMDB e pede o filme', async () => {
    const api = fakeApi({
      'GET /manager/movie-requests': () => json([]),
      'GET /tmdb/search': () =>
        json([{ tmdbId: 1184918, titulo: 'Robô Selvagem', tituloOriginal: 'The Wild Robot', ano: 2024, posterUrl: null, sinopse: null, filmeId: null }]),
      'POST /manager/movie-requests': () => json({}, 201),
    })
    render(<PedidosPage />)

    await userEvent.type(screen.getByPlaceholderText('Nome do filme'), 'robô selvagem')
    await userEvent.click(screen.getByRole('button', { name: 'Buscar no TMDB' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Pedir Robô Selvagem' }))

    expect(await screen.findByText('Pedido de Robô Selvagem enviado ao admin.')).toBeInTheDocument()
    expect(ultimoCorpo(api, 'POST /manager/movie-requests')).toEqual({ tmdbId: 1184918 })
    expect(api.mock.calls.some(([url]) => String(url).includes('/tmdb/search?q=rob%C3%B4%20selvagem'))).toBe(true)
  })
})

describe('ingressos', () => {
  it('filtra pela API e só oferece cancelar venda de balcão aprovada', async () => {
    const ingresso = (id: number, canal: string, status: string) => ({
      id,
      status,
      canal,
      formaPagamento: canal === 'BALCAO' ? 'PIX' : null,
      sessionId: 7,
      filmeTitulo: 'Duna: Parte Dois',
      salaNome: 'Sala 1',
      horarioSessao: '2099-01-01T18:00:00',
      assento: `A-${id}`,
      tipo: 'INTEIRA',
      valorPago: 42,
      clienteEmail: null,
      vendidoPor: canal === 'BALCAO' ? 'Ana Souza' : null,
      reembolso: null,
      utilizadoEm: null,
      criadoEm: '2098-12-31T10:00:00',
    })
    const api = fakeApi({
      'GET /manager/tickets': () =>
        json({
          content: [ingresso(1, 'BALCAO', 'APPROVED'), ingresso(2, 'ONLINE', 'APPROVED')],
          page: { size: 20, number: 0, totalElements: 2, totalPages: 1 },
        }),
    })
    render(<IngressosPage />)

    expect(await screen.findAllByRole('button', { name: 'Cancelar venda' })).toHaveLength(1)

    await userEvent.selectOptions(screen.getByLabelText('Canal'), 'BALCAO')
    await userEvent.type(screen.getByLabelText('E-mail do cliente'), ' ana@cliente.dev ')
    await userEvent.click(screen.getByRole('button', { name: 'Filtrar' }))

    const urls = api.mock.calls.map(([url]) => String(url))
    expect(urls.at(-1)).toContain('/manager/tickets?page=0&size=20&canal=BALCAO&email=ana%40cliente.dev')
  })
})

describe('equipe', () => {
  it('mostra o erro da API ao lado do campo', async () => {
    fakeApi({
      'GET /manager/staff': () => json([{ id: 1, nome: 'Carlos Lima', email: 'gerente@cineticket.dev', papel: 'MANAGER' }]),
      'POST /manager/staff': () =>
        json(
          {
            title: 'Dados inválidos',
            detail: 'Um ou mais campos são inválidos.',
            errors: [{ field: 'senha', message: 'A senha deve ter entre 12 e 72 caracteres' }],
          },
          422,
        ),
    })
    render(<EquipePage />)

    expect(await screen.findByText('Carlos Lima')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Nome'), 'Bia')
    await userEvent.type(screen.getByLabelText('E-mail'), 'bia@cinema.dev')
    await userEvent.type(screen.getByLabelText('Senha inicial'), 'curta')
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar funcionário' }))

    expect(await screen.findByText('A senha deve ter entre 12 e 72 caracteres')).toBeInTheDocument()
  })
})
