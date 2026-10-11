import 'server-only'
import { getStaffContext } from '@/server/context'
import { formatCNPJ, formatCRMV } from '@/lib/format'
import type { VerificationItem, VerificationStatus } from '@/types/admin'
import { assertNoError, hoursSince } from './_util'

export async function listVerifications(
  type: 'VET' | 'CLINIC',
  status: VerificationStatus
): Promise<VerificationItem[]> {
  const { supabase } = await getStaffContext()

  if (type === 'VET') {
    const { data: vets, error } = await supabase
      .from('vets')
      .select('id, crmv, crmv_state, city, verification_status, verification_note')
      .eq('verification_status', status)
      .limit(200)
    assertNoError(error, 'Falha ao carregar a fila de profissionais')
    const ids = (vets ?? []).map((v) => v.id)
    if (ids.length === 0) return []

    const [profilesRes, vsRes, docsRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name, created_at').in('id', ids),
      supabase.from('vet_specialties').select('vet_id, specialty_id').in('vet_id', ids),
      supabase.from('vet_documents').select('id, vet_id, file_name, document_type').in('vet_id', ids),
    ])
    assertNoError(profilesRes.error, 'Falha ao carregar perfis')
    const specIds = [...new Set((vsRes.data ?? []).map((v) => v.specialty_id))]
    const { data: specs } = specIds.length
      ? await supabase.from('specialties').select('id, name').in('id', specIds)
      : { data: [] as Array<{ id: string; name: string }> }
    const specName = new Map((specs ?? []).map((s) => [s.id, s.name]))
    const profiles = new Map((profilesRes.data ?? []).map((p) => [p.id, p]))

    return (vets ?? [])
      .map((v) => {
        const p = profiles.get(v.id)
        const createdAt = p?.created_at ?? new Date().toISOString()
        return {
          userId: v.id,
          type: 'VET' as const,
          name: p?.full_name ?? 'Sem nome',
          identifier: formatCRMV(v.crmv, v.crmv_state),
          cnpj: null,
          city: v.city,
          status: v.verification_status,
          createdAt,
          hoursInQueue: hoursSince(createdAt),
          specialties: (vsRes.data ?? [])
            .filter((x) => x.vet_id === v.id)
            .map((x) => specName.get(x.specialty_id))
            .filter((n): n is string => Boolean(n)),
          documents: (docsRes.data ?? [])
            .filter((d) => d.vet_id === v.id)
            .map((d) => ({ id: d.id, name: d.file_name, type: d.document_type })),
          note: v.verification_note,
          address: null,
        }
      })
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  const { data: clinics, error } = await supabase
    .from('clinics')
    .select('id, name, cnpj, city, address, verification_status, verification_note')
    .eq('verification_status', status)
    .limit(200)
  assertNoError(error, 'Falha ao carregar a fila de clínicas')
  const ids = (clinics ?? []).map((c) => c.id)
  if (ids.length === 0) return []
  const { data: profiles } = await supabase.from('profiles').select('id, full_name, created_at').in('id', ids)
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

  return (clinics ?? [])
    .map((c) => {
      const p = profileMap.get(c.id)
      const createdAt = p?.created_at ?? new Date().toISOString()
      return {
        userId: c.id,
        type: 'CLINIC' as const,
        name: c.name || p?.full_name || 'Sem nome',
        identifier: formatCNPJ(c.cnpj),
        cnpj: c.cnpj,
        city: c.city,
        status: c.verification_status,
        createdAt,
        hoursInQueue: hoursSince(createdAt),
        specialties: [],
        documents: [],
        note: c.verification_note,
        address: c.address,
      }
    })
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}
