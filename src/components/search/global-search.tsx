'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Search, Loader2, User, FileText, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface SearchResult {
  id: string
  title: string
  subtitle: string
  type: 'user' | 'request'
  badge?: string
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const router = useRouter()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim() || query.length < 2) {
        setResults([])
        return
      }

      setLoading(true)
      try {
        // Busca rápida de demonstração / API de busca
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data.results || [])
        }
      } catch {
        // Fallback silencioso
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  function handleSelect(result: SearchResult) {
    setIsOpen(false)
    if (result.type === 'user') {
      router.push(`/usuarios/${result.id}`)
    } else {
      router.push(`/solicitacoes/${result.id}`)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#64748B] hover:border-[#CBD5E1] hover:bg-white transition-colors w-72"
      >
        <Search className="h-4 w-4 text-[#94A3B8]" />
        <span className="flex-1 text-left text-xs">Buscar usuário, CRMV, CNPJ...</span>
        <kbd className="text-[10px] bg-white border border-[#E2E8F0] rounded px-1.5 py-0.5 font-mono text-[#64748B]">
          Ctrl+K
        </kbd>
      </button>

      <DialogPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs animate-in fade-in" />
          <DialogPrimitive.Content className="fixed left-[50%] top-[20%] z-50 w-full max-w-xl translate-x-[-50%] rounded-2xl bg-white p-4 shadow-2xl border border-[#E2E8F0] animate-in zoom-in-95">
            <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
              <Search className="h-5 w-5 text-[#94A3B8]" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Digite o nome, e-mail, telefone, CRMV ou CNPJ..."
                className="border-none shadow-none focus-visible:ring-0 text-base"
                autoFocus
              />
              {loading && <Loader2 className="h-4 w-4 animate-spin text-[#0F766E]" />}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-[#94A3B8] hover:text-[#1E293B]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 max-h-80 overflow-y-auto space-y-1">
              {results.length > 0 ? (
                results.map((res) => (
                  <button
                    key={`${res.type}-${res.id}`}
                    onClick={() => handleSelect(res)}
                    className="w-full text-left p-3 rounded-xl hover:bg-[#F8FAFC] flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center">
                        {res.type === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[#1E293B]">
                          {res.title}
                        </div>
                        <div className="text-xs text-[#64748B]">{res.subtitle}</div>
                      </div>
                    </div>
                    {res.badge && (
                      <Badge variant="secondary" className="text-[10px]">
                        {res.badge}
                      </Badge>
                    )}
                  </button>
                ))
              ) : query.length >= 2 && !loading ? (
                <div className="p-6 text-center text-sm text-[#94A3B8]">
                  Nenhum registro encontrado para &ldquo;{query}&rdquo;
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-[#94A3B8]">
                  Pressione <kbd className="font-mono bg-[#F1F5F9] px-1 py-0.5 rounded">ESC</kbd> para fechar
                </div>
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  )
}
