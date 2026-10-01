'use client'

import React, { useState, use } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Check,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmModal } from '@/components/shared/confirm-modal'
import { MOCK_REPORTS, type ReportItem } from '@/server/mock-data'
import { formatDate } from '@/lib/format'

export default function DenunciaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const repId = resolvedParams.id

  const initialReport =
    MOCK_REPORTS.find((r) => r.id === repId) || MOCK_REPORTS[0]

  const [report, setReport] = useState<ReportItem>(initialReport)
  const [resolveModalOpen, setResolveModalOpen] = useState(false)
  const [dismissModalOpen, setDismissModalOpen] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)

  function showSuccess(msg: string) {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  function handleAssignToMe() {
    setReport((prev) => ({
      ...prev,
      assignedTo: 'Você (Operador Atual)',
      status: 'IN_REVIEW',
    }))
    showSuccess('Você assumiu a responsabilidade por esta denúncia.')
  }

  async function handleResolve(note: string) {
    setReport((prev) => ({
      ...prev,
      status: 'RESOLVED',
      resolutionNote: note,
    }))
    showSuccess(`Denúncia resolvida. Nota registrada: "${note}". Notificação neutra enviada ao denunciante.`)
  }

  async function handleDismiss(note: string) {
    setReport((prev) => ({
      ...prev,
      status: 'DISMISSED',
      resolutionNote: note,
    }))
    showSuccess(`Denúncia descartada. Nota registrada: "${note}". Notificação neutra enviada ao denunciante.`)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/denuncias">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-heading text-[#1E293B]">
                Denúncia #{report.id}
              </h1>
              <Badge variant={report.priority === 'HIGH' ? 'danger' : 'accent'}>
                {report.priority}
              </Badge>
              <Badge variant="outline">{report.status}</Badge>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Motivo: <strong>{report.reason}</strong> · Registrada em {formatDate(report.createdAt)}
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2">
          {!report.assignedTo && (
            <Button variant="outline" size="sm" onClick={handleAssignToMe} className="text-xs">
              Assumir Análise
            </Button>
          )}
          {report.status !== 'RESOLVED' && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setResolveModalOpen(true)}
              className="text-xs gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" /> Resolver Denúncia
            </Button>
          )}
          {report.status !== 'DISMISSED' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissModalOpen(true)}
              className="text-xs text-[#64748B]"
            >
              Descartar
            </Button>
          )}
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] text-sm flex items-center gap-2 font-medium">
          <Check className="h-5 w-5" />
          <span>{notification}</span>
        </div>
      )}

      {/* Grid de Conteúdo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Detalhe da Denúncia (7 colunas) */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#1E293B]">
                Relato do Denunciante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <span className="text-xs font-bold uppercase text-[#64748B] tracking-wider block">
                  Descrição dos Fatos
                </span>
                <p className="text-sm text-[#1E293B] leading-relaxed">
                  &ldquo;{report.description}&rdquo;
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#94A3B8] block">Quem Denunciou:</span>
                  <span className="font-bold text-[#1E293B]">{report.reporterName}</span>
                </div>
                <div>
                  <span className="text-[#94A3B8] block">Tempo Restante SLA:</span>
                  <span className="font-bold text-[#F97316]">{report.slaHoursRemaining}h</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prévia do Alvo da Denúncia */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#1E293B]">
                Alvo da Denúncia: {report.targetTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#0F766E] uppercase">
                    Tipo de Alvo: {report.targetType}
                  </span>
                  <h4 className="font-bold text-sm text-[#1E293B] mt-0.5">
                    {report.targetTitle}
                  </h4>
                  <p className="text-xs text-[#64748B]">ID do Recurso: {report.targetId}</p>
                </div>
                <Link href={`/usuarios/${report.targetId}`}>
                  <Button variant="outline" size="sm" className="text-xs gap-1">
                    Abrir Alvo <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reincidência e Histórico (5 colunas) */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#1E293B]">
                Histórico de Reincidência do Alvo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 rounded-lg border border-[#FEE2E2] bg-[#FEE2E2]/30 space-y-1">
                <span className="font-bold text-[#DC2626]">Denúncia Anterior #rep-289</span>
                <p className="text-[#64748B]">Motivo: No-Show em plantão cirúrgico em 15/09/2026</p>
                <Badge variant="danger" className="text-[10px]">RESOLVIDA / SUSPENSO 3 DIAS</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#1E293B]">
                Histórico do Denunciante
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2 text-[#64748B]">
              <p>Total de denúncias abertas por este denunciante nos últimos 90 dias: <strong className="text-[#1E293B]">1</strong></p>
              <p>Taxa de procedência: <strong className="text-[#16A34A]">100%</strong> (baixo risco de má-fé)</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal: Resolver Denúncia */}
      <ConfirmModal
        isOpen={resolveModalOpen}
        onClose={() => setResolveModalOpen(false)}
        onConfirm={handleResolve}
        title="Resolver Denúncia"
        description="Descreva a conclusão da análise e a medida aplicada. O denunciante receberá uma confirmação neutra."
        requiredWord="CONFIRMAR"
        destructive={false}
        confirmButtonText="Concluir e Resolver"
      />

      {/* Modal: Descartar Denúncia */}
      <ConfirmModal
        isOpen={dismissModalOpen}
        onClose={() => setDismissModalOpen(false)}
        onConfirm={handleDismiss}
        title="Descartar Denúncia"
        description="Informe o motivo pelo qual esta denúncia foi considerada improcedente."
        requiredWord="CONFIRMAR"
        destructive={true}
        confirmButtonText="Descartar Denúncia"
      />
    </div>
  )
}
