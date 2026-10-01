'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { GlobalSearch } from '@/components/search/global-search'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { AdminRole } from '@/types/database'

interface HeaderProps {
  userEmail?: string
  userName?: string
  role?: AdminRole
}

export function Header({
  userEmail = 'admin@chamavet.com.br',
  userName = 'Administrador',
  role = 'admin',
}: HeaderProps) {
  const router = useRouter()
  const isDev = process.env.NEXT_PUBLIC_APP_ENV !== 'prod'

  async function handleSignOut() {
    try {
      document.cookie = 'chamavet_demo_role=; path=/; max-age=0'
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch {
      // Ignorar falha offline
    }
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-16 border-b border-[#E2E8F0] bg-white flex items-center justify-between px-8 sticky top-0 z-30">
      {/* Busca Global */}
      <div className="flex items-center gap-4">
        <GlobalSearch />
        {isDev && (
          <Badge
            variant="accent"
            className="uppercase font-mono text-[10px] tracking-wider font-bold py-1 px-2.5"
          >
            Ambiente Sandbox / Dev
          </Badge>
        )}
      </div>

      {/* Operador & Ações */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 pr-2 border-r border-[#E2E8F0]">
          <div className="h-8 w-8 rounded-full bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center font-bold text-xs">
            {userName.slice(0, 2).toUpperCase()}
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-[#1E293B] flex items-center gap-1.5">
              <span>{userName}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#F1F5F9] rounded text-[#64748B] uppercase">
                {role}
              </span>
            </div>
            <div className="text-[11px] text-[#64748B]">{userEmail}</div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="text-[#64748B] hover:text-[#DC2626] gap-1.5 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-xs">Sair</span>
        </Button>
      </div>
    </header>
  )
}
