'use server'

import { getStaffContext } from '@/server/context'
import { callAdminRpc } from './_result'

type VerificationStatus = 'VERIFIED' | 'REJECTED' | 'NEEDS_INFO' | 'PENDING'

export async function setVerification(userId: string, status: VerificationStatus, note?: string) {
  return callAdminRpc('admin_set_verification', {
    p_user_id: userId,
    p_status: status,
    p_note: note,
  })
}

export async function setRequestModeration(
  requestId: string,
  status: 'VISIBLE' | 'HIDDEN',
  reason: string
) {
  return callAdminRpc('admin_set_request_moderation', {
    p_request_id: requestId,
    p_status: status,
    p_reason: reason,
  })
}

export async function cancelRequest(requestId: string, reason: string, giveCredit: boolean) {
  return callAdminRpc('admin_cancel_request', {
    p_request_id: requestId,
    p_reason: reason,
    p_give_credit: giveCredit,
  })
}

export async function setReviewModeration(
  reviewId: string,
  status: 'VISIBLE' | 'HIDDEN',
  reason: string
) {
  return callAdminRpc('admin_set_review_moderation', {
    p_review_id: reviewId,
    p_status: status,
    p_reason: reason,
  })
}

export async function assignReportToMe(reportId: string) {
  const { user } = await getStaffContext()
  return callAdminRpc('admin_update_report', {
    p_report_id: reportId,
    p_status: 'IN_REVIEW',
    p_assigned_to: user.id,
  })
}

export async function updateReport(
  reportId: string,
  changes: { status?: 'RESOLVED' | 'DISMISSED' | 'IN_REVIEW' | 'OPEN'; priority?: 'LOW' | 'NORMAL' | 'HIGH'; note?: string }
) {
  return callAdminRpc('admin_update_report', {
    p_report_id: reportId,
    p_status: changes.status,
    p_priority: changes.priority,
    p_note: changes.note,
  })
}
