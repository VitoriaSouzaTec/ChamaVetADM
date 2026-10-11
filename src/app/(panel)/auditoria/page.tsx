import { listAudit } from '@/server/queries/audit'
import { getStaffContext } from '@/server/context'
import { LoadError, load } from '@/components/shared/load-error'
import { AuditView } from './audit-view'

export default async function AuditoriaPage() {
  const result = await load(() => Promise.all([listAudit(), getStaffContext()]))
  if (!result.ok) return <LoadError title="Trilha de Auditoria" message={result.error} />
  const [logs, { role }] = result.data
  return <AuditView logs={logs} isAdmin={role === 'admin'} />
}
