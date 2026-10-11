import { listVerifications } from '@/server/queries/verifications'
import { LoadError, load } from '@/components/shared/load-error'
import type { VerificationStatus } from '@/types/admin'
import { VerificationsView } from './verifications-view'

const STATUSES: VerificationStatus[] = ['PENDING', 'NEEDS_INFO', 'REJECTED', 'VERIFIED']

export default async function VerificacoesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
  const type = params.type === 'CLINIC' ? 'CLINIC' : 'VET'
  const status = STATUSES.includes(params.status as VerificationStatus)
    ? (params.status as VerificationStatus)
    : 'PENDING'
  const result = await load(() => listVerifications(type, status))
  if (!result.ok) return <LoadError title="Fila de Verificação de Cadastros" message={result.error} />
  return <VerificationsView items={result.data} type={type} status={status} />
}
