import 'server-only'
import { getStaffContext } from '@/server/context'
import type { Json } from '@/types/database'
import { assertNoError } from './_util'

export async function getAppConfig() {
  const { supabase } = await getStaffContext()
  const { data, error } = await supabase.from('app_config').select('*').order('key')
  assertNoError(error, 'Falha ao carregar app_config')
  return data ?? []
}

export function configValueToWords(value: Json | undefined): string[] {
  if (Array.isArray(value)) return value.map(String)
  if (typeof value === 'string') return value.split(',').map((w) => w.trim()).filter(Boolean)
  return []
}

export async function getBlockedWords(): Promise<string[]> {
  const { supabase } = await getStaffContext()
  const { data } = await supabase.from('app_config').select('value').eq('key', 'blocked_words').maybeSingle()
  return configValueToWords(data?.value)
}

export async function getPricing() {
  const { supabase } = await getStaffContext()
  const { data, error } = await supabase.from('pricing').select('*').order('key')
  assertNoError(error, 'Falha ao carregar preços')
  return data ?? []
}

export async function getSpecialtiesWithUsage() {
  const { supabase } = await getStaffContext()
  const [specsRes, vsRes, reqRes] = await Promise.all([
    supabase.from('specialties').select('*').order('name'),
    supabase.from('vet_specialties').select('specialty_id'),
    supabase.from('requests').select('specialty_id').not('specialty_id', 'is', null),
  ])
  assertNoError(specsRes.error, 'Falha ao carregar especialidades')
  const count = (rows: Array<{ specialty_id: string | null }> | null, id: string) =>
    (rows ?? []).filter((r) => r.specialty_id === id).length
  return (specsRes.data ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    icon: s.icon,
    active: s.active,
    professionals: count(vsRes.data, s.id),
    requests: count(reqRes.data, s.id),
  }))
}

export async function getPriceHistory() {
  const { supabase } = await getStaffContext()
  const { data } = await supabase
    .from('audit_logs')
    .select('id, created_at, before, after, reason, entity_id')
    .eq('action', 'admin_update_price')
    .order('created_at', { ascending: false })
    .limit(20)
  return data ?? []
}

export async function listAnnouncements() {
  const { supabase } = await getStaffContext()
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30)
  assertNoError(error, 'Falha ao carregar comunicados')
  return data ?? []
}

/** Contagem de usuários ativos por papel (estimativa de destinatários). */
export async function countActiveUsersByRole() {
  const { supabase } = await getStaffContext()
  const roles = ['VET', 'AUXILIAR', 'CLINIC'] as const
  const counts = await Promise.all(
    roles.map((role) =>
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', role)
        .eq('account_status', 'ACTIVE')
    )
  )
  return Object.fromEntries(roles.map((r, i) => [r, counts[i].count ?? 0])) as Record<(typeof roles)[number], number>
}
