'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffContext, writeAudit } from '@/server/context'
import type { AdminRole } from '@/types/database'
import { runAction, type ActionResult } from './_result'

async function requireAdmin() {
  const ctx = await getStaffContext()
  if (ctx.role !== 'admin') throw new Error('Sem permissão para gerenciar a equipe.')
  return ctx
}

/** Só limpa app_metadata.role quando ele guarda um papel de staff (nunca o papel do app). */
function staffRolePatch(current: Record<string, unknown> | undefined, adminRole: AdminRole | null) {
  const patch: Record<string, unknown> = { admin_role: adminRole }
  if (current?.role === 'admin' || current?.role === 'support') patch.role = null
  return patch
}

async function countAdmins(): Promise<number> {
  const admin = createAdminClient()
  let count = 0
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error('Falha ao listar a equipe.')
    for (const u of data.users) {
      const r = u.app_metadata?.admin_role || u.app_metadata?.role
      if (r === 'admin') count++
    }
    if (data.users.length < 1000) break
  }
  return count
}

export async function inviteMember(email: string, name: string, role: AdminRole): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdmin()
    if (role !== 'admin' && role !== 'support') throw new Error('Papel inválido.')
    const admin = createAdminClient()
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email.trim(), {
      data: { full_name: name.trim() },
    })
    if (error || !data.user) throw new Error('Falha ao enviar o convite: ' + (error?.message ?? ''))
    const { error: roleError } = await admin.auth.admin.updateUserById(data.user.id, {
      app_metadata: { admin_role: role },
    })
    if (roleError) throw new Error('Convite enviado, mas falhou ao definir o papel.')
    await writeAudit({
      action: 'team_invite',
      entity: 'auth.users',
      entityId: data.user.id,
      after: { email, admin_role: role },
    })
    return undefined
  })
}

export async function changeMemberRole(memberId: string, role: AdminRole, reason: string): Promise<ActionResult> {
  return runAction(async () => {
    const { user } = await requireAdmin()
    if (memberId === user.id) throw new Error('Você não pode alterar o próprio papel.')
    const admin = createAdminClient()
    const { data: current } = await admin.auth.admin.getUserById(memberId)
    const before = current.user?.app_metadata?.admin_role || current.user?.app_metadata?.role
    if (before === 'admin' && role !== 'admin' && (await countAdmins()) <= 1) {
      throw new Error('Não é possível rebaixar o último administrador.')
    }
    const { error } = await admin.auth.admin.updateUserById(memberId, {
      app_metadata: staffRolePatch(current.user?.app_metadata, role),
    })
    if (error) throw new Error('Falha ao alterar o papel.')
    await writeAudit({
      action: 'team_change_role',
      entity: 'auth.users',
      entityId: memberId,
      reason,
      before: { admin_role: before ?? null },
      after: { admin_role: role },
    })
    return undefined
  })
}

export async function removeMemberAccess(memberId: string, reason: string): Promise<ActionResult> {
  return runAction(async () => {
    const { user } = await requireAdmin()
    if (memberId === user.id) throw new Error('Você não pode remover o próprio acesso.')
    const admin = createAdminClient()
    const { data: current } = await admin.auth.admin.getUserById(memberId)
    const before = current.user?.app_metadata?.admin_role || current.user?.app_metadata?.role
    if (before === 'admin' && (await countAdmins()) <= 1) {
      throw new Error('Não é possível remover o último administrador.')
    }
    // Sem papel, o middleware recusa a próxima requisição do membro.
    const { error } = await admin.auth.admin.updateUserById(memberId, {
      app_metadata: staffRolePatch(current.user?.app_metadata, null),
    })
    if (error) throw new Error('Falha ao remover o acesso.')
    await writeAudit({
      action: 'team_remove_access',
      entity: 'auth.users',
      entityId: memberId,
      reason,
      before: { admin_role: before ?? null },
      after: { admin_role: null },
    })
    return undefined
  })
}
