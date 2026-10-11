import { listStaff } from '@/server/queries/team'
import { LoadError, load } from '@/components/shared/load-error'
import { TeamView } from './team-view'

export default async function EquipePage() {
  const result = await load(() => listStaff())
  if (!result.ok) return <LoadError title="Gestão da Equipe Interna" message={result.error} />
  return <TeamView members={result.data} />
}
