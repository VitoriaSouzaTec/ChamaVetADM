import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffContext } from '@/server/context'
import type { AdminRole } from '@/types/database'

export interface StaffMember {
  id: string
  name: string
  email: string
  role: AdminRole
  mfaActive: boolean
  lastAccess: string | null
  invitedPending: boolean
  isCurrentUser: boolean
}

export async function listStaff(): Promise<StaffMember[]> {
  const { user, role } = await getStaffContext()
  if (role !== 'admin') throw new Error('Sem permissão para ver a equipe.')

  const admin = createAdminClient()
  const members: StaffMember[] = []
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error('Falha ao listar a equipe no Supabase Auth.')
    for (const u of data.users) {
      const r = u.app_metadata?.admin_role || u.app_metadata?.role
      if (r !== 'admin' && r !== 'support') continue
      members.push({
        id: u.id,
        name: (u.user_metadata?.full_name as string | undefined) || u.email?.split('@')[0] || u.id,
        email: u.email ?? '',
        role: r,
        mfaActive: (u.factors ?? []).some((f) => f.status === 'verified'),
        lastAccess: u.last_sign_in_at ?? null,
        invitedPending: !u.last_sign_in_at,
        isCurrentUser: u.id === user.id,
      })
    }
    if (data.users.length < 1000) break
  }
  return members.sort((a, b) => a.role.localeCompare(b.role) || a.name.localeCompare(b.name))
}
