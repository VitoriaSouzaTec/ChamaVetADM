'use client'

import React, { useState } from 'react'
import {
  CreditCard,
  RotateCcw,
  Download,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Receipt,
  Gift,
  RefreshCw,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmModal } from '@/components/shared/confirm-modal'
import { formatCurrency } from '@/lib/format'

interface PaymentRecord {
  id: string
  user: string
  type: string
  amountCents: number
  method: string
  status: string
  gatewayId: string
  date: string
}

export default function FinanceiroPage() {
  const [activeTab, setActiveTab] = useState<'geral' | 'pagamentos' | 'assinaturas' | 'creditos' | 'webhooks'>('geral')
  const [refundModalOpen, setRefundModalOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  const [payments, setPayments] = useState([
    {
      id: 'pay-001',
      user: 'Clínica Veterinária PetCare Aldeota',
      type: 'PUBLICATION',
      amountCents: 690,
      method: 'PIX',
      status: 'CONFIRMED',
      gatewayId: 'asaas_pay_89123',
      date: '30/09/2026 13:42',
    },
    {
      id: 'pay-002',
      user: 'Dr. Lucas Silveira',
      type: 'SUBSCRIPTION',
      amountCents: 990,
      method: 'CREDIT_CARD',
      status: 'CONFIRMED',
      gatewayId: 'asaas_sub_33112',
      date: '28/09/2026 10:15',
    },
    {
      id: 'pay-003',
      user: 'Hospital Veterinário 24h Amigo Fiel',
      type: 'PUBLICATION',
      amountCents: 690,
      method: 'PIX',
      status: 'FAILED',
      gatewayId: 'asaas_pay_77219',
      date: '27/09/2026 18:00',
    },
  ])

  const [webhooks, setWebhooks] = useState([
    {
      id: 'wh-101',
      event: 'PAYMENT_RECEIVED',
      gatewayId: 'asaas_pay_89123',
      status: 'PROCESSED',
      date: '30/09/2026 13:43',
      error: null,
      payload: '{"event":"PAYMENT_RECEIVED","payment":{"id":"asaas_pay_89123","value":6.90}}',
    },
    {
      id: 'wh-102',
      event: 'SUBSCRIPTION_OVERDUE',
      gatewayId: 'asaas_sub_99441',
      status: 'ERROR',
      date: '29/09/2026 09:12',
      error: 'Timeout connecting to notification_outbox',
      payload: '{"event":"SUBSCRIPTION_OVERDUE","subscription":{"id":"asaas_sub_99441"}}',
    },
  ])

  function showSuccess(msg: string) {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  async function handleRefund(reason: string) {
    if (!selectedPayment) return
    setPayments((prev) =>
      prev.map((p) =>
        p.id === selectedPayment.id ? { ...p, status: 'REFUNDED' } : p
      )
    )
    showSuccess(`Pagamento #${selectedPayment.id} estornado com sucesso. Motivo: ${reason}`)
  }

  function handleReprocessWebhook(whId: string) {
    setWebhooks((prev) =>
      prev.map((w) =>
        w.id === whId ? { ...w, status: 'PROCESSED', error: null } : w
      )
    )
    showSuccess(`Webhook #${whId} reprocessado com sucesso via rotina de reconciliação.`)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#1E293B]">
            Gestão Financeira
          </h1>
          <p className="text-sm text-[#64748B]">
            Receitas, pagamentos, assinaturas recorrentes, créditos e diagnóstico de webhooks
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => showSuccess('Relatório contábil em CSV gerado com auditoria.')}
          className="gap-2 text-xs font-semibold cursor-pointer"
        >
          <Download className="h-4 w-4" /> Exportar Relatório Contábil (CSV)
        </Button>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] text-sm flex items-center gap-2 font-medium">
          <CheckCircle className="h-5 w-5" />
          <span>{notification}</span>
        </div>
      )}

      {/* Abas */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 text-xs font-semibold overflow-x-auto">
        {[
          { key: 'geral', label: '1. Visão Geral', icon: TrendingUp },
          { key: 'pagamentos', label: '2. Pagamentos', icon: Receipt },
          { key: 'assinaturas', label: '3. Assinaturas', icon: CreditCard },
          { key: 'creditos', label: '4. Extrato de Créditos', icon: Gift },
          { key: 'webhooks', label: '5. Webhooks & Falhas', icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'geral' | 'pagamentos' | 'assinaturas' | 'creditos' | 'webhooks')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-[#0F766E] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Aba 1: Visão Geral */}
      {activeTab === 'geral' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-5">
                <span className="text-xs text-[#64748B]">Receita do Mês</span>
                <div className="text-2xl font-bold text-[#0F766E] mt-1">
                  {formatCurrency(548900)}
                </div>
                <span className="text-[11px] text-[#16A34A] font-semibold">+14.2% vs mês anterior</span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <span className="text-xs text-[#64748B]">MRR (Assinaturas Ativas)</span>
                <div className="text-2xl font-bold text-[#1E293B] mt-1">
                  {formatCurrency(227700)}
                </div>
                <span className="text-[11px] text-[#64748B]">230 profissionais pagantes</span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <span className="text-xs text-[#64748B]">Publicações Pagas</span>
                <div className="text-2xl font-bold text-[#1E293B] mt-1">465</div>
                <span className="text-[11px] text-[#64748B]">R$ 6,90 por anúncio</span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <span className="text-xs text-[#64748B]">Créditos Concedidos</span>
                <div className="text-2xl font-bold text-[#F97316] mt-1">28</div>
                <span className="text-[11px] text-[#64748B]">Campanhas / Bonificações</span>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Aba 2: Pagamentos */}
      {activeTab === 'pagamentos' && (
        <Card className="shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-bold text-[#64748B] uppercase">
                <tr>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Usuário</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Método</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-3 px-4 text-xs font-mono text-[#64748B]">{p.date}</td>
                    <td className="py-3 px-4 font-semibold text-xs text-[#1E293B]">{p.user}</td>
                    <td className="py-3 px-4 text-xs font-mono">{p.type}</td>
                    <td className="py-3 px-4 font-bold text-xs text-[#1E293B]">
                      {formatCurrency(p.amountCents)}
                    </td>
                    <td className="py-3 px-4 text-xs">{p.method}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          p.status === 'CONFIRMED'
                            ? 'success'
                            : p.status === 'FAILED'
                            ? 'danger'
                            : 'muted'
                        }
                      >
                        {p.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {p.status === 'CONFIRMED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPayment(p)
                            setRefundModalOpen(true)
                          }}
                          className="text-xs text-[#DC2626] hover:bg-[#FEE2E2]"
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Estornar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Aba 3: Assinaturas */}
      {activeTab === 'assinaturas' && (
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold text-[#1E293B]">
              Assinaturas de Profissionais (R$ 9,90/mês)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-[#1E293B]">Dra. Camila Vasconcelos</h4>
                <p className="text-xs text-[#64748B]">Assinatura Ativa · Cartão de Crédito · Próxima cobrança: 25/10/2026</p>
              </div>
              <Badge variant="success">ATIVA</Badge>
            </div>
            <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-[#1E293B]">Dr. Lucas Silveira</h4>
                <p className="text-xs text-[#64748B]">Período de Teste Grátis (30 dias) · Expira em 12/10/2026</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => showSuccess('Teste grátis estendido por mais 15 dias.')}
                className="text-xs"
              >
                Estender Teste (+15 dias)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aba 4: Créditos */}
      {activeTab === 'creditos' && (
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold text-[#1E293B]">
              Livro-Caixa de Créditos Concedidos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="p-3.5 rounded-lg border border-[#E2E8F0] flex items-center justify-between">
              <div>
                <span className="font-bold text-[#1E293B]">Clínica Veterinária PetCare Aldeota (+5 créditos)</span>
                <p className="text-[#64748B]">Motivo: Bonificação de boas-vindas na adesão do plano piloto · Por: Carlos (Admin)</p>
              </div>
              <span className="text-[#94A3B8]">29/09/2026 14:00</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aba 5: Webhooks */}
      {activeTab === 'webhooks' && (
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold text-[#1E293B]">
              Diagnóstico de Eventos e Webhooks do Gateway (payment_events)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {webhooks.map((wh) => (
              <div
                key={wh.id}
                className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-[#1E293B]">{wh.event}</span>
                    <Badge variant={wh.status === 'PROCESSED' ? 'success' : 'danger'}>
                      {wh.status}
                    </Badge>
                  </div>
                  <span className="text-[#94A3B8]">{wh.date}</span>
                </div>

                <div className="bg-white p-2.5 rounded-lg font-mono text-[11px] border border-[#E2E8F0] text-[#64748B]">
                  {wh.payload}
                </div>

                {wh.error && (
                  <div className="text-[#DC2626] font-semibold flex items-center justify-between">
                    <span>Erro: {wh.error}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReprocessWebhook(wh.id)}
                      className="text-xs gap-1"
                    >
                      <RefreshCw className="h-3 w-3" /> Reprocessar
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Modal: Estorno */}
      <ConfirmModal
        isOpen={refundModalOpen}
        onClose={() => setRefundModalOpen(false)}
        onConfirm={handleRefund}
        title="Estornar Pagamento no Gateway"
        description={`O pagamento #${selectedPayment?.id} de ${formatCurrency(
          selectedPayment?.amountCents
        )} será devolvido ao usuário.`}
        requiredWord="CONFIRMAR"
        destructive={true}
        confirmButtonText="Confirmar Estorno"
      />
    </div>
  )
}
