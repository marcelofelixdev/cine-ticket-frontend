/** Assento como vem de GET /sessions/{id}/seats. */
export interface Assento {
  id: number
  fila: string
  numero: number
  status: 'LIVRE' | 'OCUPADO'
}

export interface Fileira {
  fila: string
  /** Assentos em ordem; `corredorAntes` marca o vão entre ele e o anterior. */
  assentos: Array<Assento & { corredorAntes: boolean }>
}

/**
 * Monta as fileiras do mapa (A, B, C…) com os corredores da sala: cada número em
 * `corredores` é a cadeira depois da qual existe um vão.
 */
export function montarFileiras(assentos: Assento[], corredores: number[]): Fileira[] {
  const porFila = new Map<string, Assento[]>()
  for (const assento of assentos) {
    const fila = porFila.get(assento.fila) ?? []
    fila.push(assento)
    porFila.set(assento.fila, fila)
  }
  const vaos = new Set(corredores)
  return [...porFila.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fila, lista]) => ({
      fila,
      assentos: [...lista]
        .sort((a, b) => a.numero - b.numero)
        .map((assento) => ({ ...assento, corredorAntes: vaos.has(assento.numero - 1) })),
    }))
}

/** "D-5", o mesmo rótulo do backend (Seat.label). */
export function rotulo(assento: Pick<Assento, 'fila' | 'numero'>): string {
  return `${assento.fila}-${assento.numero}`
}
