import 'server-only'
import { refresh } from 'next/cache'
import { friendlyError, getStaffContext } from '@/server/context'
import type { Database } from '@/types/database'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

type Fns = Database['public']['Functions']

/**
 * Chama uma RPC admin_* (que valida o papel e grava a auditoria no banco)
 * e atualiza a tela atual.
 */
export async function callAdminRpc<K extends keyof Fns>(
  name: K,
  args: Fns[K]['Args']
): Promise<ActionResult<Fns[K]['Returns']>> {
  try {
    const { supabase } = await getStaffContext()
    const { data, error } = await supabase.rpc(name, args)
    if (error) return { ok: false, error: friendlyError(error.message) }
    refresh()
    return { ok: true, data: data as Fns[K]['Returns'] }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erro inesperado.' }
  }
}

export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn()
    refresh()
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erro inesperado.' }
  }
}
