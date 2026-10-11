import { listReports } from '@/server/queries/reports'
import { LoadError, load } from '@/components/shared/load-error'
import type { ReportStatus } from '@/types/admin'
import { ReportsView } from './reports-view'

const STATUSES: ReportStatus[] = ['OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED']

export default async function DenunciasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
  const status = STATUSES.includes(params.status as ReportStatus) ? (params.status as ReportStatus) : 'OPEN'
  const result = await load(() => listReports(status))
  if (!result.ok) return <LoadError title="Fila de Denúncias e Moderação" message={result.error} />
  return <ReportsView reports={result.data} status={status} />
}
