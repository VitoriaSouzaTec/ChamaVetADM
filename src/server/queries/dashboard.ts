import 'server-only'
import { getStaffContext } from '@/server/context'

/** Contagens para os badges da sidebar. Falha silenciosa: os badges só somem. */
export async function getSidebarCounts() {
  try {
    const { supabase } = await getStaffContext()
    const [vets, clinics, reports] = await Promise.all([
      supabase.from('vets').select('id', { count: 'exact', head: true }).eq('verification_status', 'PENDING'),
      supabase.from('clinics').select('id', { count: 'exact', head: true }).eq('verification_status', 'PENDING'),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'OPEN'),
    ])
    return {
      pendingVerifications: (vets.count ?? 0) + (clinics.count ?? 0),
      openReports: reports.count ?? 0,
    }
  } catch {
    return {}
  }
}
