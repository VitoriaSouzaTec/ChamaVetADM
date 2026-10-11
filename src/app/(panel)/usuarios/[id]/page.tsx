import { notFound } from 'next/navigation'
import { getUserDetail } from '@/server/queries/users'
import { getStaffContext } from '@/server/context'
import { LoadError, load } from '@/components/shared/load-error'
import { UserDetailView } from './user-detail-view'

export default async function UsuarioDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await load(() => Promise.all([getUserDetail(id), getStaffContext()]))
  if (!result.ok) return <LoadError title="Detalhe do Usuário" message={result.error} />
  const [detail, { role }] = result.data
  if (!detail) notFound()
  return <UserDetailView user={detail} staffRole={role} />
}
