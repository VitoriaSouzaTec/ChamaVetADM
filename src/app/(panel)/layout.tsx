import React from 'react'
import { cookies } from 'next/headers'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import type { AdminRole } from '@/types/database'

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let role: AdminRole = 'admin'
  let userEmail = 'admin@chamavet.com.br'
  let userName = 'Carlos (Admin)'

  const cookieStore = await cookies()
  const demoRole = cookieStore.get('chamavet_demo_role')?.value

  if (demoRole === 'support') {
    role = 'support'
    userEmail = 'suporte@chamavet.com.br'
    userName = 'Mariana (Suporte)'
  } else if (demoRole === 'admin') {
    role = 'admin'
    userEmail = 'admin@chamavet.com.br'
    userName = 'Carlos (Admin)'
  } else {
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        userEmail = user.email || userEmail
        role = (user.app_metadata?.admin_role ||
          user.app_metadata?.role ||
          'admin') as AdminRole
        userName =
          (user.user_metadata?.full_name as string) ||
          user.email?.split('@')[0] ||
          userName
      }
    } catch {
      // Fallback padrão
    }
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header userEmail={userEmail} userName={userName} role={role} />
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
