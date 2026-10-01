'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Clock,
  Eye,
  EyeOff,
  Building2,
  Calendar,
  CheckCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ConfirmModal } from '@/components/shared/confirm-modal'
import { MOCK_REQUESTS, type RequestItem } from '@/server/mock-data'
import { formatCurrency, formatRelativeTime } from '@/lib/format'

export default function SolicitacoesPage() {
  const [requests, setRequests] = useState<RequestItem[]>(MOCK_REQUESTS)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [urgentOnly, setUrgentOnly] = useState(false)
  const [staleOnly, setStaleOnly] = useState(false)

  const [moderateModalOpen, setModerateModalOpen] = useState(false)
  const [targetRequest, setTargetRequest] = useState<RequestItem | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      !search ||
      r.clinicName.toLowerCase().includes(search.toLowerCase()) ||
      r.specialtyName.toLowerCase().includes(search.toLowerCase()) ||
      r.city.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter
    const matchesUrgent = !urgentOnly || r.urgent
    const matchesStale = !staleOnly || (r.urgent && r.interestsCount === 0)

    return matchesSearch && matchesStatus && matchesUrgent && matchesStale
  })

  async function handleToggleModeration(reason: string) {
    if (!targetRequest) return
    const newStatus = targetRequest.moderationStatus === 'VISIBLE' ? 'HIDDEN' : 'VISIBLE'
    setRequests((prev) =>
      prev.map((r) =>
        r.id === targetRequest.id
          ? { ...r, moderationStatus: newStatus, moderationReason: reason }
          : r
      )
    )
    setNotification(
      `Solicitação ${targetRequest.id} agora está ${newStatus === 'HIDDEN' ? 'OCULTA' : 'VISÍVEL'}. Motivo registrado.`
    )
    setTimeout(() => setNotification(null), 3500)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#1E293B]">
            Gestão de Solicitações
          </h1>
          <p className="text-sm text-[#64748B]">
            Acompanhe as oportunidades publicadas, modere anúncios e resolva casos urgentes
          </p>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] text-sm flex items-center gap-2 font-medium">
          <CheckCircle className="h-5 w-5" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filtros */}
      <Card className="shadow-xs">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#94A3B8]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por clínica, especialidade ou cidade..."
              className="pl-9 h-10 w-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 text-xs px-3 rounded-lg border border-[#E2E8F0] bg-white text-[#1E293B]"
            >
              <option value="ALL">Todos os Status</option>
              <option value="OPEN">Aberta (OPEN)</option>
              <option value="FILLED">Preenchida (FILLED)</option>
              <option value="CANCELED">Cancelada (CANCELED)</option>
            </select>

            <button
              onClick={() => setUrgentOnly(!urgentOnly)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                urgentOnly
                  ? 'bg-[#FFEDD5] border-[#F97316] text-[#F97316]'
                  : 'bg-white border-[#E2E8F0] text-[#64748B]'
              }`}
            >
              Apenas Urgentes
            </button>

            <button
              onClick={() => setStaleOnly(!staleOnly)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                staleOnly
                  ? 'bg-[#FEE2E2] border-[#DC2626] text-[#DC2626]'
                  : 'bg-white border-[#E2E8F0] text-[#64748B]'
              }`}
            >
              Sem Resposta (&gt;2h)
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Solicitações */}
      <div className="space-y-3">
        {filteredRequests.map((req) => (
          <Card key={req.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-base text-[#1E293B]">
                    {req.specialtyName} — {req.type}
                  </h3>
                  {req.urgent && (
                    <Badge variant="accent" className="font-bold">
                      URGENTE
                    </Badge>
                  )}
                  <Badge
                    variant={
                      req.status === 'FILLED'
                        ? 'success'
                        : req.status === 'OPEN'
                        ? 'secondary'
                        : 'muted'
                    }
                  >
                    {req.status}
                  </Badge>
                  {req.moderationStatus === 'HIDDEN' && (
                    <Badge variant="danger">OCULTA POR MODERAÇÃO</Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B]">
                  <span className="flex items-center gap-1 font-semibold text-[#1E293B]">
                    <Building2 className="h-3.5 w-3.5 text-[#0F766E]" />
                    {req.clinicName} ({req.city})
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Data: {req.workDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Publicada {formatRelativeTime(req.publishedAt)}
                  </span>
                </div>

                <p className="text-xs text-[#64748B] line-clamp-1">{req.description}</p>
              </div>

              {/* Informações à direita e Ações */}
              <div className="flex items-center gap-6 shrink-0 w-full lg:w-auto justify-between lg:justify-end pt-3 lg:pt-0 border-t lg:border-t-0 border-[#E2E8F0]">
                <div className="text-right">
                  <div className="text-sm font-bold text-[#0F766E]">
                    {formatCurrency(req.priceCents)}
                  </div>
                  <div className="text-xs text-[#64748B]">
                    {req.interestsCount} profissionais interessados
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTargetRequest(req)
                      setModerateModalOpen(true)
                    }}
                    className={`text-xs gap-1 cursor-pointer ${
                      req.moderationStatus === 'VISIBLE'
                        ? 'text-[#64748B] hover:text-[#DC2626]'
                        : 'text-[#16A34A]'
                    }`}
                  >
                    {req.moderationStatus === 'VISIBLE' ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5" /> Ocultar
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5" /> Reexibir
                      </>
                    )}
                  </Button>

                  <Link href={`/solicitacoes/${req.id}`}>
                    <Button variant="outline" size="sm" className="text-xs">
                      Ver Linha do Tempo
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de Moderação */}
      <ConfirmModal
        isOpen={moderateModalOpen}
        onClose={() => setModerateModalOpen(false)}
        onConfirm={handleToggleModeration}
        title={
          targetRequest?.moderationStatus === 'VISIBLE'
            ? 'Ocultar Solicitação da Plataforma'
            : 'Reexibir Solicitação'
        }
        description={
          targetRequest?.moderationStatus === 'VISIBLE'
            ? 'Ao ocultar, os profissionais não poderão visualizar nem se candidatar a esta solicitação.'
            : 'A solicitação voltará a ser exibida para os profissionais compatíveis no aplicativo.'
        }
        requiredWord="CONFIRMAR"
        destructive={targetRequest?.moderationStatus === 'VISIBLE'}
        confirmButtonText="Confirmar Alteração"
      />
    </div>
  )
}
