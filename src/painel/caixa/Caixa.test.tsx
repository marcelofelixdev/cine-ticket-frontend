import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { setAccessToken } from '../../api/client'
import { chamadas, fakeApi, json, ultimoCorpo } from '../../test/fakeApi'
import { CaixaPage } from './CaixaPage'
import { DevolucoesPage } from './DevolucoesPage'

const sessao = {
  id: 42,
  horarioInicio: '2099-01-01T21:40:00',
  horarioFim: '2099-01-01T23:12:00',
  movieTitulo: 'Batman: O Cavaleiro das Trevas',
  classificacao: '12',
  roomNome: 'Sala 3',
  formato: '2D',
  audio: 'LEGENDADO',
  valorBase: 38,
  valorMeia: 19,
  lugares: 4,
  ocupados: 1,
  meias: 0,
  vendasAbertas: true,
}

const assentos = [
  { id: 1, fila: 'A', numero: 1, status: 'OCUPADO' },
  { id: 2, fila: 'A', numero: 2, status: 'LIVRE' },
  { id: 3, fila: 'A', numero: 3, status: 'LIVRE' },
  { id: 4, fila: 'A', numero: 4, status: 'LIVRE' },
]

function mapa(meiasRestantes: number) {
  return {
    sessionId: 42,
    salaNome: 'Sala 3',
    totalAssentos: 4,
    assentosLivres: 3,
    cadeirasPorFila: 4,
    corredores: [2],
    meiasRestantes,
    assentos,
  }
}

afterEach(() => {
  setAccessToken(null)
  vi.unstubAllGlobals()
})

describe('caixa', () => {
  it('vende dois lugares, um deles meia estudante, e mostra o recibo para imprimir', async () => {
    const api = fakeApi({
      'GET /box-office/sessions': () => json([sessao]),
      'GET /sessions/42/seats': () => json(mapa(1)),
      'POST /box-office/sales': () =>
        json(
          {
            sessionId: 42,
            filmeTitulo: sessao.movieTitulo,
            salaNome: 'Sala 3',
            horarioSessao: sessao.horarioInicio,
            formaPagamento: 'PIX',
            total: 57,
            ingressos: [
              { ticketId: 900, assento: 'A-2', tipo: 'INTEIRA', valor: 38, qr: 'CT1.900.x' },
              { ticketId: 901, assento: 'A-3', tipo: 'MEIA_ESTUDANTE', valor: 19, qr: 'CT1.901.y' },
            ],
          },
          201,
        ),
    })
    render(<CaixaPage />)

    await userEvent.click(await screen.findByRole('button', { name: /21:40, Batman/ }))
    expect(await screen.findByRole('button', { name: 'A-1, ocupado' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'A-3, livre' }).className).toMatch(/corredor/)

    await userEvent.click(screen.getByRole('button', { name: 'A-2, livre' }))
    await userEvent.click(screen.getByRole('button', { name: 'A-3, livre' }))
    await userEvent.selectOptions(screen.getByLabelText('Tipo do lugar A-3'), 'MEIA_ESTUDANTE')
    const concluir = screen.getByRole('button', { name: 'Concluir venda' })
    await userEvent.type(screen.getByLabelText('Carteira de estudante do lugar A-3'), '123456789')
    await userEvent.click(screen.getByLabelText('Pix'))
    expect(screen.getByText('R$ 57,00')).toBeInTheDocument()
    await userEvent.click(concluir)

    expect(await screen.findByText(/Venda concluída: R\$ 57,00 em pix/)).toBeInTheDocument()
    expect(ultimoCorpo(api, 'POST /box-office/sales')).toEqual({
      sessionId: 42,
      formaPagamento: 'PIX',
      itens: [
        { seatId: 2, ticketType: 'INTEIRA' },
        { seatId: 3, ticketType: 'MEIA_ESTUDANTE', documentoMeia: '123456789' },
      ],
    })
    expect(screen.getAllByRole('button', { name: 'Imprimir' })).toHaveLength(2)
    expect(chamadas(api, 'GET /sessions/42/seats')).toBe(2) // o mapa é atualizado depois da venda
  })

  it('não deixa vender mais meias do que a cota da sessão', async () => {
    fakeApi({
      'GET /box-office/sessions': () => json([sessao]),
      'GET /sessions/42/seats': () => json(mapa(1)),
    })
    render(<CaixaPage />)

    await userEvent.click(await screen.findByRole('button', { name: /21:40, Batman/ }))
    await userEvent.click(await screen.findByRole('button', { name: 'A-2, livre' }))
    await userEvent.click(screen.getByRole('button', { name: 'A-3, livre' }))
    await userEvent.selectOptions(screen.getByLabelText('Tipo do lugar A-2'), 'MEIA_IDOSO')
    await userEvent.selectOptions(screen.getByLabelText('Tipo do lugar A-3'), 'MEIA_IDOSO')

    expect(screen.getByRole('status')).toHaveTextContent('só cabem 1')
    expect(screen.getByRole('button', { name: 'Concluir venda' })).toBeDisabled()
  })

  it('lugar vendido por outro caixa mostra o aviso da API', async () => {
    fakeApi({
      'GET /box-office/sessions': () => json([sessao]),
      'GET /sessions/42/seats': () => json(mapa(4)),
      'POST /box-office/sales': () => json({ title: 'Conflito', detail: 'A cadeira A-2 já está ocupada.' }, 409),
    })
    render(<CaixaPage />)

    await userEvent.click(await screen.findByRole('button', { name: /21:40, Batman/ }))
    await userEvent.click(await screen.findByRole('button', { name: 'A-2, livre' }))
    await userEvent.click(screen.getByRole('button', { name: 'Concluir venda' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('A cadeira A-2 já está ocupada. Atualize o mapa')
  })
})

describe('devoluções', () => {
  it('confirma em dois passos e some da lista', async () => {
    let pendentes = [
      {
        ticketId: 1043,
        filmeTitulo: 'Divertida Mente 2',
        salaNome: 'Sala 2',
        horarioSessao: '2026-10-11T13:20:00',
        assento: 'A-9',
        formaPagamento: 'DINHEIRO',
        valor: 15,
        clienteEmail: null,
        status: 'PENDING',
        devolvidoEm: null,
      },
    ]
    const api = fakeApi({
      'GET /box-office/refunds/pending': () => json(pendentes),
      'POST /box-office/refunds/1043/confirm': () => {
        const confirmada = { ...pendentes[0], status: 'REFUNDED' }
        pendentes = []
        return json(confirmada)
      },
    })
    render(<DevolucoesPage />)

    const linha = (await screen.findByText('#1043')).closest('tr') as HTMLElement
    expect(within(linha).getByText('(sem e-mail)')).toBeInTheDocument()
    await userEvent.click(within(linha).getByRole('button', { name: 'Confirmar devolução' }))
    await userEvent.click(within(linha).getByRole('button', { name: /Devolvi R\$\s15,00/ }))

    expect(await screen.findByText('Devolução de R$ 15,00 do lugar A-9 registrada.')).toBeInTheDocument()
    expect(await screen.findByText('Nenhuma devolução pendente.')).toBeInTheDocument()
    expect(chamadas(api, 'POST /box-office/refunds/1043/confirm')).toBe(1)
  })
})

describe('sessão com vendas encerradas', () => {
  it('mostra o aviso e trava o mapa, como a API manda', async () => {
    fakeApi({
      'GET /box-office/sessions': () => json([{ ...sessao, vendasAbertas: false }]),
      'GET /sessions/42/seats': () => json(mapa(4)),
    })
    render(<CaixaPage />)

    expect(await screen.findByText('vendas encerradas')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /21:40, Batman/ }))
    expect(await screen.findByRole('button', { name: 'A-2, livre' })).toBeDisabled()
  })
})
