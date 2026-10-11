'use client'

import { useCallback, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

/** Filtros da tela na URL (a página no servidor relê e consulta o banco). */
export function useUrlFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const setFilters = useCallback(
    (changes: Record<string, string | number | boolean | null | undefined>, resetPage = true) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === undefined || value === '' || value === false || value === 'ALL') {
          params.delete(key)
        } else {
          params.set(key, String(value))
        }
      }
      if (resetPage && !('page' in changes)) params.delete('page')
      const qs = params.toString()
      startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname))
    },
    [pathname, router, searchParams]
  )

  return { searchParams, setFilters, isPending }
}
