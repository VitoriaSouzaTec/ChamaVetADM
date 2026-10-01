import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Converte valor em centavos para moeda Real brasileira formatada.
 * Exemplo: 690 -> "R$ 6,90"
 */
export function formatCurrency(cents: number | null | undefined): string {
  if (cents === null || cents === undefined || isNaN(cents)) return 'R$ 0,00'
  const reais = cents / 100
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(reais)
}

/**
 * Formata data e hora no padrão brasileiro: "30/09/2026 15:59"
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd/MM/yyyy HH:mm', { locale: ptBR })
}

/**
 * Formata apenas a data no padrão brasileiro: "30/09/2026"
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd/MM/yyyy', { locale: ptBR })
}

/**
 * Retorna tempo relativo: "há 2 horas", "há 3 dias"
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { locale: ptBR, addSuffix: true })
}

/**
 * Mascara e-mail para exibição em listas públicas do painel.
 * Exemplo: "vinicius@chama.vet" -> "vi***@chama.vet"
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return '-'
  const [user, domain] = email.split('@')
  if (!domain) return email
  if (user.length <= 2) return `${user[0]}***@${domain}`
  return `${user.slice(0, 2)}***@${domain}`
}

/**
 * Mascara telefone para exibição em listas.
 * Exemplo: "(85) 98888-1234" -> "(85) 9****-1234"
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '-'
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    // (DD) 9XXXX-XXXX
    return `(${digits.slice(0, 2)}) ${digits[2]}****-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ****-${digits.slice(6)}`
  }
  return phone
}

/**
 * Formata CNPJ: 12.345.678/0001-90
 */
export function formatCNPJ(cnpj: string | null | undefined): string {
  if (!cnpj) return '-'
  const digits = cnpj.replace(/\D/g, '')
  if (digits.length !== 14) return cnpj
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  )
}

/**
 * Formata CRMV: 12345/CE
 */
export function formatCRMV(crmv: string | null | undefined, uf: string | null | undefined): string {
  if (!crmv) return '-'
  const clean = crmv.trim()
  return uf ? `${clean}/${uf.toUpperCase()}` : clean
}
