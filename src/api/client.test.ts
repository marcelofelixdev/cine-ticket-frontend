import { afterEach, describe, expect, it, vi } from 'vitest'
import { chamadas, fakeApi, json } from '../test/fakeApi'
import { ApiError, apiFetch, setAccessToken, setUnauthorizedHandler } from './client'

afterEach(() => {
  setAccessToken(null)
  setUnauthorizedHandler(null)
  vi.unstubAllGlobals()
})

describe('apiFetch', () => {
  it('manda o access token e devolve o JSON', async () => {
    setAccessToken('t1')
    const api = fakeApi({
      'GET /users/me': ({ authorization }) => json({ autorizacao: authorization }),
    })

    await expect(apiFetch('/users/me')).resolves.toEqual({ autorizacao: 'Bearer t1' })
    expect(chamadas(api, 'GET /users/me')).toBe(1)
  })

  it('renova o token uma vez só quando várias chamadas recebem 401 juntas', async () => {
    setAccessToken('vencido')
    const api = fakeApi({
      'POST /auth/refresh': () => json({ token: 'novo', expiresIn: 900 }),
      'GET /users/me': ({ authorization }) =>
        authorization === 'Bearer novo' ? json({ ok: true }) : json({ title: 'Não autenticado' }, 401),
    })

    const respostas = await Promise.all([apiFetch('/users/me'), apiFetch('/users/me'), apiFetch('/users/me')])

    expect(respostas).toEqual([{ ok: true }, { ok: true }, { ok: true }])
    expect(chamadas(api, 'POST /auth/refresh')).toBe(1)
  })

  it('avisa o app quando a sessão acabou e não dá para renovar', async () => {
    const sessaoAcabou = vi.fn()
    setUnauthorizedHandler(sessaoAcabou)
    fakeApi({
      'POST /auth/refresh': () => json({ title: 'Não autenticado' }, 401),
      'GET /users/me': () => json({ title: 'Não autenticado', detail: 'Faça login.' }, 401),
    })

    await expect(apiFetch('/users/me')).rejects.toMatchObject({ status: 401 })
    expect(sessaoAcabou).toHaveBeenCalledOnce()
  })

  it('transforma o ProblemDetail da API em ApiError com os erros dos campos', async () => {
    fakeApi({
      'POST /rooms': () =>
        json(
          {
            title: 'Dados inválidos',
            detail: 'Um ou mais campos são inválidos.',
            errors: [{ field: 'nome', message: 'Nome da sala é obrigatório' }],
          },
          422,
        ),
    })

    const erro = await apiFetch('/rooms', { method: 'POST', json: {} }).catch((e: unknown) => e)

    expect(erro).toBeInstanceOf(ApiError)
    expect(erro).toMatchObject({
      status: 422,
      message: 'Um ou mais campos são inválidos.',
      fieldErrors: [{ field: 'nome', message: 'Nome da sala é obrigatório' }],
    })
  })

  it('não tenta renovar quando o próprio login falha', async () => {
    const api = fakeApi({
      'POST /auth/login': () => json({ title: 'Não autenticado' }, 401),
    })

    await expect(apiFetch('/auth/login', { method: 'POST', json: {} })).rejects.toMatchObject({ status: 401 })
    expect(chamadas(api, 'POST /auth/refresh')).toBe(0)
  })
})
