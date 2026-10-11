import { listUsers, USERS_PAGE_SIZE } from '@/server/queries/users'
import { LoadError, load } from '@/components/shared/load-error'
import { UsersView } from './users-view'

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
  const result = await load(() =>
    listUsers({
      q: params.q,
      role: params.role,
      status: params.status,
      verification: params.verification,
      page: Number(params.page) || 1,
    })
  )
  if (!result.ok) return <LoadError title="Gestão de Usuários" message={result.error} />
  return <UsersView {...result.data} pageSize={USERS_PAGE_SIZE} />
}
