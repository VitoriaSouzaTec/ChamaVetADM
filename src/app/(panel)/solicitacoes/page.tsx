import { listRequests, REQUESTS_PAGE_SIZE } from '@/server/queries/requests'
import { LoadError, load } from '@/components/shared/load-error'
import { RequestsView } from './requests-view'

export default async function SolicitacoesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
  const result = await load(() =>
    listRequests({
      q: params.q,
      status: params.status,
      urgent: params.urgent === 'true',
      stale: params.stale === 'true',
      hidden: params.hidden === 'true',
      page: Number(params.page) || 1,
    })
  )
  if (!result.ok) return <LoadError title="Gestão de Solicitações" message={result.error} />
  return <RequestsView {...result.data} pageSize={REQUESTS_PAGE_SIZE} />
}
