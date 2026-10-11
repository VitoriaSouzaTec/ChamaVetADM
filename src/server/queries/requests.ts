import 'server-only'
import { getStaffContext, fetchAuthUsers, fetchProfileNames } from '@/server/context'
import { formatCRMV } from '@/lib/format'
import type { NoteItem, RequestListItem, RequestStatus } from '@/types/admin'
import { fetchClinicNames } from './users'
import { assertNoError, sanitizeSearch } from './_util'

export const REQUESTS_PAGE_SIZE = 25

export interface RequestFilters {
  q?: string
  status?: string
  urgent?: boolean
  stale?: boolean
  hidden?: boolean
  page?: number
}

export async function listRequests(filters: RequestFilters) {
  const { supabase } = await getStaffContext()
  const page = Math.max(1, filters.page ?? 1)
  const q = sanitizeSearch(filters.q)

  let query = supabase
    .from('requests')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * REQUESTS_PAGE_SIZE, page * REQUESTS_PAGE_SIZE - 1)

  if (filters.status && filters.status !== 'ALL') query = query.eq('status', filters.status as RequestStatus)
  if (filters.urgent) query = query.eq('urgent', true)
  if (filters.hidden) query = query.eq('moderation_status', 'HIDDEN')
  if (filters.stale) {
    // Urgentes abertas publicadas há mais de 2h (sem interessados é filtrado abaixo).
    const twoHoursAgo = new Date(Date.now() - 2 * 3_600_000).toISOString()
    query = query.eq('urgent', true).eq('status', 'OPEN').lt('published_at', twoHoursAgo)
  }

  if (q) {
    const [clinics, specs] = await Promise.all([
      supabase.from('clinics').select('id').or(`name.ilike.%${q}%,city.ilike.%${q}%`).limit(100),
      supabase.from('specialties').select('id').ilike('name', `%${q}%`).limit(50),
    ])
    const ors = [`type.ilike.%${q}%`, `description.ilike.%${q}%`]
    const clinicIds = (clinics.data ?? []).map((c) => c.id)
    const specIds = (specs.data ?? []).map((s) => s.id)
    if (clinicIds.length) ors.push(`clinic_id.in.(${clinicIds.join(',')})`)
    if (specIds.length) ors.push(`specialty_id.in.(${specIds.join(',')})`)
    query = query.or(ors.join(','))
  }

  const { data, error, count } = await query
  assertNoError(error, 'Falha ao carregar solicitações')
  const rows = data ?? []

  const items = await toRequestItems(rows)
  const filtered = filters.stale ? items.filter((r) => r.interestsCount === 0) : items
  return { requests: filtered, total: count ?? filtered.length, page }
}

type RequestRow = {
  id: string
  clinic_id: string
  specialty_id: string | null
  type: string
  description: string
  start_date: string | null
  price: number | null
  urgent: boolean
  status: RequestStatus
  moderation_status: 'VISIBLE' | 'HIDDEN'
  published_at: string | null
  created_at: string
}

async function toRequestItems(rows: RequestRow[]): Promise<RequestListItem[]> {
  if (rows.length === 0) return []
  const { supabase } = await getStaffContext()
  const ids = rows.map((r) => r.id)
  const clinicIds = rows.map((r) => r.clinic_id)
  const specIds = [...new Set(rows.map((r) => r.specialty_id).filter((x): x is string => Boolean(x)))]

  const [clinicsRes, specsRes, interestsRes, clinicNames] = await Promise.all([
    supabase.from('clinics').select('id, city').in('id', clinicIds),
    specIds.length
      ? supabase.from('specialties').select('id, name').in('id', specIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    supabase.from('interests').select('request_id').in('request_id', ids),
    fetchClinicNames(clinicIds),
  ])
  const city = new Map((clinicsRes.data ?? []).map((c) => [c.id, c.city]))
  const spec = new Map((specsRes.data ?? []).map((s) => [s.id, s.name]))
  const interestCount = new Map<string, number>()
  for (const i of interestsRes.data ?? []) interestCount.set(i.request_id, (interestCount.get(i.request_id) ?? 0) + 1)

  return rows.map((r) => ({
    id: r.id,
    clinicId: r.clinic_id,
    clinicName: clinicNames.get(r.clinic_id) ?? 'Clínica',
    city: city.get(r.clinic_id) ?? null,
    specialtyName: (r.specialty_id && spec.get(r.specialty_id)) || 'Sem especialidade',
    type: r.type,
    description: r.description,
    startDate: r.start_date,
    price: r.price,
    urgent: r.urgent,
    status: r.status,
    moderationStatus: r.moderation_status,
    interestsCount: interestCount.get(r.id) ?? 0,
    publishedAt: r.published_at,
    createdAt: r.created_at,
  }))
}

export async function getRequestDetail(requestId: string) {
  const { supabase } = await getStaffContext()
  const { data: req, error } = await supabase.from('requests').select('*').eq('id', requestId).maybeSingle()
  assertNoError(error, 'Falha ao carregar a solicitação')
  if (!req) return null

  const [[item], interestsRes, invitationsRes, reviewsRes, notesRes] = await Promise.all([
    toRequestItems([req]),
    supabase.from('interests').select('*').eq('request_id', requestId).order('created_at'),
    supabase.from('invitations').select('*').eq('request_id', requestId).order('created_at'),
    supabase.from('reviews').select('*').eq('request_id', requestId).order('created_at'),
    supabase
      .from('staff_notes')
      .select('*')
      .eq('target_type', 'REQUEST')
      .eq('target_id', requestId)
      .order('created_at', { ascending: false }),
  ])

  const interests = interestsRes.data ?? []
  const invitations = invitationsRes.data ?? []
  const reviews = reviewsRes.data ?? []
  const notes = notesRes.data ?? []
  const vetIds = [...interests.map((i) => i.vet_id), ...invitations.map((i) => i.vet_id)]
  if (req.accepted_vet_id) vetIds.push(req.accepted_vet_id)

  const [vetsRes, names, staff] = await Promise.all([
    vetIds.length
      ? supabase.from('vets').select('id, crmv, crmv_state').in('id', vetIds)
      : Promise.resolve({ data: [] as Array<{ id: string; crmv: string | null; crmv_state: string | null }> }),
    fetchProfileNames([...vetIds, ...reviews.flatMap((r) => [r.reviewer_id, r.reviewed_id])]),
    fetchAuthUsers(notes.map((n) => n.author_id)),
  ])
  const vets = new Map((vetsRes.data ?? []).map((v) => [v.id, v]))
  const vetLabel = (id: string) => {
    const v = vets.get(id)
    return v?.crmv ? `CRMV ${formatCRMV(v.crmv, v.crmv_state)}` : ''
  }

  const noteItems: NoteItem[] = notes.map((n) => ({
    id: n.id,
    authorName: staff.get(n.author_id)?.name || staff.get(n.author_id)?.email || 'Equipe',
    body: n.body,
    createdAt: n.created_at,
  }))

  return {
    ...item,
    targetProfessional: req.target_professional,
    endDate: req.end_date,
    moderationReason: req.moderation_reason,
    acceptedVetId: req.accepted_vet_id,
    acceptedVetName: req.accepted_vet_id ? names.get(req.accepted_vet_id) ?? null : null,
    interests: interests.map((i) => ({
      id: i.id,
      vetId: i.vet_id,
      vetName: names.get(i.vet_id) ?? 'Profissional',
      vetLabel: vetLabel(i.vet_id),
      message: i.message,
      status: i.status,
      createdAt: i.created_at,
    })),
    invitations: invitations.map((i) => ({
      id: i.id,
      vetId: i.vet_id,
      vetName: names.get(i.vet_id) ?? 'Profissional',
      status: i.status,
      createdAt: i.created_at,
    })),
    reviews: reviews.map((r) => ({
      id: r.id,
      reviewerName: names.get(r.reviewer_id) ?? 'Usuário',
      reviewedName: names.get(r.reviewed_id) ?? 'Usuário',
      rating: r.rating,
      comment: r.comment,
      moderationStatus: r.moderation_status,
      createdAt: r.created_at,
    })),
    notes: noteItems,
  }
}

export type RequestDetail = NonNullable<Awaited<ReturnType<typeof getRequestDetail>>>
