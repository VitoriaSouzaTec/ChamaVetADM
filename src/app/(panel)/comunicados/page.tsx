import { listAnnouncements, countActiveUsersByRole } from '@/server/queries/settings'
import { getStaffContext } from '@/server/context'
import { LoadError, load } from '@/components/shared/load-error'
import { AnnouncementsView } from './announcements-view'

export default async function ComunicadosPage() {
  const result = await load(async () => {
    const { role } = await getStaffContext()
    if (role !== 'admin') throw new Error('Sem permissão. Apenas administradores.')
    return Promise.all([listAnnouncements(), countActiveUsersByRole()])
  })
  if (!result.ok) return <LoadError title="Comunicados em Massa" message={result.error} />
  const [history, counts] = result.data
  return <AnnouncementsView history={history} counts={counts} />
}
