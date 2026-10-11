import { notFound } from 'next/navigation'
import { getReportDetail } from '@/server/queries/reports'
import { LoadError, load } from '@/components/shared/load-error'
import { ReportDetailView } from './report-detail-view'

export default async function DenunciaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await load(() => getReportDetail(id))
  if (!result.ok) return <LoadError title="Detalhe da Denúncia" message={result.error} />
  if (!result.data) notFound()
  return <ReportDetailView report={result.data} />
}
