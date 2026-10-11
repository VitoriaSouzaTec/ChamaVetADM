'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffContext, writeAudit, friendlyError } from '@/server/context'
import { callAdminRpc, runAction, type ActionResult } from './_result'

const MAX_SUPPORT_SUSPENSION_DAYS = 7

export async function suspendUser(userId: string, days: number, reason: string) {
  const { role } = await getStaffContext()
  if (role !== 'admin' && days > MAX_SUPPORT_SUSPENSION_DAYS) {
    return { ok: false, error: 'Suporte só pode suspender por até 7 dias.' } as const
  }
  const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
  return callAdminRpc('admin_suspend_user', { p_user_id: userId, p_until: until, p_reason: reason })
}

export async function banUser(userId: string, reason: string): Promise<ActionResult> {
  const result = await callAdminRpc('admin_ban_user', { p_user_id: userId, p_reason: reason })
  if (!result.ok) return result
  // Bloqueia também no Supabase Auth (invalida o login).
  return runAction(async () => {
    const { error } = await createAdminClient().auth.admin.updateUserById(userId, {
      ban_duration: '876000h',
    })
    if (error) throw new Error('Conta banida no app, mas falhou o bloqueio no Auth: ' + error.message)
    await writeAudit({ action: 'auth_ban_user', entity: 'auth.users', entityId: userId, reason })
    return undefined
  })
}

export async function reactivateUser(userId: string, reason: string): Promise<ActionResult> {
  const result = await callAdminRpc('admin_reactivate_user', { p_user_id: userId, p_reason: reason })
  if (!result.ok) return result
  return runAction(async () => {
    const { error } = await createAdminClient().auth.admin.updateUserById(userId, {
      ban_duration: 'none',
    })
    if (error) throw new Error('Conta reativada no app, mas falhou o desbloqueio no Auth: ' + error.message)
    return undefined
  })
}

export async function updateUserFields(
  userId: string,
  fields: Record<string, string>,
  reason: string
) {
  return callAdminRpc('admin_update_user_fields', {
    p_user_id: userId,
    p_fields: fields,
    p_reason: reason,
  })
}

export async function grantCredits(clinicId: string, amount: number, reason: string) {
  return callAdminRpc('admin_grant_credits', {
    p_clinic_id: clinicId,
    p_amount: amount,
    p_reason: reason,
  })
}

export async function extendTrial(userId: string, days: number, reason: string) {
  return callAdminRpc('admin_extend_trial', { p_user_id: userId, p_days: days, p_reason: reason })
}

export async function addNote(targetType: 'PROFILE' | 'REQUEST', targetId: string, body: string) {
  return callAdminRpc('admin_add_note', {
    p_target_type: targetType,
    p_target_id: targetId,
    p_body: body,
  })
}

/** Retorna o telefone completo e registra a visualização na auditoria. */
export async function revealPhone(userId: string): Promise<ActionResult<string>> {
  try {
    const { supabase } = await getStaffContext()
    const { data, error } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', userId)
      .single()
    if (error) return { ok: false, error: friendlyError(error.message) }
    await writeAudit({
      action: 'view_sensitive_data',
      entity: 'profiles',
      entityId: userId,
      metadata: { field: 'phone' },
    })
    return { ok: true, data: data.phone ?? '' }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erro inesperado.' }
  }
}

/** Gera URL assinada de 5 minutos para um documento do bucket privado e audita. */
export async function getDocumentUrl(documentId: string): Promise<ActionResult<string>> {
  try {
    const { supabase } = await getStaffContext()
    const { data: doc, error } = await supabase
      .from('vet_documents')
      .select('id, vet_id, file_path, file_name')
      .eq('id', documentId)
      .single()
    if (error) return { ok: false, error: friendlyError(error.message) }

    const { data: signed, error: signError } = await createAdminClient()
      .storage.from('documents')
      .createSignedUrl(doc.file_path, 300)
    if (signError || !signed) return { ok: false, error: 'Não foi possível gerar o link do documento.' }

    await writeAudit({
      action: 'view_document',
      entity: 'vet_documents',
      entityId: doc.id,
      metadata: { vet_id: doc.vet_id, file_name: doc.file_name },
    })
    return { ok: true, data: signed.signedUrl }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erro inesperado.' }
  }
}
