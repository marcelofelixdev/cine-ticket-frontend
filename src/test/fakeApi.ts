import { vi } from 'vitest'

export type Rota = (request: { method: string; body: unknown; authorization: string | null }) => Response

/** Resposta JSON como a API manda. */
export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

/**
 * Troca o fetch global por rotas falsas, chaveadas por "MÉTODO /caminho" (sem /api/v1).
 * Devolve o mock para conferir as chamadas.
 */
export function fakeApi(rotas: Record<string, Rota>) {
  const mock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString()
    const method = init?.method ?? 'GET'
    const chave = `${method} ${url.replace('/api/v1', '')}`
    // Chave com a query string tem prioridade; sem ela, vale para qualquer query.
    const rota = rotas[chave] ?? rotas[chave.split('?')[0]]
    if (!rota) {
      return json({ title: 'Não encontrado', detail: `Rota falsa ausente: ${chave}` }, 404)
    }
    const headers = new Headers(init?.headers)
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined
    return rota({ method, body, authorization: headers.get('Authorization') })
  })
  vi.stubGlobal('fetch', mock)
  return mock
}

/** Corpo (JSON) da última chamada a esta rota. */
export function ultimoCorpo(mock: ReturnType<typeof fakeApi>, chave: string): unknown {
  const call = mock.mock.calls.filter(([input, init]) => {
    const url = typeof input === 'string' ? input : input.toString()
    return `${init?.method ?? 'GET'} ${url.replace('/api/v1', '')}` === chave
  }).at(-1)
  const body = call?.[1]?.body
  return typeof body === 'string' ? JSON.parse(body) : undefined
}

export function chamadas(mock: ReturnType<typeof fakeApi>, chave: string): number {
  return mock.mock.calls.filter(([input, init]) => {
    const url = typeof input === 'string' ? input : input.toString()
    return `${init?.method ?? 'GET'} ${url.replace('/api/v1', '')}` === chave
  }).length
}
