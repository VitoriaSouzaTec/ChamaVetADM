import { listReviews } from '@/server/queries/reviews'
import { LoadError, load } from '@/components/shared/load-error'
import { ReviewsView } from './reviews-view'

export default async function AvaliacoesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
  const rating = Number(params.rating)
  const result = await load(() =>
    listReviews({
      rating: rating >= 1 && rating <= 5 ? rating : undefined,
      hidden: params.hidden === 'true',
      withComment: params.comment === 'true',
    })
  )
  if (!result.ok) return <LoadError title="Moderação de Avaliações" message={result.error} />
  return <ReviewsView reviews={result.data} />
}
