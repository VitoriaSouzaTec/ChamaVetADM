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
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DashboardCharts } from '@/components/dashboard/dashboard-charts'
import { formatCurrency } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
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

export default async function DashboardPage() {
  let role: AdminRole = 'admin'
  let metrics: DashboardMetrics | null = null

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      role = (user.app_metadata?.admin_role ||
        user.app_metadata?.role ||
        'admin') as AdminRole
    }

    // Chamar RPC admin_dashboard_metrics
    const rpcFn = supabase.rpc as unknown as (
      name: string,
      args: Record<string, unknown>
    ) => Promise<{ data: DashboardMetrics | null }>

    const { data } = await rpcFn('admin_dashboard_metrics', {
      p_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      p_to: new Date().toISOString(),
    })
    metrics = data
  } catch {
    // Modo de demonstração / fallback quando Supabase ainda não inicializou as tabelas
  }

  const isAdmin = role === 'admin'

  // Dados com fallback para visualização inicial
  const pendingAttention = {
    verifications: metrics?.pending_verifications ?? 8,
    openReports: metrics?.open_reports ?? 3,
    highPriorityReports: metrics?.high_priority_reports ?? 1,
    failedPayments: metrics?.failed_payments ?? 2,
    staleUrgentRequests: metrics?.stale_urgent_requests ?? 2,
  }

  const kpis = {
    newUsers: metrics?.new_users_total ?? 142,
    newUsersChange: '+18.4%',
    requestsPublished: metrics?.requests_published ?? 86,
    requestsChange: '+12.0%',
    fillRate: metrics?.fill_rate_percent ?? 78.5,
    fillRateChange: '+4.2%',
    medianTimeToInterest: metrics?.median_time_to_interest ?? '34 min',
    activeSubscriptions: metrics?.active_subscriptions ?? 230,
    mrrCents: metrics?.mrr_cents ?? 227700, // R$ 2.277,00
    averageRating: metrics?.average_rating ?? 4.85,
  }

  // Dados para gráficos de demonstração
  const requestsData = metrics?.chart_requests ?? [
    { date: '24/09', publicadas: 8, preenchidas: 6 },
    { date: '25/09', publicadas: 12, preenchidas: 10 },
    { date: '26/09', publicadas: 15, preenchidas: 11 },
    { date: '27/09', publicadas: 10, preenchidas: 9 },
    { date: '28/09', publicadas: 18, preenchidas: 15 },
    { date: '29/09', publicadas: 14, preenchidas: 12 },
    { date: '30/09', publicadas: 20, preenchidas: 17 },
  ]

  const registrationsData = metrics?.chart_registrations ?? [
    { date: '24/09', vet: 6, auxiliar: 4, clinica: 2 },
    { date: '25/09', vet: 9, auxiliar: 5, clinica: 3 },
    { date: '26/09', vet: 12, auxiliar: 7, clinica: 4 },
    { date: '27/09', vet: 8, auxiliar: 3, clinica: 2 },
    { date: '28/09', vet: 14, auxiliar: 6, clinica: 5 },
    { date: '29/09', vet: 11, auxiliar: 8, clinica: 3 },
    { date: '30/09', vet: 16, auxiliar: 9, clinica: 6 },
  ]

  const specialtiesData = metrics?.chart_specialties ?? [
    { name: 'Cirurgia Geral', count: 42 },
    { name: 'Ultrassonografia', count: 35 },
    { name: 'Dermatologia', count: 28 },
    { name: 'Cardiologia', count: 22 },
    { name: 'Anestesiologia', count: 19 },
    { name: 'Ortopedia', count: 14 },
  ]

  const revenueData = metrics?.chart_revenue ?? [
    { date: '24/09', receita_cents: 18500 },
    { date: '25/09', receita_cents: 29800 },
    { date: '26/09', receita_cents: 34200 },
    { date: '27/09', receita_cents: 22000 },
    { date: '28/09', receita_cents: 48900 },
    { date: '29/09', receita_cents: 38000 },
    { date: '30/09', receita_cents: 56400 },
  ]

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
          <button className="px-3 py-1.5 rounded-lg text-[#64748B] hover:text-[#1E293B]">
            Hoje
          </button>
          <button className="px-3 py-1.5 rounded-lg text-[#64748B] hover:text-[#1E293B]">
            7 dias
          </button>
          <button className="px-3 py-1.5 rounded-lg bg-[#0F766E] text-white font-semibold shadow-xs">
            30 dias
          </button>
        </div>
      </div>

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
          <Link href="/solicitacoes?filter=urgent_stale">
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
            <Card className="border-l-4 border-l-[#0F766E]">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-[#64748B]">SLA Suporte</p>
                  <p className="text-2xl font-bold text-[#1E293B] mt-1">98.2%</p>
                  <p className="text-[11px] text-[#16A34A] font-medium mt-1">Dentro da meta 24h</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Seção 2: KPIs do Período */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#64748B] mb-3">
          Métricas Chave (Últimos 30 Dias)
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
              <div className="flex items-center gap-1 text-[11px] text-[#16A34A] font-semibold mt-1">
                <ArrowUpRight className="h-3 w-3" />
                <span>{kpis.newUsersChange} vs período anterior</span>
              </div>
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
              <div className="flex items-center gap-1 text-[11px] text-[#16A34A] font-semibold mt-1">
                <ArrowUpRight className="h-3 w-3" />
                <span>{kpis.requestsChange} vs período anterior</span>
              </div>
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
                {kpis.fillRate}%
              </div>
              <div className="flex items-center gap-1 text-[11px] text-[#16A34A] font-semibold mt-1">
                <ArrowUpRight className="h-3 w-3" />
                <span>{kpis.fillRateChange} preenchidas (FILLED)</span>
              </div>
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
                    {formatCurrency(kpis.mrrCents)}
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
                  <div className="text-[11px] text-[#16A34A] font-semibold mt-1">
                    Excelente satisfação
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
