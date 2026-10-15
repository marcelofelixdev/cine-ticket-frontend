/**
 * Cliente da API. O access token fica só em memória (nunca em localStorage); o refresh
 * token é um cookie HttpOnly que o navegador manda sozinho para /api/v1/auth.
 *
 * Quando a API responde 401, o cliente renova o access token uma única vez (mesmo que
 * várias chamadas falhem juntas) e repete a chamada. O refresh é rotativo no backend:
 * dois refresh simultâneos com o mesmo cookie seriam vistos como reuso e derrubariam a sessão.
 */

const BASE = '/api/v1'

export interface FieldError {
  field: string
  message: string
}

export class ApiError extends Error {
  readonly status: number
  readonly title: string
  readonly fieldErrors: FieldError[]

  constructor(status: number, title: string, detail: string, fieldErrors: FieldError[] = []) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
    this.title = title
    this.fieldErrors = fieldErrors
  }
}

let accessToken: string | null = null
let refreshing: Promise<boolean> | null = null
let onUnauthorized: (() => void) | null = null

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function hasAccessToken(): boolean {
  return accessToken !== null
}

/** Chamado quando a sessão acabou e não deu para renovar (o app volta para o login). */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler
}

interface TokenResponse {
  token: string
  expiresIn: number
}

/** Troca o refresh token do cookie por um novo access token. Chamadas simultâneas compartilham a mesma troca. */
export function refreshAccessToken(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const response = await fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' })
      if (!response.ok) {
        accessToken = null
        return false
      }
      const body = (await response.json()) as TokenResponse
      accessToken = body.token
      return true
    } catch {
      accessToken = null
      return false
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

export interface RequestOptions {
  method?: string
  /** Corpo enviado como JSON. */
  json?: unknown
  /** Tipo de resposta aceito (padrão: JSON). */
  accept?: string
  signal?: AbortSignal
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await request(path, options)
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

/** Para respostas binárias, como o PDF do ingresso. */
export async function apiBlob(path: string, options: RequestOptions = {}): Promise<Blob> {
  const response = await request(path, options)
  return response.blob()
}

/** Faz a chamada, renova o token uma vez se vier 401 e transforma erro em ApiError. */
async function request(path: string, options: RequestOptions): Promise<Response> {
  let response = await send(path, options)
  if (response.status === 401 && !path.startsWith('/auth/')) {
    if (await refreshAccessToken()) {
      response = await send(path, options)
    } else {
      onUnauthorized?.()
    }
  }
  if (!response.ok) {
    throw await toApiError(response)
  }
  return response
}

function send(path: string, { method = 'GET', json, accept = 'application/json', signal }: RequestOptions): Promise<Response> {
  const headers = new Headers({ Accept: accept })
  if (json !== undefined) {
    headers.set('Content-Type', 'application/json')
  }
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }
  return fetch(`${BASE}${path}`, {
    method,
    headers,
    body: json === undefined ? undefined : JSON.stringify(json),
    credentials: 'include',
    signal,
  })
}

interface ProblemDetail {
  title?: string
  detail?: string
  errors?: FieldError[]
}

async function toApiError(response: Response): Promise<ApiError> {
  let problem: ProblemDetail = {}
  try {
    problem = (await response.json()) as ProblemDetail
  } catch {
    // corpo vazio ou que não é JSON (ex.: erro do proxy)
  }
  return new ApiError(
    response.status,
    problem.title ?? 'Erro',
    problem.detail ?? 'Não foi possível falar com o servidor. Tente de novo.',
    problem.errors ?? [],
  )
}
