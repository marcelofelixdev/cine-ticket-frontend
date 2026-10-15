/** Página do Spring Data (serialização VIA_DTO). */
export interface Pagina<T> {
  content: T[]
  page: { size: number; number: number; totalElements: number; totalPages: number }
}
