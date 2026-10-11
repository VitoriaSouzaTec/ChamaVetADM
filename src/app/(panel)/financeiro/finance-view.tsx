'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  CreditCard,
  RotateCcw,
  Download,
  AlertTriangle,
  TrendingUp,
  Receipt,
  Gift,
  RefreshCw,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmModal } from '@/components/shared/confirm-modal'
import { Notice, useNotice } from '@/components/shared/notice'
import { unwrap } from '@/lib/action-client'
import { extendTrial } from '@/server/actions/users'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format'
import type { FinanceData } from '@/server/queries/finance'

type Tab = 'geral' | 'pagamentos' | 'assinaturas' | 'creditos' | 'webhooks'

const EMPTY = (text: string) => <p className="p-6 text-center text-sm text-[#94A3B8]">{text}</p>

function exportPaymentsCsv(payments: FinanceData['payments']) {
  const header = ['data', 'usuario', 'tipo', 'valor', 'metodo', 'status', 'id_gateway']
  const rows = payments.map((p) => [
    formatDateTime(p.createdAt),
    p.userName,
    p.type,
    (p.amountCents / 100).toFixed(2).replace('.', ','),
    p.method,
    p.status,
    p.gatewayId ?? '',
  ])
  const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pagamentos-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const TABS: Tab[] = ['geral', 'pagamentos', 'assinaturas', 'creditos', 'webhooks']

export function FinanceView({ data, initialTab }: { data: FinanceData; initialTab?: string }) {
  const [activeTab, setActiveTab] = useState<Tab>(
    TABS.includes(initialTab as Tab) ? (initialTab as Tab) : 'geral'
  )
  const [trialTarget, setTrialTarget] = useState<FinanceData['subscriptions'][number] | null>(null)
  const [trialDays, setTrialDays] = useState(15)
  const { notice, success } = useNotice()
  const { overview } = data

  async function handleExtendTrial(reason: string) {
    if (!trialTarget) return
    unwrap(await extendTrial(trialTarget.userId, trialDays, reason))
    success(`Teste de ${trialTarget.userName} estendido em ${trialDays} dia(s).`)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#1E293B]">Gestão Financeira</h1>
          <p className="text-sm text-[#64748B]">
            Receitas, pagamentos, assinaturas recorrentes, créditos e diagnóstico de webhooks
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => exportPaymentsCsv(data.payments)}
          disabled={data.payments.length === 0}
          className="gap-2 text-xs font-semibold cursor-pointer"
        >
          <Download className="h-4 w-4" /> Exportar Pagamentos (CSV)
        </Button>
      </div>

      <Notice notice={notice} />

      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 text-xs font-semibold overflow-x-auto">
        {(
          [
            { key: 'geral', label: '1. Visão Geral', icon: TrendingUp },
            { key: 'pagamentos', label: '2. Pagamentos', icon: Receipt },
            { key: 'assinaturas', label: '3. Assinaturas', icon: CreditCard },
            { key: 'creditos', label: '4. Extrato de Créditos', icon: Gift },
            { key: 'webhooks', label: `5. Webhooks & Falhas (${data.events.length})`, icon: AlertTriangle },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-colors shrink-0 ${
                isActive ? 'bg-[#0F766E] text-white shadow-xs' : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {activeTab === 'geral' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <span className="text-xs text-[#64748B]">Receita do Mês (confirmada)</span>
              <div className="text-2xl font-bold text-[#0F766E] mt-1">{formatCurrency(overview.monthRevenueCents)}</div>
              <span className="text-[11px] text-[#64748B]">Publicações + assinaturas</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <span className="text-xs text-[#64748B]">MRR (Assinaturas Ativas)</span>
              <div className="text-2xl font-bold text-[#1E293B] mt-1">
                {overview.mrrCents !== null ? formatCurrency(overview.mrrCents) : '-'}
              </div>
              <span className="text-[11px] text-[#64748B]">{overview.subsByStatus.ACTIVE} assinaturas ativas</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <span className="text-xs text-[#64748B]">Publicações Pagas no Mês</span>
              <div className="text-2xl font-bold text-[#1E293B] mt-1">{overview.monthPublicationsPaid}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <span className="text-xs text-[#64748B]">Créditos Concedidos (últimos 200)</span>
              <div className="text-2xl font-bold text-[#F97316] mt-1">{overview.creditsGranted}</div>
            </CardContent>
          </Card>
          <Card className="sm:col-span-2 lg:col-span-4">
            <CardContent className="p-5 flex flex-wrap gap-6 text-sm">
              <span className="text-xs text-[#64748B] w-full">Assinaturas por status</span>
              {(Object.entries(overview.subsByStatus) as Array<[string, number]>).map(([status, count]) => (
                <div key={status}>
                  <div className="text-xl font-bold text-[#1E293B]">{count}</div>
                  <div className="text-xs text-[#64748B]">{status}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'pagamentos' && (
        <Card className="shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            {data.payments.length === 0 ? (
              EMPTY('Nenhum pagamento registrado.')
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-bold text-[#64748B] uppercase">
                  <tr>
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Usuário</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Valor</th>
                    <th className="py-3 px-4">Método</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Gateway</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {data.payments.map((p) => (
                    <tr key={p.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-3 px-4 text-xs font-mono text-[#64748B] whitespace-nowrap">
                        {formatDateTime(p.createdAt)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-xs">
                        <Link href={`/usuarios/${p.userId}`} className="text-[#1E293B] hover:text-[#0F766E]">
                          {p.userName}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono">{p.type}</td>
                      <td className="py-3 px-4 font-bold text-xs text-[#1E293B]">{formatCurrency(p.amountCents)}</td>
                      <td className="py-3 px-4 text-xs">{p.method}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            p.status === 'CONFIRMED'
                              ? 'success'
                              : p.status === 'FAILED'
                              ? 'danger'
                              : p.status === 'PENDING'
                              ? 'accent'
                              : 'muted'
                          }
                        >
                          {p.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-[11px] font-mono text-[#64748B]">{p.gatewayId ?? '-'}</td>
                      <td className="py-3 px-4 text-right">
                        {p.status === 'CONFIRMED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled
                            title="Estorno via gateway ainda não integrado"
                            className="text-xs text-[#DC2626]"
                          >
                            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Estornar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'assinaturas' && (
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold text-[#1E293B]">Assinaturas de Profissionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.subscriptions.length === 0 && EMPTY('Nenhuma assinatura registrada.')}
            {data.subscriptions.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <Link href={`/usuarios/${s.userId}`} className="font-bold text-sm text-[#1E293B] hover:text-[#0F766E]">
                    {s.userName}
                  </Link>
                  <p className="text-xs text-[#64748B]">
                    {s.status === 'TRIAL'
                      ? `Teste grátis até ${formatDate(s.trialEnd)}`
                      : `Período atual até ${formatDate(s.currentPeriodEnd)}`}
                    {s.method ? ` · ${s.method}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      s.status === 'ACTIVE' ? 'success' : s.status === 'OVERDUE' ? 'danger' : s.status === 'TRIAL' ? 'accent' : 'muted'
                    }
                  >
                    {s.status}
                  </Badge>
                  {s.status === 'TRIAL' && (
                    <Button variant="outline" size="sm" onClick={() => setTrialTarget(s)} className="text-xs">
                      Estender Teste
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === 'creditos' && (
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold text-[#1E293B]">Livro-Caixa de Créditos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {data.credits.length === 0 && EMPTY('Nenhum crédito registrado.')}
            {data.credits.map((c) => (
              <div key={c.id} className="p-3.5 rounded-lg border border-[#E2E8F0] flex items-center justify-between gap-3">
                <div>
                  <Link href={`/usuarios/${c.clinicId}`} className="font-bold text-[#1E293B] hover:text-[#0F766E]">
                    {c.clinicName} ({c.amount > 0 ? `+${c.amount}` : c.amount} crédito{Math.abs(c.amount) === 1 ? '' : 's'})
                  </Link>
                  <p className="text-[#64748B]">
                    Motivo: {c.reason} · Por: {c.grantedBy}
                  </p>
                </div>
                <span className="text-[#94A3B8] shrink-0">{formatDateTime(c.createdAt)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === 'webhooks' && (
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold text-[#1E293B]">
              Eventos do Gateway com Erro ou Pendentes (payment_events)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.events.length === 0 && EMPTY('Nenhum webhook com erro ou pendente 🎉')}
            {data.events.map((wh) => (
              <div key={wh.id} className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-[#1E293B]">{wh.eventType}</span>
                    <Badge variant={wh.status === 'ERROR' ? 'danger' : 'accent'}>{wh.status}</Badge>
                    {wh.gatewayId && <span className="font-mono text-[#94A3B8]">{wh.gatewayId}</span>}
                  </div>
                  <span className="text-[#94A3B8]">{formatDateTime(wh.createdAt)}</span>
                </div>

                <pre className="bg-white p-2.5 rounded-lg font-mono text-[11px] border border-[#E2E8F0] text-[#64748B] whitespace-pre-wrap break-all max-h-48 overflow-auto">
                  {JSON.stringify(wh.payload, null, 2)}
                </pre>

                <div className="text-[#DC2626] font-semibold flex items-center justify-between gap-3">
                  <span>{wh.error ? `Erro: ${wh.error}` : ''}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    title="Reprocessamento (rotina de reconciliação) ainda não integrado"
                    className="text-xs gap-1"
                  >
                    <RefreshCw className="h-3 w-3" /> Reprocessar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <ConfirmModal
        isOpen={trialTarget !== null}
        onClose={() => setTrialTarget(null)}
        onConfirm={handleExtendTrial}
        title="Estender Teste Grátis"
        description={`O período de teste de ${trialTarget?.userName ?? ''} será estendido.`}
        requiredWord=""
        destructive={false}
        confirmButtonText="Estender"
      >
        <div>
          <label className="block text-sm font-medium text-[#1E293B] mb-1">Dias adicionais:</label>
          <input
            type="number"
            min={1}
            max={90}
            value={trialDays}
            onChange={(e) => setTrialDays(Math.max(1, Math.min(90, Number(e.target.value))))}
            className="w-full p-2.5 border border-[#E2E8F0] rounded-lg text-sm"
          />
        </div>
      </ConfirmModal>
    </div>
  )
}
