import 'server-only'
import { getStaffContext, fetchProfileNames } from '@/server/context'
import type { ReviewListItem } from '@/types/admin'
import { getBlockedWords } from './settings'
import { assertNoError } from './_util'

export interface ReviewFilters {
  rating?: number
  hidden?: boolean
  withComment?: boolean
}

export async function listReviews(filters: ReviewFilters) {
  const { supabase } = await getStaffContext()
  let query = supabase.from('reviews').select('*').order('created_at', { ascending: false }).limit(200)
  if (filters.rating) query = query.eq('rating', filters.rating)
  if (filters.hidden) query = query.eq('moderation_status', 'HIDDEN')
  if (filters.withComment) query = query.not('comment', 'is', null)

  const [{ data, error }, blockedWords] = await Promise.all([query, getBlockedWords()])
  assertNoError(error, 'Falha ao carregar avaliações')
  const rows = data ?? []
  const names = await fetchProfileNames(rows.flatMap((r) => [r.reviewer_id, r.reviewed_id]))
  const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const words = blockedWords.map(normalize).filter(Boolean)

  const reviews: ReviewListItem[] = rows.map((r) => ({
    id: r.id,
    requestId: r.request_id,
    reviewerId: r.reviewer_id,
    reviewerName: names.get(r.reviewer_id) ?? 'Usuário',
    reviewedId: r.reviewed_id,
    reviewedName: names.get(r.reviewed_id) ?? 'Usuário',
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at,
    moderationStatus: r.moderation_status,
    hasOffensiveWord: Boolean(r.comment && words.some((w) => normalize(r.comment!).includes(w))),
  }))
  return reviews
}
