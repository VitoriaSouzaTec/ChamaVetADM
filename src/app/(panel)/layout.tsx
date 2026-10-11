import React from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { getStaffContext } from '@/server/context'
import { getSidebarCounts } from '@/server/queries/dashboard'
import type { AdminRole } from '@/types/database'

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let role: AdminRole = 'support'
  let userEmail = ''
  let userName = 'Equipe'

  try {
    const { user, role: staffRole } = await getStaffContext()
    role = staffRole
    userEmail = user.email ?? ''
    userName = (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || userName
  } catch {
    // O middleware já redireciona sessões inválidas para /login.
  }

  const counts = await getSidebarCounts()

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar role={role} counts={counts} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header userEmail={userEmail} userName={userName} role={role} />
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
