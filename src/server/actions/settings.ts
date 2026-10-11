'use server'

import type { Json } from '@/types/database'
import { callAdminRpc, type ActionResult } from './_result'

export async function updateConfig(key: string, value: Json, reason: string) {
  return callAdminRpc('admin_update_config', { p_key: key, p_value: value, p_reason: reason })
}

/** Salva várias chaves de app_config com o mesmo motivo; para no primeiro erro. */
export async function updateConfigs(
  entries: Array<{ key: string; value: Json }>,
  reason: string
): Promise<ActionResult> {
  for (const { key, value } of entries) {
    const result = await updateConfig(key, value, reason)
    if (!result.ok) return { ok: false, error: `${key}: ${result.error}` }
  }
  return { ok: true }
}

export async function updatePrices(
  entries: Array<{ key: string; amountCents: number }>,
  reason: string
): Promise<ActionResult> {
  for (const { key, amountCents } of entries) {
    const result = await callAdminRpc('admin_update_price', {
      p_key: key,
      p_amount_cents: amountCents,
      p_reason: reason,
    })
    if (!result.ok) return { ok: false, error: `${key}: ${result.error}` }
  }
  return { ok: true }
}

export async function upsertSpecialty(input: { id?: string; name: string; icon?: string; active?: boolean }) {
  return callAdminRpc('admin_upsert_specialty', {
    p_id: input.id,
    p_name: input.name,
    p_icon: input.icon,
    p_active: input.active,
  })
}

export async function setSpecialtyActive(id: string, active: boolean) {
  return callAdminRpc('admin_set_specialty_active', { p_id: id, p_active: active })
}

export async function createAndSendAnnouncement(input: {
  title: string
  body: string
  roles: string[]
  url?: string
}): Promise<ActionResult> {
  const created = await callAdminRpc('admin_create_announcement', {
    p_title: input.title,
    p_body: input.body,
    p_audience: { roles: input.roles },
    p_url: input.url || undefined,
  })
  if (!created.ok) return created
  if (!created.data) return { ok: false, error: 'O comunicado não retornou um id.' }
  const sent = await callAdminRpc('admin_send_announcement', { p_id: created.data })
  if (!sent.ok) return { ok: false, error: 'Comunicado salvo como rascunho, mas o envio falhou: ' + sent.error }
  return { ok: true }
}
