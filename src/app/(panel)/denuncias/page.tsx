'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Clock,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MOCK_REPORTS, type ReportItem } from '@/server/mock-data'
import { formatDate } from '@/lib/format'

export default function DenunciasPage() {
  const [reports] = useState<ReportItem[]>(MOCK_REPORTS)
  const [statusFilter, setStatusFilter] = useState<'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED'>('OPEN')

  const filteredReports = reports.filter((r) => r.status === statusFilter)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#1E293B]">
            Fila de Denúncias e Moderação
          </h1>
          <p className="text-sm text-[#64748B]">
            Meta de atendimento: até 24h para denúncias normais e até 4h para prioridade alta
          </p>
        </div>
      </div>

      {/* Abas de Status */}
      <div className="flex items-center gap-1 border-b border-[#E2E8F0] pb-2 text-xs font-semibold">
        {(['OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              statusFilter === st
                ? 'bg-[#0F766E] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white'
            }`}
          >
            {st === 'OPEN' && 'Abertas'}
            {st === 'IN_REVIEW' && 'Em Análise'}
            {st === 'RESOLVED' && 'Resolvidas'}
            {st === 'DISMISSED' && 'Descartadas'}
          </button>
        ))}
      </div>

      {/* Fila de Denúncias */}
      <div className="space-y-3">
        {filteredReports.length > 0 ? (
          filteredReports.map((rep) => {
            const isHighPriority = rep.priority === 'HIGH'
            const isSlaBreached = rep.slaHoursRemaining <= 2

            return (
              <Card
                key={rep.id}
                className={`hover:shadow-md transition-shadow border-l-4 ${
                  isHighPriority ? 'border-l-[#DC2626]' : 'border-l-[#F97316]'
                }`}
              >
                <CardContent className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={isHighPriority ? 'danger' : 'accent'}
                        className="font-bold text-xs"
                      >
                        {rep.priority} PRIORIDADE
                      </Badge>
                      <Badge variant="outline" className="font-mono text-xs">
                        {rep.reason}
                      </Badge>
                      <span className="text-xs font-bold text-[#1E293B]">
                        Alvo: {rep.targetTitle}
                      </span>
                    </div>

                    <p className="text-sm text-[#1E293B] leading-relaxed">
                      &ldquo;{rep.description}&rdquo;
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B]">
                      <span>Denunciante: <strong className="text-[#1E293B]">{rep.reporterName}</strong></span>
                      <span>Criada em {formatDate(rep.createdAt)}</span>
                      {rep.assignedTo && (
                        <span className="text-[#0F766E] font-medium">
                          Responsável: {rep.assignedTo}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* SLA e Ação */}
                  <div className="flex items-center gap-4 shrink-0 w-full lg:w-auto justify-between lg:justify-end pt-3 lg:pt-0 border-t lg:border-t-0 border-[#E2E8F0]">
                    <div className="text-right">
                      <div
                        className={`text-xs font-bold flex items-center gap-1 ${
                          isSlaBreached ? 'text-[#DC2626]' : 'text-[#F97316]'
                        }`}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        SLA: {rep.slaHoursRemaining}h restantes
                      </div>
                      <span className="text-[10px] text-[#94A3B8]">
                        Meta: {isHighPriority ? '4 horas' : '24 horas'}
                      </span>
                    </div>

                    <Link href={`/denuncias/${rep.id}`}>
                      <Button variant="default" size="sm" className="text-xs">
                        Analisar Denúncia
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="p-12 text-center text-sm text-[#94A3B8] bg-white rounded-2xl border border-[#E2E8F0]">
            Nenhuma denúncia nesta categoria 🎉
          </div>
        )}
      </div>
    </div>
  )
}
