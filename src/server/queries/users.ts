import 'server-only'
import { getStaffContext, fetchAuthUsers, fetchProfileNames } from '@/server/context'
import { formatCNPJ, formatCRMV, maskPhone } from '@/lib/format'
import type {
  AccountStatus,
  AppRole,
  AuditItem,
  NoteItem,
  SubscriptionStatus,
  UserListItem,
  VerificationStatus,
} from '@/types/admin'
import { assertNoError, sanitizeSearch } from './_util'

export const USERS_PAGE_SIZE = 25

export interface UserFilters {
  q?: string
  role?: string
  status?: string
  verification?: string
  page?: number
}

export async function listUsers(filters: UserFilters) {
  const { supabase } = await getStaffContext()
  const page = Math.max(1, filters.page ?? 1)
  const q = sanitizeSearch(filters.q)

  let query = supabase
    .from('profiles')
    .select('id, role, full_name, phone, account_status, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * USERS_PAGE_SIZE, page * USERS_PAGE_SIZE - 1)

  if (filters.role && filters.role !== 'ALL') query = query.eq('role', filters.role as AppRole)
  if (filters.status && filters.status !== 'ALL') {
    query = query.eq('account_status', filters.status as AccountStatus)
  }

  if (filters.verification && filters.verification !== 'ALL') {
    const status = filters.verification as VerificationStatus
    const [vets, clinics] = await Promise.all([
      supabase.from('vets').select('id').eq('verification_status', status),
      supabase.from('clinics').select('id').eq('verification_status', status),
    ])
    assertNoError(vets.error, 'Falha ao filtrar verificação')
    assertNoError(clinics.error, 'Falha ao filtrar verificação')
    const ids = [...(vets.data ?? []), ...(clinics.data ?? [])].map((r) => r.id)
    if (ids.length === 0) return { users: [] as UserListItem[], total: 0, page }
    query = query.in('id', ids)
  }

  if (q) {
    const digits = q.replace(/\D/g, '')
    const [vets, clinics] = await Promise.all([
      supabase.from('vets').select('id').ilike('crmv', `%${q}%`).limit(50),
      supabase
        .from('clinics')
        .select('id')
        .or(`name.ilike.%${q}%${digits.length >= 4 ? `,cnpj.ilike.%${digits}%` : ''}`)
        .limit(50),
    ])
    const ids = [...(vets.data ?? []), ...(clinics.data ?? [])].map((r) => r.id)
    const ors = [`full_name.ilike.%${q}%`]
    if (digits.length >= 4) ors.push(`phone.ilike.%${digits}%`)
    if (ids.length) ors.push(`id.in.(${ids.join(',')})`)
    query = query.or(ors.join(','))
  }

  const { data: profiles, error, count } = await query
  assertNoError(error, 'Falha ao carregar usuários')
  const rows = profiles ?? []
  const ids = rows.map((p) => p.id)

  const [vetsRes, clinicsRes, subsRes, creditsRes, authUsers] = await Promise.all([
    supabase
      .from('vets')
      .select('id, crmv, crmv_state, verification_status, city, rating_avg, rating_count')
      .in('id', ids),
    supabase
      .from('clinics')
      .select('id, name, cnpj, verification_status, city, rating_avg, rating_count')
      .in('id', ids),
    supabase
      .from('subscriptions')
      .select('user_id, status, created_at')
      .in('user_id', ids)
      .order('created_at', { ascending: false }),
    supabase.from('clinic_credits').select('clinic_id, amount').in('clinic_id', ids),
    fetchAuthUsers(ids),
  ])
  assertNoError(vetsRes.error, 'Falha ao carregar profissionais')
  assertNoError(clinicsRes.error, 'Falha ao carregar clínicas')

  const vets = new Map((vetsRes.data ?? []).map((v) => [v.id, v]))
  const clinics = new Map((clinicsRes.data ?? []).map((c) => [c.id, c]))
  const subs = new Map<string, SubscriptionStatus>()
  for (const s of subsRes.data ?? []) if (!subs.has(s.user_id)) subs.set(s.user_id, s.status)
  const credits = new Map<string, number>()
  for (const c of creditsRes.data ?? []) credits.set(c.clinic_id, (credits.get(c.clinic_id) ?? 0) + c.amount)

  const users: UserListItem[] = rows.map((p) => {
    const vet = vets.get(p.id)
    const clinic = clinics.get(p.id)
    const auth = authUsers.get(p.id)
    return {
      id: p.id,
      fullName: clinic?.name || p.full_name,
      email: auth?.email ?? null,
      maskedPhone: maskPhone(p.phone),
      role: p.role,
      status: p.account_status,
      verificationStatus: vet?.verification_status ?? clinic?.verification_status ?? null,
      identifier: vet ? formatCRMV(vet.crmv, vet.crmv_state) : clinic ? formatCNPJ(clinic.cnpj) : '-',
      city: vet?.city ?? clinic?.city ?? null,
      ratingAvg: vet?.rating_avg ?? clinic?.rating_avg ?? null,
      ratingCount: vet?.rating_count ?? clinic?.rating_count ?? 0,
      createdAt: p.created_at,
      lastAccess: auth?.lastSignInAt ?? null,
      subscriptionStatus: p.role === 'CLINIC' ? null : subs.get(p.id) ?? null,
      credits: p.role === 'CLINIC' ? credits.get(p.id) ?? 0 : null,
    }
  })

  return { users, total: count ?? users.length, page }
}

export async function getUserDetail(userId: string) {
  const { supabase } = await getStaffContext()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  assertNoError(error, 'Falha ao carregar o usuário')
  if (!profile) return null

  const isClinic = profile.role === 'CLINIC'

  const [
    vetRes,
    clinicRes,
    authUsers,
    subsRes,
    paymentsRes,
    creditsRes,
    reviewsReceivedRes,
    reviewsMadeRes,
    reportsByRes,
    reportsAgainstRes,
    docsRes,
    notesRes,
    auditRes,
    activityRes,
  ] = await Promise.all([
    supabase.from('vets').select('*').eq('id', userId).maybeSingle(),
    supabase.from('clinics').select('*').eq('id', userId).maybeSingle(),
    fetchAuthUsers([userId]),
    supabase.from('subscriptions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('payments').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
    supabase.from('clinic_credits').select('*').eq('clinic_id', userId).order('created_at', { ascending: false }),
    supabase.from('reviews').select('*').eq('reviewed_id', userId).order('created_at', { ascending: false }).limit(50),
    supabase.from('reviews').select('*').eq('reviewer_id', userId).order('created_at', { ascending: false }).limit(50),
    supabase.from('reports').select('*').eq('reporter_id', userId).order('created_at', { ascending: false }),
    supabase
      .from('reports')
      .select('*')
      .eq('target_type', 'PROFILE')
      .eq('target_id', userId)
      .order('created_at', { ascending: false }),
    supabase.from('vet_documents').select('*').eq('vet_id', userId).order('created_at', { ascending: false }),
    supabase
      .from('staff_notes')
      .select('*')
      .eq('target_type', 'PROFILE')
      .eq('target_id', userId)
      .order('created_at', { ascending: false }),
    supabase.from('audit_logs').select('*').eq('entity_id', userId).order('created_at', { ascending: false }).limit(100),
    isClinic
      ? supabase
          .from('requests')
          .select('id, type, status, start_date, created_at, specialty_id')
          .eq('clinic_id', userId)
          .order('created_at', { ascending: false })
          .limit(50)
      : supabase
          .from('interests')
          .select('id, request_id, status, created_at')
          .eq('vet_id', userId)
          .order('created_at', { ascending: false })
          .limit(50),
  ])

  // Atividade: para profissional, resolve as solicitações dos interesses.
  type ActivityRow = { id: string; requestId: string; title: string; subtitle: string; status: string; date: string }
  let activity: ActivityRow[] = []
  if (isClinic) {
    const reqs = (activityRes.data ?? []) as Array<{ id: string; type: string; status: string; start_date: string | null; created_at: string }>
    activity = reqs.map((r) => ({
      id: r.id,
      requestId: r.id,
      title: r.type,
      subtitle: 'Solicitação publicada',
      status: r.status,
      date: r.start_date ?? r.created_at,
    }))
  } else {
    const interests = (activityRes.data ?? []) as Array<{ id: string; request_id: string; status: string; created_at: string }>
    const reqIds = interests.map((i) => i.request_id)
    const { data: reqs } = reqIds.length
      ? await supabase.from('requests').select('id, type, clinic_id').in('id', reqIds)
      : { data: [] as Array<{ id: string; type: string; clinic_id: string }> }
    const clinicNames = await fetchClinicNames((reqs ?? []).map((r) => r.clinic_id))
    const reqMap = new Map((reqs ?? []).map((r) => [r.id, r]))
    activity = interests.map((i) => {
      const r = reqMap.get(i.request_id)
      return {
        id: i.id,
        requestId: i.request_id,
        title: r?.type ?? 'Solicitação',
        subtitle: `Interesse em ${r ? clinicNames.get(r.clinic_id) ?? 'clínica' : 'clínica'}`,
        status: i.status,
        date: i.created_at,
      }
    })
  }

  const reviewsReceived = reviewsReceivedRes.data ?? []
  const reviewsMade = reviewsMadeRes.data ?? []
  const notes = notesRes.data ?? []
  const audit = auditRes.data ?? []

  const otherIds = [
    ...reviewsReceived.map((r) => r.reviewer_id),
    ...reviewsMade.map((r) => r.reviewed_id),
  ]
  const staffIds = [...notes.map((n) => n.author_id), ...audit.map((a) => a.actor_id)]
  const [names, staff] = await Promise.all([fetchProfileNames(otherIds), fetchAuthUsers(staffIds)])
  const staffName = (id: string) => staff.get(id)?.name || staff.get(id)?.email || 'Equipe'

  const vet = vetRes.data
  const clinic = clinicRes.data
  const auth = authUsers.get(userId)
  const credits = (creditsRes.data ?? []).reduce((sum, c) => sum + c.amount, 0)

  const auditItems: AuditItem[] = audit.map((a) => ({
    id: a.id,
    createdAt: a.created_at,
    actorName: staffName(a.actor_id),
    actorRole: a.actor_role,
    action: a.action,
    entity: a.entity,
    entityId: a.entity_id,
    reason: a.reason,
    before: a.before,
    after: a.after,
    metadata: a.metadata,
  }))

  const noteItems: NoteItem[] = notes.map((n) => ({
    id: n.id,
    authorName: staffName(n.author_id),
    body: n.body,
    createdAt: n.created_at,
  }))

  return {
    id: profile.id,
    fullName: clinic?.name || profile.full_name,
    personName: profile.full_name,
    role: profile.role,
    status: profile.account_status,
    suspendedUntil: profile.suspended_until,
    suspensionReason: profile.suspension_reason,
    onboardingCompleted: profile.onboarding_completed,
    maskedPhone: maskPhone(profile.phone),
    hasPhone: Boolean(profile.phone),
    email: auth?.email ?? null,
    lastAccess: auth?.lastSignInAt ?? null,
    createdAt: profile.created_at,
    identifier: vet ? formatCRMV(vet.crmv, vet.crmv_state) : clinic ? formatCNPJ(clinic.cnpj) : '-',
    crmv: vet?.crmv ?? null,
    crmvState: vet?.crmv_state ?? null,
    cnpj: clinic?.cnpj ?? null,
    city: vet?.city ?? clinic?.city ?? null,
    verificationStatus: vet?.verification_status ?? clinic?.verification_status ?? null,
    verificationNote: vet?.verification_note ?? clinic?.verification_note ?? null,
    ratingAvg: vet?.rating_avg ?? clinic?.rating_avg ?? null,
    ratingCount: vet?.rating_count ?? clinic?.rating_count ?? 0,
    subscription: (subsRes.data ?? [])[0] ?? null,
    payments: paymentsRes.data ?? [],
    creditsBalance: credits,
    creditsLedger: creditsRes.data ?? [],
    activity,
    reviewsReceived: reviewsReceived.map((r) => ({ ...r, otherName: names.get(r.reviewer_id) ?? 'Usuário' })),
    reviewsMade: reviewsMade.map((r) => ({ ...r, otherName: names.get(r.reviewed_id) ?? 'Usuário' })),
    reportsBy: reportsByRes.data ?? [],
    reportsAgainst: reportsAgainstRes.data ?? [],
    documents: (docsRes.data ?? []).map((d) => ({
      id: d.id,
      name: d.file_name,
      type: d.document_type,
      createdAt: d.created_at,
    })),
    notes: noteItems,
    audit: auditItems,
  }
}

export type UserDetail = NonNullable<Awaited<ReturnType<typeof getUserDetail>>>

/** Nome de exibição de clínicas (clinics.name, senão profiles.full_name). */
export async function fetchClinicNames(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))]
  const map = new Map<string, string>()
  if (unique.length === 0) return map
  const { supabase } = await getStaffContext()
  const { data } = await supabase.from('clinics').select('id, name').in('id', unique)
  for (const c of data ?? []) if (c.name) map.set(c.id, c.name)
  const missing = unique.filter((id) => !map.has(id))
  if (missing.length) {
    const profiles = await fetchProfileNames(missing)
    profiles.forEach((name, id) => map.set(id, name))
  }
  return map
}
