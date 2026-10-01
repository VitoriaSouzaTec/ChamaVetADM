import type { AdminRole } from '@/types/database'

export type StaffPermission =
  | 'view_dashboard'
  | 'view_users'
  | 'view_requests'
  | 'view_reviews'
  | 'verify_crmv_cnpj'
  | 'handle_reports'
  | 'moderate_content'
  | 'suspend_user_short' // até 7 dias
  | 'suspend_user_long' // mais de 7 dias
  | 'ban_user'
  | 'reactivate_user'
  | 'edit_user_fields'
  | 'grant_credits_trial'
  | 'manage_finance' // estornos, webhooks, exportação contábil
  | 'manage_config' // flags e preços
  | 'manage_specialties'
  | 'send_announcements'
  | 'delete_account_lgpd'
  | 'export_user_data_lgpd'
  | 'view_audit_all'
  | 'manage_team'

const ROLE_PERMISSIONS: Record<AdminRole, StaffPermission[]> = {
  support: [
    'view_dashboard',
    'view_users',
    'view_requests',
    'view_reviews',
    'verify_crmv_cnpj',
    'handle_reports',
    'moderate_content',
    'suspend_user_short',
  ],
  admin: [
    'view_dashboard',
    'view_users',
    'view_requests',
    'view_reviews',
    'verify_crmv_cnpj',
    'handle_reports',
    'moderate_content',
    'suspend_user_short',
    'suspend_user_long',
    'ban_user',
    'reactivate_user',
    'edit_user_fields',
    'grant_credits_trial',
    'manage_finance',
    'manage_config',
    'manage_specialties',
    'send_announcements',
    'delete_account_lgpd',
    'export_user_data_lgpd',
    'view_audit_all',
    'manage_team',
  ],
}

export function hasPermission(role: AdminRole | null | undefined, permission: StaffPermission): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function isAdmin(role: AdminRole | null | undefined): boolean {
  return role === 'admin'
}

export function isStaff(role: AdminRole | null | undefined): boolean {
  return role === 'admin' || role === 'support'
}

export interface NavItem {
  title: string
  href: string
  icon: string
  badgeKey?: 'pendingVerifications' | 'openReports'
  requiredRole?: AdminRole
}

export const NAV_ITEMS: NavItem[] = [
  { title: 'Início', href: '/', icon: 'LayoutDashboard' },
  { title: 'Verificações', href: '/verificacoes', icon: 'CheckCircle2', badgeKey: 'pendingVerifications' },
  { title: 'Usuários', href: '/usuarios', icon: 'Users' },
  { title: 'Solicitações', href: '/solicitacoes', icon: 'FileText' },
  { title: 'Denúncias', href: '/denuncias', icon: 'AlertTriangle', badgeKey: 'openReports' },
  { title: 'Avaliações', href: '/avaliacoes', icon: 'Star' },
  { title: 'Financeiro', href: '/financeiro', icon: 'DollarSign', requiredRole: 'admin' },
  { title: 'Comunicados', href: '/comunicados', icon: 'Megaphone', requiredRole: 'admin' },
  { title: 'Configurações', href: '/configuracoes', icon: 'Settings', requiredRole: 'admin' },
  { title: 'Auditoria', href: '/auditoria', icon: 'ShieldCheck' },
  { title: 'Equipe', href: '/equipe', icon: 'UserCheck', requiredRole: 'admin' },
]

export function getVisibleNavItems(role: AdminRole | null | undefined): NavItem[] {
  if (!role) return []
  return NAV_ITEMS.filter((item) => {
    if (!item.requiredRole) return true
    return item.requiredRole === role
  })
}
