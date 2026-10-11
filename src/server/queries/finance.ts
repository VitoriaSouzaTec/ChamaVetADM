import 'server-only'
import { getStaffContext, fetchAuthUsers, fetchProfileNames } from '@/server/context'
import { fetchClinicNames } from './users'
import { assertNoError } from './_util'

export async function getFinanceData() {
  const { supabase, role } = await getStaffContext()
  if (role !== 'admin') throw new Error('Sem permissão para ver o financeiro.')

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const [paymentsRes, monthRes, subsRes, creditsRes, eventsRes, pricingRes] = await Promise.all([
    supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(200),
    supabase
      .from('payments')
      .select('amount_cents, type')
      .eq('status', 'CONFIRMED')
      .gte('created_at', monthStart.toISOString()),
    supabase.from('subscriptions').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('clinic_credits').select('*').order('created_at', { ascending: false }).limit(200),
    supabase
      .from('payment_events')
      .select('*')
      .neq('status', 'PROCESSED')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('pricing').select('key, amount_cents'),
  ])
  assertNoError(paymentsRes.error, 'Falha ao carregar pagamentos')
  assertNoError(subsRes.error, 'Falha ao carregar assinaturas')

  const payments = paymentsRes.data ?? []
  const subs = subsRes.data ?? []
  const credits = creditsRes.data ?? []
  const monthPayments = monthRes.data ?? []

  const [names, clinicNames, staff] = await Promise.all([
    fetchProfileNames([...payments.map((p) => p.user_id), ...subs.map((s) => s.user_id)]),
    fetchClinicNames(credits.map((c) => c.clinic_id)),
    fetchAuthUsers(credits.map((c) => c.granted_by).filter((x): x is string => Boolean(x))),
  ])

  const subscriptionPrice =
    (pricingRes.data ?? []).find((p) => /sub/i.test(p.key))?.amount_cents ?? null
  const subsByStatus = { TRIAL: 0, ACTIVE: 0, OVERDUE: 0, CANCELED: 0 }
  for (const s of subs) subsByStatus[s.status]++

  return {
    overview: {
      monthRevenueCents: monthPayments.reduce((sum, p) => sum + p.amount_cents, 0),
      monthPublicationsPaid: monthPayments.filter((p) => p.type === 'PUBLICATION').length,
      mrrCents: subscriptionPrice !== null ? subsByStatus.ACTIVE * subscriptionPrice : null,
      subsByStatus,
      creditsGranted: credits.filter((c) => c.amount > 0).reduce((sum, c) => sum + c.amount, 0),
    },
    payments: payments.map((p) => ({
      id: p.id,
      userId: p.user_id,
      userName: names.get(p.user_id) ?? 'Usuário',
      type: p.type,
      amountCents: p.amount_cents,
      method: p.method,
      status: p.status,
      gatewayId: p.gateway_id,
      createdAt: p.created_at,
    })),
    subscriptions: subs.map((s) => ({
      id: s.id,
      userId: s.user_id,
      userName: names.get(s.user_id) ?? 'Profissional',
      status: s.status,
      currentPeriodEnd: s.current_period_end,
      trialEnd: s.trial_end,
      method: s.method,
    })),
    credits: credits.map((c) => ({
      id: c.id,
      clinicId: c.clinic_id,
      clinicName: clinicNames.get(c.clinic_id) ?? 'Clínica',
      amount: c.amount,
      reason: c.reason,
      grantedBy: c.granted_by ? staff.get(c.granted_by)?.name || staff.get(c.granted_by)?.email || 'Equipe' : 'Sistema',
      createdAt: c.created_at,
    })),
    events: (eventsRes.data ?? []).map((e) => ({
      id: e.id,
      eventType: e.event_type,
      gatewayId: e.gateway_id,
      status: e.status,
      error: e.error,
      payload: e.payload,
      createdAt: e.created_at,
    })),
  }
}

export type FinanceData = Awaited<ReturnType<typeof getFinanceData>>
