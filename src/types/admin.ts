// Modelos de exibição do painel (montados no servidor a partir das tabelas do Supabase).

export type AppRole = 'VET' | 'AUXILIAR' | 'CLINIC'
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'DELETED'
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NEEDS_INFO'
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'OVERDUE' | 'CANCELED'
export type RequestStatus = 'DRAFT' | 'OPEN' | 'FILLED' | 'CANCELED' | 'CLOSED'
export type ModerationStatus = 'VISIBLE' | 'HIDDEN'
export type ReportStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED'
export type ReportPriority = 'LOW' | 'NORMAL' | 'HIGH'
export type ReportTargetType = 'PROFILE' | 'REQUEST' | 'REVIEW'

export interface UserListItem {
  id: string
  fullName: string
  email: string | null
  maskedPhone: string
  role: AppRole
  status: AccountStatus
  verificationStatus: VerificationStatus | null
  identifier: string
  city: string | null
  ratingAvg: number | null
  ratingCount: number
  createdAt: string
  lastAccess: string | null
  subscriptionStatus: SubscriptionStatus | null
  credits: number | null
}

export interface VerificationItem {
  userId: string
  type: 'VET' | 'CLINIC'
  name: string
  identifier: string
  cnpj: string | null
  city: string | null
  status: VerificationStatus
  createdAt: string
  hoursInQueue: number
  specialties: string[]
  documents: Array<{ id: string; name: string; type: string }>
  note: string | null
  address: string | null
}

export interface RequestListItem {
  id: string
  clinicId: string
  clinicName: string
  city: string | null
  specialtyName: string
  type: string
  description: string
  startDate: string | null
  price: number | null
  urgent: boolean
  status: RequestStatus
  moderationStatus: ModerationStatus
  interestsCount: number
  publishedAt: string | null
  createdAt: string
}

export interface ReportListItem {
  id: string
  reporterId: string
  reporterName: string
  targetType: ReportTargetType
  targetId: string
  targetTitle: string
  reason: string
  description: string | null
  status: ReportStatus
  priority: ReportPriority
  assignedToName: string | null
  createdAt: string
  slaHoursRemaining: number
}

export interface ReviewListItem {
  id: string
  requestId: string
  reviewerId: string
  reviewerName: string
  reviewedId: string
  reviewedName: string
  rating: number
  comment: string | null
  createdAt: string
  moderationStatus: ModerationStatus
  hasOffensiveWord: boolean
}

export interface AuditItem {
  id: string
  createdAt: string
  actorName: string
  actorRole: string | null
  action: string
  entity: string
  entityId: string | null
  reason: string | null
  before: unknown
  after: unknown
  metadata: unknown
}

export interface NoteItem {
  id: string
  authorName: string
  body: string
  createdAt: string
}
