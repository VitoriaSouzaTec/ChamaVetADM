import { getAppConfig, getPricing, getSpecialtiesWithUsage, getPriceHistory } from '@/server/queries/settings'
import { getStaffContext } from '@/server/context'
import { LoadError, load } from '@/components/shared/load-error'
import { SettingsView } from './settings-view'

export default async function ConfiguracoesPage() {
  const result = await load(async () => {
    const { role } = await getStaffContext()
    if (role !== 'admin') throw new Error('Sem permissão. Apenas administradores.')
    return Promise.all([getAppConfig(), getPricing(), getSpecialtiesWithUsage(), getPriceHistory()])
  })
  if (!result.ok) return <LoadError title="Configurações da Plataforma" message={result.error} />
  const [config, pricing, specialties, priceHistory] = result.data
  return <SettingsView config={config} pricing={pricing} specialties={specialties} priceHistory={priceHistory} />
}
