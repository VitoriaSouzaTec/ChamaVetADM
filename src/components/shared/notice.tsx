'use client'

import { useState } from 'react'
import { CheckCircle, AlertTriangle } from 'lucide-react'

export type NoticeState = { kind: 'success' | 'error'; text: string } | null

/** Faixa de sucesso/erro com auto-hide (o mesmo estilo usado em todo o painel). */
export function useNotice() {
  const [notice, setNotice] = useState<NoticeState>(null)
  function show(kind: 'success' | 'error', text: string) {
    setNotice({ kind, text })
    setTimeout(() => setNotice(null), kind === 'error' ? 6000 : 4000)
  }
  return {
    notice,
    success: (text: string) => show('success', text),
    error: (text: string) => show('error', text),
  }
}

export function Notice({ notice }: { notice: NoticeState }) {
  if (!notice) return null
  const isError = notice.kind === 'error'
  const Icon = isError ? AlertTriangle : CheckCircle
  return (
    <div
      role="status"
      className={`p-4 rounded-xl border text-sm flex items-center gap-2 font-medium ${
        isError
          ? 'bg-[#FEE2E2] border-[#FECACA] text-[#DC2626]'
          : 'bg-[#DCFCE7] border-[#BBF7D0] text-[#16A34A]'
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span>{notice.text}</span>
    </div>
  )
}
