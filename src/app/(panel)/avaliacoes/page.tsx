'use client'

import React, { useState } from 'react'
import {
  Star,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmModal } from '@/components/shared/confirm-modal'
import { MOCK_REVIEWS, type ReviewItem } from '@/server/mock-data'
import { formatDate } from '@/lib/format'

export default function AvaliacoesPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>(MOCK_REVIEWS)
  const [starFilter, setStarFilter] = useState<number | 'ALL'>('ALL')
  const [offensiveOnly, setOffensiveOnly] = useState(false)

  const [moderateModalOpen, setModerateModalOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  const filteredReviews = reviews.filter((r) => {
    const matchesStar = starFilter === 'ALL' || r.rating === starFilter
    const matchesOffensive = !offensiveOnly || r.hasOffensiveWord
    return matchesStar && matchesOffensive
  })

  async function handleToggleModeration(reason: string) {
    if (!selectedReview) return
    const newStatus = selectedReview.moderationStatus === 'VISIBLE' ? 'HIDDEN' : 'VISIBLE'

    setReviews((prev) =>
      prev.map((r) =>
        r.id === selectedReview.id ? { ...r, moderationStatus: newStatus } : r
      )
    )
    setNotification(
      `Avaliação agora está ${newStatus === 'HIDDEN' ? 'OCULTA' : 'VISÍVEL'}. Motivo: ${reason}. Média recalculada no banco.`
    )
    setTimeout(() => setNotification(null), 3500)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#1E293B]">
            Moderação de Avaliações
          </h1>
          <p className="text-sm text-[#64748B]">
            Mantenha as estrelas confiáveis, trate ofensas e oculte conteúdos impróprios
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
      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border border-[#E2E8F0] text-xs font-semibold">
        <button
          onClick={() => setStarFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            starFilter === 'ALL'
              ? 'bg-[#0F766E] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          Todas as Notas
        </button>
        {[5, 4, 3, 2, 1].map((s) => (
          <button
            key={s}
            onClick={() => setStarFilter(s)}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
              starFilter === s
                ? 'bg-[#0F766E] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {s} estrelas
          </button>
        ))}

        <div className="h-4 w-[1px] bg-[#E2E8F0] mx-2" />

        <button
          onClick={() => setOffensiveOnly(!offensiveOnly)}
          className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1 cursor-pointer ${
            offensiveOnly
              ? 'bg-[#FEE2E2] border-[#DC2626] text-[#DC2626]'
              : 'bg-white border-[#E2E8F0] text-[#64748B]'
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Termos Ofensivos / Suspeitos
        </button>
      </div>

      {/* Lista de Avaliações */}
      <div className="space-y-3">
        {filteredReviews.map((rev) => (
          <Card
            key={rev.id}
            className={`hover:shadow-md transition-shadow ${
              rev.hasOffensiveWord ? 'border-l-4 border-l-[#DC2626] bg-[#FEF2F2]/20' : ''
            }`}
          >
            <CardContent className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-sm bg-amber-50 px-2 py-0.5 rounded-md">
                    <Star className="h-4 w-4 fill-amber-500" />
                    <span>{rev.rating}.0</span>
                  </div>

                  <span className="text-xs text-[#64748B]">
                    De <strong className="text-[#1E293B]">{rev.reviewerName}</strong> para{' '}
                    <strong className="text-[#1E293B]">{rev.reviewedName}</strong>
                  </span>

                  <span className="text-xs text-[#94A3B8]">· {formatDate(rev.createdAt)}</span>

                  {rev.hasOffensiveWord && (
                    <Badge variant="danger" className="text-[10px]">
                      TERMO SUSPEITO DETECTADO
                    </Badge>
                  )}

                  {rev.moderationStatus === 'HIDDEN' && (
                    <Badge variant="muted" className="text-[10px]">
                      OCULTA (FORA DA MÉDIA)
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-[#1E293B] italic">
                  &ldquo;{rev.comment}&rdquo;
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedReview(rev)
                    setModerateModalOpen(true)
                  }}
                  className={`text-xs gap-1.5 cursor-pointer ${
                    rev.moderationStatus === 'VISIBLE'
                      ? 'text-[#DC2626] hover:bg-[#FEE2E2]'
                      : 'text-[#16A34A]'
                  }`}
                >
                  {rev.moderationStatus === 'VISIBLE' ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" /> Ocultar Avaliação
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" /> Reexibir Avaliação
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de Ocultar/Reexibir */}
      <ConfirmModal
        isOpen={moderateModalOpen}
        onClose={() => setModerateModalOpen(false)}
        onConfirm={handleToggleModeration}
        title={
          selectedReview?.moderationStatus === 'VISIBLE'
            ? 'Ocultar Avaliação'
            : 'Reexibir Avaliação'
        }
        description={
          selectedReview?.moderationStatus === 'VISIBLE'
            ? 'Ao ocultar, a nota desta avaliação deixará de computar na média do profissional/clínica avaliado.'
            : 'A nota voltará a ser calculada na média geral.'
        }
        requiredWord="CONFIRMAR"
        destructive={selectedReview?.moderationStatus === 'VISIBLE'}
        confirmButtonText="Confirmar Moderação"
      />
    </div>
  )
}
