'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Star, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmModal } from '@/components/shared/confirm-modal'
import { Notice, useNotice } from '@/components/shared/notice'
import { useUrlFilters } from '@/lib/use-url-filters'
import { unwrap } from '@/lib/action-client'
import { setReviewModeration } from '@/server/actions/moderation'
import { formatDate } from '@/lib/format'
import type { ReviewListItem } from '@/types/admin'

export function ReviewsView({ reviews }: { reviews: ReviewListItem[] }) {
  const { searchParams, setFilters, isPending } = useUrlFilters()
  const [offensiveOnly, setOffensiveOnly] = useState(false)
  const [moderateModalOpen, setModerateModalOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState<ReviewListItem | null>(null)
  const { notice, success } = useNotice()

  const starFilter = Number(searchParams.get('rating')) || null
  const hiddenOnly = searchParams.get('hidden') === 'true'
  const commentOnly = searchParams.get('comment') === 'true'

  const filteredReviews = reviews.filter((r) => !offensiveOnly || r.hasOffensiveWord)

  async function handleToggleModeration(reason: string) {
    if (!selectedReview) return
    const newStatus = selectedReview.moderationStatus === 'VISIBLE' ? 'HIDDEN' : 'VISIBLE'
    unwrap(await setReviewModeration(selectedReview.id, newStatus, reason))
    success(`Avaliação agora está ${newStatus === 'HIDDEN' ? 'OCULTA' : 'VISÍVEL'}. Média recalculada.`)
  }

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
      active ? 'bg-[#0F766E] text-white shadow-xs' : 'text-[#64748B] hover:text-[#1E293B]'
    }`

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold font-heading text-[#1E293B]">Moderação de Avaliações</h1>
        <p className="text-sm text-[#64748B]">
          Mantenha as estrelas confiáveis, trate ofensas e oculte conteúdos impróprios
        </p>
      </div>

      <Notice notice={notice} />

      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border border-[#E2E8F0] text-xs font-semibold">
        <button onClick={() => setFilters({ rating: null })} className={chip(starFilter === null)}>
          Todas as Notas
        </button>
        {[5, 4, 3, 2, 1].map((s) => (
          <button key={s} onClick={() => setFilters({ rating: s })} className={chip(starFilter === s)}>
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {s} {s === 1 ? 'estrela' : 'estrelas'}
          </button>
        ))}

        <div className="h-4 w-[1px] bg-[#E2E8F0] mx-2" />

        <button onClick={() => setFilters({ comment: !commentOnly })} className={chip(commentOnly)}>
          Com comentário
        </button>
        <button onClick={() => setFilters({ hidden: !hiddenOnly })} className={chip(hiddenOnly)}>
          Ocultas
        </button>
        <button
          onClick={() => setOffensiveOnly(!offensiveOnly)}
          className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1 cursor-pointer ${
            offensiveOnly ? 'bg-[#FEE2E2] border-[#DC2626] text-[#DC2626]' : 'bg-white border-[#E2E8F0] text-[#64748B]'
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Termos Ofensivos / Suspeitos
        </button>
      </div>

      <div className={`space-y-3 transition-opacity ${isPending ? 'opacity-60' : ''}`}>
        {filteredReviews.length === 0 && (
          <div className="p-12 text-center text-sm text-[#94A3B8] bg-white rounded-2xl border border-[#E2E8F0]">
            Nenhuma avaliação com os filtros selecionados.
          </div>
        )}
        {filteredReviews.map((rev) => {
          const highlight = rev.hasOffensiveWord || rev.rating === 1
          return (
            <Card
              key={rev.id}
              className={`hover:shadow-md transition-shadow ${highlight ? 'border-l-4 border-l-[#DC2626] bg-[#FEF2F2]/20' : ''}`}
            >
              <CardContent className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1 text-amber-500 font-bold text-sm bg-amber-50 px-2 py-0.5 rounded-md">
                      <Star className="h-4 w-4 fill-amber-500" />
                      <span>{rev.rating}.0</span>
                    </div>

                    <span className="text-xs text-[#64748B]">
                      De{' '}
                      <Link href={`/usuarios/${rev.reviewerId}`} className="font-bold text-[#1E293B] hover:text-[#0F766E]">
                        {rev.reviewerName}
                      </Link>{' '}
                      para{' '}
                      <Link href={`/usuarios/${rev.reviewedId}`} className="font-bold text-[#1E293B] hover:text-[#0F766E]">
                        {rev.reviewedName}
                      </Link>
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

                  {rev.comment ? (
                    <p className="text-sm text-[#1E293B] italic">&ldquo;{rev.comment}&rdquo;</p>
                  ) : (
                    <p className="text-xs text-[#94A3B8]">Sem comentário.</p>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <Link href={`/solicitacoes/${rev.requestId}`}>
                    <Button variant="ghost" size="sm" className="text-xs">
                      Ver trabalho
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedReview(rev)
                      setModerateModalOpen(true)
                    }}
                    className={`text-xs gap-1.5 cursor-pointer ${
                      rev.moderationStatus === 'VISIBLE' ? 'text-[#DC2626] hover:bg-[#FEE2E2]' : 'text-[#16A34A]'
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
          )
        })}
      </div>

      <ConfirmModal
        isOpen={moderateModalOpen}
        onClose={() => setModerateModalOpen(false)}
        onConfirm={handleToggleModeration}
        title={selectedReview?.moderationStatus === 'VISIBLE' ? 'Ocultar Avaliação' : 'Reexibir Avaliação'}
        description={
          selectedReview?.moderationStatus === 'VISIBLE'
            ? 'Ao ocultar, a nota desta avaliação deixará de contar na média do avaliado.'
            : 'A nota voltará a ser calculada na média geral.'
        }
        requiredWord="CONFIRMAR"
        destructive={selectedReview?.moderationStatus === 'VISIBLE'}
        confirmButtonText="Confirmar Moderação"
      />
    </div>
  )
}
