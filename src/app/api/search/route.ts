import { NextResponse } from 'next/server'
import { getStaffContext } from '@/server/context'
import { formatCNPJ, formatCRMV } from '@/lib/format'
import { fetchClinicNames } from '@/server/queries/users'
import { sanitizeSearch } from '@/server/queries/_util'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = sanitizeSearch(searchParams.get('q'))

  if (q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  let supabase
  try {
    ;({ supabase } = await getStaffContext())
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const digits = q.replace(/\D/g, '')
  const [vetsByCrmv, clinicsByName, profilesByName, requestsRes] = await Promise.all([
    supabase.from('vets').select('id').ilike('crmv', `%${q}%`).limit(5),
    supabase
      .from('clinics')
      .select('id')
      .or(`name.ilike.%${q}%${digits.length >= 4 ? `,cnpj.ilike.%${digits}%` : ''}`)
      .limit(5),
    supabase.from('profiles').select('id').ilike('full_name', `%${q}%`).limit(8),
    supabase
      .from('requests')
      .select('id, type, urgent, clinic_id, start_date')
      .ilike('type', `%${q}%`)
      .order('created_at', { ascending: false })
      .limit(4),
  ])

  const userIds = [
    ...new Set([
      ...(profilesByName.data ?? []).map((r) => r.id),
      ...(vetsByCrmv.data ?? []).map((r) => r.id),
      ...(clinicsByName.data ?? []).map((r) => r.id),
    ]),
  ].slice(0, 8)

  const [profilesRes, vetsRes, clinicsRes] = userIds.length
    ? await Promise.all([
        supabase.from('profiles').select('id, full_name, role').in('id', userIds),
        supabase.from('vets').select('id, crmv, crmv_state, city, verification_status').in('id', userIds),
        supabase.from('clinics').select('id, name, cnpj, city, verification_status').in('id', userIds),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }]

  const vets = new Map((vetsRes.data ?? []).map((v) => [v.id, v]))
  const clinics = new Map((clinicsRes.data ?? []).map((c) => [c.id, c]))

  const userResults = (profilesRes.data ?? []).map((p) => {
    const vet = vets.get(p.id)
    const clinic = clinics.get(p.id)
    const doc = vet ? formatCRMV(vet.crmv, vet.crmv_state) : clinic ? formatCNPJ(clinic.cnpj) : ''
    const city = vet?.city ?? clinic?.city ?? ''
    const verified = (vet?.verification_status ?? clinic?.verification_status) === 'VERIFIED'
    return {
      id: p.id,
      title: clinic?.name || p.full_name,
      subtitle: [p.role, doc, city].filter(Boolean).join(' · '),
      type: 'user' as const,
      badge: verified ? 'Verificado' : undefined,
    }
  })

  const requests = requestsRes.data ?? []
  const clinicNames = await fetchClinicNames(requests.map((r) => r.clinic_id))
  const requestResults = requests.map((r) => ({
    id: r.id,
    title: r.type,
    subtitle: `${clinicNames.get(r.clinic_id) ?? 'Clínica'}${r.start_date ? ` · ${r.start_date.slice(0, 10)}` : ''}`,
    type: 'request' as const,
    badge: r.urgent ? 'Urgente' : undefined,
  }))

  return NextResponse.json({
    results: [...userResults, ...requestResults].slice(0, 8),
  })
}
