import type { ActionResult } from '@/server/actions/_result'

/**
 * Converte o resultado de uma Server Action em exceção no cliente
 * (o ConfirmModal exibe a mensagem do erro).
 */
export function unwrap<T>(result: ActionResult<T>): T | undefined {
  if (!result.ok) throw new Error(result.error)
  return result.data
}
