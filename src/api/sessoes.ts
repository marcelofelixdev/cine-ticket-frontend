import type { Assento } from '../lib/assentos'
import { apiFetch } from './client'

/** GET /sessions/{id}/seats (público): usado pelo caixa e pelo site. */
export interface MapaDaSala {
  sessionId: number
  salaNome: string
  totalAssentos: number
  assentosLivres: number
  cadeirasPorFila: number
  corredores: number[]
  meiasRestantes: number
  assentos: Assento[]
}

export function mapaDaSala(sessionId: number, signal?: AbortSignal): Promise<MapaDaSala> {
  return apiFetch(`/sessions/${sessionId}/seats`, { signal })
}
