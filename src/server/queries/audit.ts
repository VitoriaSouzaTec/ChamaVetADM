import 'server-only'
import { getStaffContext, fetchAuthUsers } from '@/server/context'
import type { AuditItem } from '@/types/admin'
import { assertNoError } from './_util'

/** Auditoria: suporte vê só as próprias ações (o banco também restringe via RLS). */
export async function listAudit(limit = 200): Promise<AuditItem[]> {
  const { supabase, user, role } = await getStaffContext()
  let query = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(limit)
  if (role !== 'admin') query = query.eq('actor_id', user.id)
  const { data, error } = await query
  assertNoError(error, 'Falha ao carregar a auditoria')
  const rows = data ?? []
  const actors = await fetchAuthUsers(rows.map((r) => r.actor_id))
  return rows.map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    actorName: actors.get(r.actor_id)?.name || actors.get(r.actor_id)?.email || r.actor_id,
    actorRole: r.actor_role,
    action: r.action,
    entity: r.entity,
    entityId: r.entity_id,
    reason: r.reason,
    before: r.before,
    after: r.after,
    metadata: r.metadata,
  }))
}
