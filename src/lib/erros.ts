import { ApiError } from '../api/client'

export function mensagemDeErro(e: unknown): string {
  return e instanceof ApiError ? e.message : 'Não foi possível falar com o servidor. Tente de novo.'
}

/** Erros de validação da API (422) por campo, para mostrar ao lado de cada um. */
export function errosPorCampo(e: unknown): Record<string, string> {
  return e instanceof ApiError ? Object.fromEntries(e.fieldErrors.map((f) => [f.field, f.message])) : {}
}
