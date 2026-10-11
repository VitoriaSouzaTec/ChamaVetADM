import { notFound } from 'next/navigation'
import { getRequestDetail } from '@/server/queries/requests'
import { getStaffContext } from '@/server/context'
import { LoadError, load } from '@/components/shared/load-error'
import { RequestDetailView } from './request-detail-view'

export default async function SolicitacaoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await load(() => Promise.all([getRequestDetail(id), getStaffContext()]))
  if (!result.ok) return <LoadError title="Detalhe da Solicitação" message={result.error} />
  const [detail, { role }] = result.data
  if (!detail) notFound()
  return <RequestDetailView req={detail} staffRole={role} />
}
