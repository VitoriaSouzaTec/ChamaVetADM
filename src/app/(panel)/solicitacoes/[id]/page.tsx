'use client'

import React, { useState, use } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmModal } from '@/components/shared/confirm-modal'
import { MOCK_REQUESTS, type RequestItem } from '@/server/mock-data'
import { formatCurrency } from '@/lib/format'

export default function SolicitacaoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const reqId = resolvedParams.id

  const initialReq =
    MOCK_REQUESTS.find((r) => r.id === reqId) || MOCK_REQUESTS[0]

  const [req, setReq] = useState<RequestItem>(initialReq)
  const [notification, setNotification] = useState<string | null>(null)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const giveCredit = true

  function showSuccess(msg: string) {
    setNotification(msg)
    setTimeout(() => setNotification(null), 3500)
  }

  async function handleCancelRequest(reason: string) {
    setReq((prev) => ({
      ...prev,
      status: 'CANCELED',
    }))
    showSuccess(
      `Solicitação cancelada administrativamente. Motivo: ${reason}. ${
        giveCredit ? '1 crédito devolvido à clínica.' : ''
      }`
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/solicitacoes">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-heading text-[#1E293B]">
                {req.specialtyName} — {req.type}
              </h1>
              {req.urgent && <Badge variant="accent">URGENTE</Badge>}
              <Badge variant={req.status === 'FILLED' ? 'success' : 'secondary'}>
                {req.status}
              </Badge>
            </div>
            <p className="text-xs text-[#64748B] font-mono mt-0.5">
              ID: {req.id} · Clínica: {req.clinicName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {req.status === 'OPEN' && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setCancelModalOpen(true)}
              className="text-xs gap-1.5"
            >
              <XCircle className="h-4 w-4" /> Cancelar Solicitação
            </Button>
          )}
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] text-sm flex items-center gap-2 font-medium">
          <CheckCircle className="h-5 w-5" />
          <span>{notification}</span>
        </div>
      )}

      {/* Grid com Linha do Tempo e Detalhes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Linha do Tempo do Ciclo de Vida (7 colunas) */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#1E293B]">
                Linha do Tempo da Oportunidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2E8F0]">
                {/* 1. Criada */}
                <div className="relative">
                  <div className="absolute -left-6 top-0.5 h-4 w-4 rounded-full bg-[#16A34A] ring-4 ring-white" />
                  <div className="text-xs font-bold text-[#1E293B]">Rascunho Criado pela Clínica</div>
                  <div className="text-[11px] text-[#64748B]">30/09/2026 às 13:30</div>
                </div>

                {/* 2. Paga */}
                <div className="relative">
                  <div className="absolute -left-6 top-0.5 h-4 w-4 rounded-full bg-[#16A34A] ring-4 ring-white" />
                  <div className="text-xs font-bold text-[#1E293B]">Taxa de Publicação Paga (R$ 6,90) via Pix</div>
                  <div className="text-[11px] text-[#64748B]">30/09/2026 às 13:42 · Gateway Asaas ID #pay_98231</div>
                </div>

                {/* 3. Publicada */}
                <div className="relative">
                  <div className="absolute -left-6 top-0.5 h-4 w-4 rounded-full bg-[#16A34A] ring-4 ring-white" />
                  <div className="text-xs font-bold text-[#1E293B]">Publicada e Aberta na Plataforma</div>
                  <div className="text-[11px] text-[#64748B]">30/09/2026 às 13:45</div>
                </div>

                {/* 4. Notificados */}
                <div className="relative">
                  <div className="absolute -left-6 top-0.5 h-4 w-4 rounded-full bg-[#0F766E] ring-4 ring-white" />
                  <div className="text-xs font-bold text-[#1E293B]">42 profissionais compatíveis notificados via Push</div>
                  <div className="text-[11px] text-[#64748B]">Raio de 25km em Fortaleza/CE · 30/09/2026 às 13:46</div>
                </div>

                {/* 5. Candidaturas */}
                <div className="relative">
                  <div className="absolute -left-6 top-0.5 h-4 w-4 rounded-full bg-[#F97316] ring-4 ring-white" />
                  <div className="text-xs font-bold text-[#1E293B]">Interesses Recebidos</div>
                  <div className="text-[11px] text-[#64748B]">
                    {req.interestsCount > 0
                      ? `${req.interestsCount} profissionais enviaram candidatura`
                      : 'Nenhum profissional se candidatou até o momento.'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Candidaturas e Interessados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#1E293B]">
                Profissionais Interessados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-[#1E293B]">Dra. Camila Vasconcelos</span>
                    <p className="text-xs text-[#64748B]">CRMV 12489/CE · Ultrassonografia</p>
                    <p className="text-xs italic text-[#0F766E] mt-1">&ldquo;Tenho aparelho próprio e disponibilidade imediata.&rdquo;</p>
                  </div>
                  <Link href="/usuarios/u-101">
                    <Button variant="outline" size="sm" className="text-xs">
                      Ver Perfil
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detalhes e Valores (5 colunas) */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#1E293B]">
                Resumo da Oportunidade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-1">
                <span className="text-[#94A3B8] block">Clínica Contratante:</span>
                <Link
                  href={`/usuarios/${req.clinicId}`}
                  className="font-bold text-sm text-[#0F766E] hover:underline flex items-center gap-1"
                >
                  <Building2 className="h-4 w-4" /> {req.clinicName}
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E2E8F0]">
                <div>
                  <span className="text-[#94A3B8] block">Remuneração:</span>
                  <span className="font-bold text-base text-[#16A34A]">
                    {formatCurrency(req.priceCents)}
                  </span>
                </div>
                <div>
                  <span className="text-[#94A3B8] block">Alvo Profissional:</span>
                  <span className="font-semibold text-[#1E293B]">
                    {req.targetProfessional === 'VET' ? 'Médico Veterinário' : 'Auxiliar Veterinário'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E2E8F0] space-y-1">
                <span className="text-[#94A3B8] block">Descrição do Trabalho:</span>
                <p className="text-[#1E293B] text-xs leading-relaxed bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                  {req.description}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Cancelamento */}
      <ConfirmModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancelRequest}
        title="Cancelar Solicitação em Nome da Clínica"
        description="Esta ação encerrará a solicitação e notificará os profissionais interessados."
        requiredWord="CONFIRMAR"
        destructive={true}
        confirmButtonText="Cancelar Solicitação"
      />
    </div>
  )
}
