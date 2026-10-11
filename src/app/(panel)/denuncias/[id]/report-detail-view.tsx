'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, ExternalLink } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmModal } from '@/components/shared/confirm-modal'
import { Notice, useNotice } from '@/components/shared/notice'
import { unwrap } from '@/lib/action-client'
import { assignReportToMe, updateReport } from '@/server/actions/moderation'
import { formatDate, formatDateTime } from '@/lib/format'
import type { ReportDetail } from '@/server/queries/reports'
import type { ReportPriority } from '@/types/admin'

export function ReportDetailView({ report }: { report: ReportDetail }) {
  const [resolveModalOpen, setResolveModalOpen] = useState(false)
  const [dismissModalOpen, setDismissModalOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const { notice, success, error } = useNotice()
  const isClosed = report.status === 'RESOLVED' || report.status === 'DISMISSED'

  async function handleAssignToMe() {
    setBusy(true)
    const result = await assignReportToMe(report.id)
    setBusy(false)
    if (!result.ok) return error(result.error)
    success('Você assumiu esta denúncia.')
  }

  async function handlePriority(priority: ReportPriority) {
    setBusy(true)
    const result = await updateReport(report.id, { priority })
    setBusy(false)
    if (!result.ok) return error(result.error)
    success(`Prioridade alterada para ${priority}.`)
  }

  async function handleResolve(note: string) {
    unwrap(await updateReport(report.id, { status: 'RESOLVED', note }))
    success('Denúncia resolvida. O denunciante recebe uma notificação neutra.')
  }

  async function handleDismiss(note: string) {
    unwrap(await updateReport(report.id, { status: 'DISMISSED', note }))
    success('Denúncia descartada. O denunciante recebe uma notificação neutra.')
  }

  const stats = report.reporterStats
  const procedence = stats.closed > 0 ? Math.round((stats.resolved / stats.closed) * 100) : null

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/denuncias">
            <Button variant="outline" size="icon" className="h-9 w-9" aria-label="Voltar">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold font-heading text-[#1E293B]">Denúncia</h1>
              <Badge variant={report.priority === 'HIGH' ? 'danger' : 'accent'}>{report.priority}</Badge>
              <Badge variant="outline">{report.status}</Badge>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Motivo: <strong>{report.reason}</strong> · Registrada em {formatDateTime(report.createdAt)}
              {report.assignedToName ? ` · Responsável: ${report.assignedToName}` : ''}
            </p>
          </div>
        </div>

        {!isClosed && (
          <div className="flex flex-wrap items-center gap-2">
            {!report.assignedToName && (
              <Button variant="outline" size="sm" onClick={handleAssignToMe} disabled={busy} className="text-xs">
                Assumir Análise
              </Button>
            )}
            <select
              value={report.priority}
              disabled={busy}
              onChange={(e) => handlePriority(e.target.value as ReportPriority)}
              className="h-8 text-xs px-2 rounded-lg border border-[#E2E8F0] bg-white"
              aria-label="Prioridade"
            >
              <option value="LOW">Prioridade baixa</option>
              <option value="NORMAL">Prioridade normal</option>
              <option value="HIGH">Prioridade alta</option>
            </select>
            <Button variant="default" size="sm" onClick={() => setResolveModalOpen(true)} className="text-xs gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Resolver Denúncia
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDismissModalOpen(true)} className="text-xs text-[#64748B]">
              Descartar
            </Button>
          </div>
        )}
      </div>

      <Notice notice={notice} />

      {isClosed && report.resolutionNote && (
        <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
          <span className="font-bold text-[#1E293B]">Nota de conclusão</span>
          {report.resolvedAt ? ` (${formatDateTime(report.resolvedAt)})` : ''}: {report.resolutionNote}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#1E293B]">Relato do Denunciante</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <span className="text-xs font-bold uppercase text-[#64748B] tracking-wider block">Descrição dos Fatos</span>
                <p className="text-sm text-[#1E293B] leading-relaxed whitespace-pre-wrap">
                  {report.description ? `“${report.description}”` : 'Sem descrição.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#94A3B8] block">Quem Denunciou:</span>
                  <Link href={`/usuarios/${report.reporterId}`} className="font-bold text-[#0F766E] hover:underline">
                    {report.reporterName}
                  </Link>
                </div>
                {!isClosed && (
                  <div>
                    <span className="text-[#94A3B8] block">Tempo Restante SLA:</span>
                    <span className={`font-bold ${report.slaHoursRemaining <= 0 ? 'text-[#DC2626]' : 'text-[#F97316]'}`}>
                      {report.slaHoursRemaining <= 0 ? `Estourado há ${Math.abs(report.slaHoursRemaining)}h` : `${report.slaHoursRemaining}h`}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#1E293B]">Alvo da Denúncia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-[#0F766E] uppercase">Tipo de Alvo: {report.targetType}</span>
                  <h4 className="font-bold text-sm text-[#1E293B] mt-0.5">{report.targetTitle}</h4>
                  <p className="text-xs text-[#64748B] font-mono">ID: {report.targetId}</p>
                </div>
                <Link href={report.targetHref}>
                  <Button variant="outline" size="sm" className="text-xs gap-1">
                    Abrir Alvo <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
              <p className="text-[11px] text-[#94A3B8] mt-2">
                Para punir o alvo (ocultar, suspender), abra-o e aplique a ação lá; depois resolva esta denúncia.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#1E293B]">
                Outras Denúncias sobre o Mesmo Alvo ({report.sameTarget.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {report.sameTarget.length === 0 && <p className="text-[#94A3B8]">Nenhuma reincidência registrada.</p>}
              {report.sameTarget.map((r) => (
                <Link
                  key={r.id}
                  href={`/denuncias/${r.id}`}
                  className="block p-3 rounded-lg border border-[#FECACA] bg-[#FEE2E2]/30 space-y-1 hover:border-[#DC2626]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#DC2626]">{r.reason}</span>
                    <Badge variant="outline" className="text-[10px]">{r.status}</Badge>
                  </div>
                  <p className="text-[#64748B]">
                    Por {r.reporterName} em {formatDate(r.createdAt)}
                  </p>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#1E293B]">Histórico do Denunciante</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2 text-[#64748B]">
              <p>
                Denúncias feitas nos últimos 90 dias: <strong className="text-[#1E293B]">{stats.last90Days}</strong>{' '}
                (total: {stats.total})
              </p>
              <p>
                Taxa de procedência:{' '}
                <strong className="text-[#1E293B]">
                  {procedence === null ? 'sem denúncias concluídas' : `${procedence}% (${stats.resolved} de ${stats.closed})`}
                </strong>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

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
