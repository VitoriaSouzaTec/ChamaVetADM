'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, Clock, Eye, EyeOff, Building2, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ConfirmModal } from '@/components/shared/confirm-modal'
import { Pagination } from '@/components/shared/pagination'
import { Notice, useNotice } from '@/components/shared/notice'
import { useUrlFilters } from '@/lib/use-url-filters'
import { unwrap } from '@/lib/action-client'
import { setRequestModeration } from '@/server/actions/moderation'
import { formatRelativeTime } from '@/lib/format'
import { formatRequestPrice, formatWorkDate } from '@/lib/request-format'
import type { RequestListItem } from '@/types/admin'

export function RequestsView({
  requests,
  total,
  page,
  pageSize,
}: {
  requests: RequestListItem[]
  total: number
  page: number
  pageSize: number
}) {
  const { searchParams, setFilters, isPending } = useUrlFilters()
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [moderateModalOpen, setModerateModalOpen] = useState(false)
  const [targetRequest, setTargetRequest] = useState<RequestListItem | null>(null)
  const { notice, success } = useNotice()

  const urgentOnly = searchParams.get('urgent') === 'true'
  const staleOnly = searchParams.get('stale') === 'true'
  const hiddenOnly = searchParams.get('hidden') === 'true'

  useEffect(() => {
    if (search === (searchParams.get('q') ?? '')) return
    const t = setTimeout(() => setFilters({ q: search }), 400)
    return () => clearTimeout(t)
  }, [search, searchParams, setFilters])

  async function handleToggleModeration(reason: string) {
    if (!targetRequest) return
    const newStatus = targetRequest.moderationStatus === 'VISIBLE' ? 'HIDDEN' : 'VISIBLE'
    unwrap(await setRequestModeration(targetRequest.id, newStatus, reason))
    success(`Solicitação agora está ${newStatus === 'HIDDEN' ? 'OCULTA' : 'VISÍVEL'}.`)
  }

  const toggleClass = (active: boolean, color: 'accent' | 'danger' | 'muted') =>
    `px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
      active
        ? color === 'accent'
          ? 'bg-[#FFEDD5] border-[#F97316] text-[#F97316]'
          : color === 'danger'
          ? 'bg-[#FEE2E2] border-[#DC2626] text-[#DC2626]'
          : 'bg-[#F1F5F9] border-[#64748B] text-[#1E293B]'
        : 'bg-white border-[#E2E8F0] text-[#64748B]'
    }`

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#1E293B]">Gestão de Solicitações</h1>
          <p className="text-sm text-[#64748B]">
            Acompanhe as oportunidades publicadas, modere anúncios e resolva casos urgentes
          </p>
        </div>
      </div>

      <Notice notice={notice} />

      {/* Filtros */}
      <Card className="shadow-xs">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#94A3B8]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por clínica, especialidade, tipo ou cidade..."
              className="pl-9 h-10 w-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={searchParams.get('status') ?? 'ALL'}
              onChange={(e) => setFilters({ status: e.target.value })}
              className="h-10 text-xs px-3 rounded-lg border border-[#E2E8F0] bg-white text-[#1E293B]"
            >
              <option value="ALL">Todos os Status</option>
              <option value="DRAFT">Rascunho (DRAFT)</option>
              <option value="OPEN">Aberta (OPEN)</option>
              <option value="FILLED">Preenchida (FILLED)</option>
              <option value="CANCELED">Cancelada (CANCELED)</option>
              <option value="CLOSED">Encerrada (CLOSED)</option>
            </select>

            <button onClick={() => setFilters({ urgent: !urgentOnly })} className={toggleClass(urgentOnly, 'accent')}>
              Apenas Urgentes
            </button>
            <button onClick={() => setFilters({ stale: !staleOnly })} className={toggleClass(staleOnly, 'danger')}>
              Sem Interessados (&gt;2h)
            </button>
            <button onClick={() => setFilters({ hidden: !hiddenOnly })} className={toggleClass(hiddenOnly, 'muted')}>
              Ocultas
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Solicitações */}
      <div className={`space-y-3 transition-opacity ${isPending ? 'opacity-60' : ''}`}>
        {requests.length === 0 && (
          <div className="p-12 text-center text-sm text-[#94A3B8] bg-white rounded-2xl border border-[#E2E8F0]">
            Nenhuma solicitação encontrada com os filtros selecionados.
          </div>
        )}
        {requests.map((req) => (
          <Card key={req.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-base text-[#1E293B]">
                    {req.specialtyName} — {req.type}
                  </h3>
                  {req.urgent && (
                    <Badge variant="accent" className="font-bold">
                      URGENTE
                    </Badge>
                  )}
                  <Badge variant={req.status === 'FILLED' ? 'success' : req.status === 'OPEN' ? 'secondary' : 'muted'}>
                    {req.status}
                  </Badge>
                  {req.moderationStatus === 'HIDDEN' && <Badge variant="danger">OCULTA POR MODERAÇÃO</Badge>}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B]">
                  <span className="flex items-center gap-1 font-semibold text-[#1E293B]">
                    <Building2 className="h-3.5 w-3.5 text-[#0F766E]" />
                    {req.clinicName}
                    {req.city ? ` (${req.city})` : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Data: {formatWorkDate(req.startDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {req.publishedAt
                      ? `Publicada ${formatRelativeTime(req.publishedAt)}`
                      : `Criada ${formatRelativeTime(req.createdAt)}`}
                  </span>
                </div>

                <p className="text-xs text-[#64748B] line-clamp-1">{req.description}</p>
              </div>

              <div className="flex items-center gap-6 shrink-0 w-full lg:w-auto justify-between lg:justify-end pt-3 lg:pt-0 border-t lg:border-t-0 border-[#E2E8F0]">
                <div className="text-right">
                  <div className="text-sm font-bold text-[#0F766E]">{formatRequestPrice(req.price)}</div>
                  <div className="text-xs text-[#64748B]">{req.interestsCount} interessado(s)</div>
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
                      req.moderationStatus === 'VISIBLE' ? 'text-[#64748B] hover:text-[#DC2626]' : 'text-[#16A34A]'
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

      <Pagination page={page} pageSize={pageSize} total={total} onPage={(p) => setFilters({ page: p }, false)} />

      <ConfirmModal
        isOpen={moderateModalOpen}
        onClose={() => setModerateModalOpen(false)}
        onConfirm={handleToggleModeration}
        title={targetRequest?.moderationStatus === 'VISIBLE' ? 'Ocultar Solicitação da Plataforma' : 'Reexibir Solicitação'}
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
