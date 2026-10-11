import 'server-only'
import { getStaffContext, fetchAuthUsers, fetchProfileNames } from '@/server/context'
import type { ReportListItem, ReportStatus, ReportTargetType } from '@/types/admin'
import { assertNoError } from './_util'

const PRIORITY_ORDER = { HIGH: 0, NORMAL: 1, LOW: 2 } as const
const SLA_HOURS = { HIGH: 4, NORMAL: 24, LOW: 24 } as const

type ReportRow = {
  id: string
  reporter_id: string
  target_type: ReportTargetType
  target_id: string
  reason: string
  description: string | null
  status: ReportStatus
  priority: 'LOW' | 'NORMAL' | 'HIGH'
  assigned_to: string | null
  resolution_note: string | null
  resolved_at: string | null
  created_at: string
}

/** Título legível do alvo (perfil, solicitação ou avaliação). */
async function resolveTargetTitles(rows: Pick<ReportRow, 'target_type' | 'target_id'>[]) {
  const { supabase } = await getStaffContext()
  const byType = (t: ReportTargetType) => rows.filter((r) => r.target_type === t).map((r) => r.target_id)
  const [profileNames, requestsRes, reviewsRes] = await Promise.all([
    fetchProfileNames(byType('PROFILE')),
    byType('REQUEST').length
      ? supabase.from('requests').select('id, type').in('id', byType('REQUEST'))
      : Promise.resolve({ data: [] as Array<{ id: string; type: string }> }),
    byType('REVIEW').length
      ? supabase.from('reviews').select('id, rating, comment, reviewed_id').in('id', byType('REVIEW'))
      : Promise.resolve({ data: [] as Array<{ id: string; rating: number; comment: string | null; reviewed_id: string }> }),
  ])
  const titles = new Map<string, string>()
  profileNames.forEach((name, id) => titles.set(id, name))
  for (const r of requestsRes.data ?? []) titles.set(r.id, `Solicitação: ${r.type}`)
  for (const r of reviewsRes.data ?? []) {
    titles.set(r.id, `Avaliação ${r.rating}★${r.comment ? `: "${r.comment.slice(0, 40)}"` : ''}`)
  }
  return { titles, reviews: reviewsRes.data ?? [] }
}

async function toReportItems(rows: ReportRow[]): Promise<ReportListItem[]> {
  const [{ titles }, reporters, staff] = await Promise.all([
    resolveTargetTitles(rows),
    fetchProfileNames(rows.map((r) => r.reporter_id)),
    fetchAuthUsers(rows.map((r) => r.assigned_to).filter((x): x is string => Boolean(x))),
  ])
  return rows.map((r) => {
    const ageHours = (Date.now() - new Date(r.created_at).getTime()) / 3_600_000
    const assigned = r.assigned_to ? staff.get(r.assigned_to) : null
    return {
      id: r.id,
      reporterId: r.reporter_id,
      reporterName: reporters.get(r.reporter_id) ?? 'Usuário',
      targetType: r.target_type,
      targetId: r.target_id,
      targetTitle: titles.get(r.target_id) ?? 'Alvo removido',
      reason: r.reason,
      description: r.description,
      status: r.status,
      priority: r.priority,
      assignedToName: r.assigned_to ? assigned?.name || assigned?.email || 'Equipe' : null,
      createdAt: r.created_at,
      slaHoursRemaining: Math.round((SLA_HOURS[r.priority] - ageHours) * 10) / 10,
    }
  })
}

export async function listReports(status: ReportStatus): Promise<ReportListItem[]> {
  const { supabase } = await getStaffContext()
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: true })
    .limit(200)
  assertNoError(error, 'Falha ao carregar denúncias')
  const items = await toReportItems(data ?? [])
  return items.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
}

export async function getReportDetail(reportId: string) {
  const { supabase } = await getStaffContext()
  const { data: report, error } = await supabase.from('reports').select('*').eq('id', reportId).maybeSingle()
  assertNoError(error, 'Falha ao carregar a denúncia')
  if (!report) return null

  const [[item], sameTargetRes, byReporterRes, { reviews }] = await Promise.all([
    toReportItems([report]),
    supabase
      .from('reports')
      .select('*')
      .eq('target_type', report.target_type)
      .eq('target_id', report.target_id)
      .neq('id', reportId)
      .order('created_at', { ascending: false }),
    supabase.from('reports').select('id, status, created_at').eq('reporter_id', report.reporter_id),
    resolveTargetTitles([report]),
  ])

  // Link do alvo: perfil → usuário; solicitação → solicitação; avaliação → usuário avaliado.
  let targetHref = `/usuarios/${report.target_id}`
  if (report.target_type === 'REQUEST') targetHref = `/solicitacoes/${report.target_id}`
  if (report.target_type === 'REVIEW') {
    const review = reviews.find((r) => r.id === report.target_id)
    targetHref = review ? `/usuarios/${review.reviewed_id}` : '/avaliacoes'
  }

  const byReporter = byReporterRes.data ?? []
  const closed = byReporter.filter((r) => r.status === 'RESOLVED' || r.status === 'DISMISSED')
  const resolved = closed.filter((r) => r.status === 'RESOLVED')
  const ninetyDaysAgo = Date.now() - 90 * 24 * 3_600_000

  return {
    ...item,
    resolutionNote: report.resolution_note,
    resolvedAt: report.resolved_at,
    targetHref,
    sameTarget: await toReportItems(sameTargetRes.data ?? []),
    reporterStats: {
      last90Days: byReporter.filter((r) => new Date(r.created_at).getTime() >= ninetyDaysAgo).length,
      total: byReporter.length,
      closed: closed.length,
      resolved: resolved.length,
    },
  }
}

export type ReportDetail = NonNullable<Awaited<ReturnType<typeof getReportDetail>>>
