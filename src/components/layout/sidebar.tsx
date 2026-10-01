'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CheckCircle2,
  Users,
  FileText,
  AlertTriangle,
  Star,
  DollarSign,
  Megaphone,
  Settings,
  ShieldCheck,
  UserCheck,
  PawPrint,
} from 'lucide-react'
import { getVisibleNavItems } from '@/lib/permissions'
import type { AdminRole } from '@/types/database'
import { Badge } from '@/components/ui/badge'

interface SidebarProps {
  role: AdminRole
  counts?: {
    pendingVerifications?: number
    openReports?: number
  }
}

const ICON_MAP = {
  LayoutDashboard,
  CheckCircle2,
  Users,
  FileText,
  AlertTriangle,
  Star,
  DollarSign,
  Megaphone,
  Settings,
  ShieldCheck,
  UserCheck,
}

export function Sidebar({ role, counts = {} }: SidebarProps) {
  const pathname = usePathname()
  const navItems = getVisibleNavItems(role)

  return (
    <aside className="w-64 border-r border-[#E2E8F0] bg-white flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-[#E2E8F0]">
        <div className="h-9 w-9 rounded-xl bg-[#0F766E] flex items-center justify-center text-white shadow-xs">
          <PawPrint className="h-5 w-5" />
        </div>
        <div>
          <span className="font-heading font-bold text-lg text-[#1E293B] tracking-tight">
            ChamaVet
          </span>
          <span className="text-[11px] font-semibold text-[#0F766E] block -mt-1 uppercase tracking-wider">
            Admin
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = ICON_MAP[item.icon as keyof typeof ICON_MAP] || LayoutDashboard
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(`${item.href}/`)

          const count = item.badgeKey && counts[item.badgeKey] ? Number(counts[item.badgeKey]) : 0

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#0F766E] text-white shadow-xs'
                  : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-[#64748B]'}`} />
                <span>{item.title}</span>
              </div>
              {count > 0 && (
                <Badge
                  variant={isActive ? 'secondary' : 'accent'}
                  className="px-2 py-0.2 text-[11px] font-bold"
                >
                  {count}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer info */}
      <div className="p-4 border-t border-[#E2E8F0] text-xs text-[#94A3B8]">
        <div className="flex items-center justify-between">
          <span>Versão 1.0.0</span>
          <span className="font-mono uppercase text-[10px] bg-[#F1F5F9] px-2 py-0.5 rounded text-[#64748B]">
            {role}
          </span>
        </div>
      </div>
    </aside>
  )
}
