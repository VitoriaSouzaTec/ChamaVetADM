import 'server-only'

/** Remove caracteres que quebram filtros do PostgREST (.or / ilike). */
export function sanitizeSearch(q: string | undefined | null): string {
  return (q ?? '').replace(/[,()*%\\:"']/g, ' ').trim().slice(0, 80)
}

export function hoursSince(date: string | null | undefined): number {
  if (!date) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 3_600_000))
}

export function assertNoError(error: { message: string } | null, context: string) {
  if (error) throw new Error(`${context}: ${error.message}`)
}
