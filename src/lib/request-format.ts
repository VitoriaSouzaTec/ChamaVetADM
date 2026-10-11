import { formatCurrency, formatDate } from '@/lib/format'

/**
 * Valor da solicitação. A coluna requests.price segue a regra de valores
 * em centavos do contrato do banco; nulo significa "a combinar".
 */
export function formatRequestPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) return 'A combinar'
  return formatCurrency(price)
}

export function formatWorkDate(start: string | null | undefined, end?: string | null): string {
  if (!start) return 'Sem data'
  if (end && end.slice(0, 10) !== start.slice(0, 10)) return `${formatDate(start)} a ${formatDate(end)}`
  return formatDate(start)
}
