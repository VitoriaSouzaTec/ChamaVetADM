import React from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Clock,
  Users,
  FileText,
  TrendingUp,
  Star,
  ShieldAlert,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DashboardCharts } from '@/components/dashboard/dashboard-charts'
import { formatCurrency } from '@/lib/format'
import { getStaffContext, friendlyError } from '@/server/context'
import type { AdminRole } from '@/types/database'

interface DashboardMetrics {
  pending_verifications?: number
  open_reports?: number
  high_priority_reports?: number
  failed_payments?: number
  stale_urgent_requests?: number
  new_users_total?: number
  requests_published?: number
  fill_rate_percent?: number
  median_time_to_interest?: string
  active_subscriptions?: number
  mrr_cents?: number
  average_rating?: number
  chart_requests?: Array<{ date: string; publicadas: number; preenchidas: number }>
  chart_registrations?: Array<{ date: string; vet: number; auxiliar: number; clinica: number }>
  chart_specialties?: Array<{ name: string; count: number }>
  chart_revenue?: Array<{ date: string; receita_cents: number }>
}

const PERIODS = { '1': 'Hoje', '7': '7 dias', '30': '30 dias' } as const
type PeriodKey = keyof typeof PERIODS

async function loadMetrics(days: number): Promise<{
  role: AdminRole
  metrics: DashboardMetrics | null
  metricsError: string | null
}> {
  try {
    const { supabase, role } = await getStaffContext()
    const from = new Date()
    if (days === 1) from.setHours(0, 0, 0, 0)
    else from.setTime(Date.now() - days * 24 * 60 * 60 * 1000)

    const { data, error } = await supabase.rpc('admin_dashboard_metrics', {
      p_from: from.toISOString(),
      p_to: new Date().toISOString(),
    })
    if (error) return { role, metrics: null, metricsError: friendlyError(error.message) }
    return { role, metrics: data as DashboardMetrics | null, metricsError: null }
  } catch (err) {
    return {
      role: 'support',
      metrics: null,
      metricsError: err instanceof Error ? err.message : 'Falha ao carregar métricas.',
    }
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
  const period: PeriodKey = params.period && params.period in PERIODS ? (params.period as PeriodKey) : '30'

  const { role, metrics, metricsError } = await loadMetrics(Number(period))

  const isAdmin = role === 'admin'
  const show = (value: number | string | null | undefined) => value ?? '—'

  const pendingAttention = {
    verifications: show(metrics?.pending_verifications),
    openReports: show(metrics?.open_reports),
    highPriorityReports: show(metrics?.high_priority_reports),
    failedPayments: show(metrics?.failed_payments),
    staleUrgentRequests: show(metrics?.stale_urgent_requests),
  }

  const kpis = {
    newUsers: show(metrics?.new_users_total),
    requestsPublished: show(metrics?.requests_published),
    fillRate: metrics?.fill_rate_percent != null ? `${metrics.fill_rate_percent}%` : '—',
    medianTimeToInterest: show(metrics?.median_time_to_interest),
    activeSubscriptions: show(metrics?.active_subscriptions),
    mrr: metrics?.mrr_cents != null ? formatCurrency(metrics.mrr_cents) : '—',
    averageRating: metrics?.average_rating != null ? Number(metrics.average_rating).toFixed(2) : '—',
  }

  const requestsData = metrics?.chart_requests ?? []
  const registrationsData = metrics?.chart_registrations ?? []
  const specialtiesData = metrics?.chart_specialties ?? []
  const revenueData = metrics?.chart_revenue ?? []

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Topo / Título */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#1E293B]">
            Visão Geral da Plataforma
          </h1>
          <p className="text-sm text-[#64748B]">
            Acompanhamento de operações, pendências e métricas de desempenho
          </p>
        </div>

        {/* Seletor de período */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E2E8F0] shadow-xs text-xs">
          {(Object.keys(PERIODS) as PeriodKey[]).map((key) => (
            <Link
              key={key}
              href={key === '30' ? '/' : `/?period=${key}`}
              className={`px-3 py-1.5 rounded-lg ${
                period === key
                  ? 'bg-[#0F766E] text-white font-semibold shadow-xs'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              {PERIODS[key]}
            </Link>
          ))}
        </div>
      </div>

      {metricsError && (
        <div className="p-4 rounded-xl bg-[#FEE2E2] border border-[#FECACA] text-sm text-[#DC2626]">
          <strong>Métricas indisponíveis:</strong> {metricsError} (função admin_dashboard_metrics)
        </div>
      )}

      {/* Seção 1: Precisa de Atenção */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="h-4 w-4 text-[#F97316]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#64748B]">
            Precisa de Atenção Hoje
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Verificações Pendentes */}
          <Link href="/verificacoes">
            <Card className="hover:border-[#0F766E] transition-all hover:shadow-md cursor-pointer border-l-4 border-l-[#F97316]">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-[#64748B]">Verificações Pendentes</p>
                  <p className="text-2xl font-bold text-[#1E293B] mt-1">
                    {pendingAttention.verifications}
                  </p>
                  <p className="text-[11px] text-[#F97316] font-medium mt-1">
                    CRMV e CNPJ em fila
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-[#FFEDD5] text-[#F97316] flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Card 2: Denúncias Abertas */}
          <Link href="/denuncias">
            <Card className="hover:border-[#0F766E] transition-all hover:shadow-md cursor-pointer border-l-4 border-l-[#DC2626]">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-[#64748B]">Denúncias Abertas</p>
                  <p className="text-2xl font-bold text-[#1E293B] mt-1">
                    {pendingAttention.openReports}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge variant="danger" className="text-[10px] px-1.5 py-0">
                      {pendingAttention.highPriorityReports} alta prioridade
                    </Badge>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Card 3: Solicitações Urgentes Sem Interessados */}
          <Link href="/solicitacoes?stale=true">
            <Card className="hover:border-[#0F766E] transition-all hover:shadow-md cursor-pointer border-l-4 border-l-[#F97316]">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-[#64748B]">Urgentes Sem Resposta</p>
                  <p className="text-2xl font-bold text-[#1E293B] mt-1">
                    {pendingAttention.staleUrgentRequests}
                  </p>
                  <p className="text-[11px] text-[#64748B] mt-1">
                    Abertas &gt; 2h sem interesse
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-[#FFEDD5] text-[#F97316] flex items-center justify-center">
                  <Clock className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Card 4: Pagamentos / Webhooks com Falha (só admin) */}
          {isAdmin ? (
            <Link href="/financeiro?tab=webhooks">
              <Card className="hover:border-[#0F766E] transition-all hover:shadow-md cursor-pointer border-l-4 border-l-[#DC2626]">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-[#64748B]">Webhooks / Falhas</p>
                    <p className="text-2xl font-bold text-[#1E293B] mt-1">
                      {pendingAttention.failedPayments}
                    </p>
                    <p className="text-[11px] text-[#DC2626] font-medium mt-1">
                      Requer reprocessamento
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center">
                    <CreditCard className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ) : (
            <Link href="/denuncias">
              <Card className="hover:border-[#0F766E] transition-all hover:shadow-md cursor-pointer border-l-4 border-l-[#DC2626]">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-[#64748B]">Denúncias Alta Prioridade</p>
                    <p className="text-2xl font-bold text-[#1E293B] mt-1">{pendingAttention.highPriorityReports}</p>
                    <p className="text-[11px] text-[#DC2626] font-medium mt-1">Meta de resposta: 4h</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      </div>

      {/* Seção 2: KPIs do Período */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#64748B] mb-3">
          Métricas Chave ({PERIODS[period]})
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Novos Cadastros */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-[#64748B]">
                <span className="text-xs font-medium">Novos Cadastros</span>
                <Users className="h-4 w-4" />
              </div>
              <div className="text-2xl font-bold text-[#1E293B] mt-2">
                {kpis.newUsers}
              </div>
              <div className="text-[11px] text-[#64748B] mt-1">No período selecionado</div>
            </CardContent>
          </Card>

          {/* KPI 2: Solicitações Publicadas */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-[#64748B]">
                <span className="text-xs font-medium">Solicitações Publicadas</span>
                <FileText className="h-4 w-4" />
              </div>
              <div className="text-2xl font-bold text-[#1E293B] mt-2">
                {kpis.requestsPublished}
              </div>
              <div className="text-[11px] text-[#64748B] mt-1">No período selecionado</div>
            </CardContent>
          </Card>

          {/* KPI 3: Taxa de Preenchimento */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-[#64748B]">
                <span className="text-xs font-medium">Taxa de Preenchimento</span>
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="text-2xl font-bold text-[#1E293B] mt-2">
                {kpis.fillRate}
              </div>
              <div className="text-[11px] text-[#64748B] mt-1">Publicadas que viraram FILLED</div>
            </CardContent>
          </Card>

          {/* KPI 4: Tempo até 1º Interesse */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-[#64748B]">
                <span className="text-xs font-medium">Tempo até 1º Interesse</span>
                <Clock className="h-4 w-4" />
              </div>
              <div className="text-2xl font-bold text-[#1E293B] mt-2">
                {kpis.medianTimeToInterest}
              </div>
              <div className="text-[11px] text-[#64748B] mt-1">
                Tempo mediano na plataforma
              </div>
            </CardContent>
          </Card>

          {/* Admin KPIs: MRR e Assinaturas */}
          {isAdmin && (
            <>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between text-[#64748B]">
                    <span className="text-xs font-medium">MRR (Assinaturas)</span>
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div className="text-2xl font-bold text-[#0F766E] mt-2">
                    {kpis.mrr}
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-1">
                    {kpis.activeSubscriptions} assinaturas ativas
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between text-[#64748B]">
                    <span className="text-xs font-medium">Avaliação Média Geral</span>
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  </div>
                  <div className="text-2xl font-bold text-[#1E293B] mt-2 flex items-center gap-2">
                    <span>{kpis.averageRating}</span>
                    <span className="text-xs font-normal text-[#64748B]">/ 5.0</span>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Seção 3: Gráficos de Acompanhamento */}
      <DashboardCharts
        isAdmin={isAdmin}
        requestsData={requestsData}
        registrationsData={registrationsData}
        specialtiesData={specialtiesData}
        revenueData={revenueData}
      />
    </div>
  )
}
