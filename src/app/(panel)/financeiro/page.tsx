import { getFinanceData } from '@/server/queries/finance'
import { LoadError, load } from '@/components/shared/load-error'
import { FinanceView } from './finance-view'

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const { tab } = await searchParams
  const result = await load(() => getFinanceData())
  if (!result.ok) return <LoadError title="Gestão Financeira" message={result.error} />
  return <FinanceView data={result.data} initialTab={tab} />
}
