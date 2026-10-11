import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { AdminRole, Json } from '@/types/database'

/**
 * Sessão da equipe para a requisição atual.
 * Lança erro se não houver usuário com papel de staff (o banco também recusa via RLS/RPC).
 */
export const getStaffContext = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const role = (user?.app_metadata?.admin_role || user?.app_metadata?.role) as
    | AdminRole
    | undefined

  if (!user || (role !== 'admin' && role !== 'support')) {
    throw new Error('Sessão expirada ou sem permissão. Faça login novamente.')
  }

  return { supabase, user, role }
})

export interface AuthUserInfo {
  id: string
  email: string | null
  name: string | null
  lastSignInAt: string | null
}

/**
 * Busca e-mail, nome e último acesso no Supabase Auth (service role, só servidor).
 */
export async function fetchAuthUsers(ids: string[]): Promise<Map<string, AuthUserInfo>> {
  const unique = [...new Set(ids.filter(Boolean))]
  const map = new Map<string, AuthUserInfo>()
  if (unique.length === 0) return map

  const admin = createAdminClient()
  const results = await Promise.all(unique.map((id) => admin.auth.admin.getUserById(id)))
  for (const { data } of results) {
    const u = data?.user
    if (!u) continue
    map.set(u.id, {
      id: u.id,
      email: u.email ?? null,
      name: (u.user_metadata?.full_name as string | undefined) ?? null,
      lastSignInAt: u.last_sign_in_at ?? null,
    })
  }
  return map
}

/**
 * Nome dos perfis do app (profiles.full_name) por id.
 */
export async function fetchProfileNames(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))]
  const map = new Map<string, string>()
  if (unique.length === 0) return map

  const { supabase } = await getStaffContext()
  const { data, error } = await supabase.from('profiles').select('id, full_name').in('id', unique)
  if (error) throw new Error(friendlyError(error.message))
  for (const p of data ?? []) map.set(p.id, p.full_name)
  return map
}

/**
 * Registra em audit_logs ações que não passam por RPC admin_* (Auth Admin API,
 * visualização de dado sensível). Usa service role: audit_logs só aceita insert.
 */
export async function writeAudit(entry: {
  action: string
  entity: string
  entityId?: string | null
  reason?: string | null
  before?: Json | null
  after?: Json | null
  metadata?: Json | null
}) {
  const { user, role } = await getStaffContext()
  const admin = createAdminClient()
  const { error } = await admin.from('audit_logs').insert({
    actor_id: user.id,
    actor_role: role,
    action: entry.action,
    entity: entry.entity,
    entity_id: entry.entityId ?? null,
    reason: entry.reason ?? null,
    before: entry.before ?? null,
    after: entry.after ?? null,
    metadata: entry.metadata ?? null,
  })
  if (error) throw new Error('Falha ao registrar a auditoria. A ação foi interrompida.')
}

/**
 * Traduz erros do Postgres/PostgREST para mensagens em pt-BR, sem stack trace.
 */
export function friendlyError(message: string | undefined | null): string {
  const msg = message ?? ''
  if (/permission denied|not allowed|forbidden|insufficient|42501/i.test(msg)) {
    return 'Sem permissão para esta ação.'
  }
  if (/could not find the function|does not exist|PGRST202/i.test(msg)) {
    return 'Função ou tabela não encontrada no banco. Confira se as migrations do painel foram aplicadas.'
  }
  if (/JWT|session|aal/i.test(msg)) {
    return 'Sessão expirada ou sem MFA. Faça login novamente.'
  }
  if (/reason/i.test(msg)) return 'Informe um motivo com pelo menos 5 caracteres.'
  // Mensagens levantadas pelas próprias funções admin_* (RAISE EXCEPTION) já vêm prontas.
  return msg || 'Não foi possível concluir a operação.'
}
