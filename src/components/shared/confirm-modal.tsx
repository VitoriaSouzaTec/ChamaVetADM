'use client'

import React, { useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => Promise<void>
  title: string
  description: string
  requiredWord?: string // Ex: "CONFIRMAR" ou o e-mail do usuário
  destructive?: boolean
  confirmButtonText?: string
  children?: React.ReactNode // campos extras (ex: duração da suspensão)
  requireReason?: boolean // false quando a ação não registra motivo
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  requiredWord = 'CONFIRMAR',
  destructive = true,
  confirmButtonText = 'Confirmar Ação',
  children,
  requireReason = true,
}: ConfirmModalProps) {
  const [reason, setReason] = useState('')
  const [typedWord, setTypedWord] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isReasonValid = !requireReason || reason.trim().length >= 5
  const isWordValid = !requiredWord || typedWord.trim() === requiredWord
  const canSubmit = isReasonValid && isWordValid && !isSubmitting

  async function handleConfirm() {
    if (!canSubmit) return
    setIsSubmitting(true)
    setError(null)
    try {
      await onConfirm(reason.trim())
      setReason('')
      setTypedWord('')
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao processar ação.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open && !isSubmitting) {
      setReason('')
      setTypedWord('')
      setError(null)
      onClose()
    }
  }

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs animate-in fade-in" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-white p-6 shadow-xl border border-[#E2E8F0] animate-in zoom-in-95">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  destructive ? 'bg-[#FEE2E2] text-[#DC2626]' : 'bg-[#FFEDD5] text-[#F97316]'
                }`}
              >
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <DialogPrimitive.Title className="text-lg font-bold font-heading text-[#1E293B]">
                  {title}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-sm text-[#64748B]">
                  {description}
                </DialogPrimitive.Description>
              </div>
            </div>
            <DialogPrimitive.Close
              disabled={isSubmitting}
              className="rounded-lg p-1 text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#1E293B]"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Fechar</span>
            </DialogPrimitive.Close>
          </div>

          <div className="mt-6 space-y-4">
            {children}
            {requireReason && (
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1">
                Motivo da ação <span className="text-[#DC2626]">*</span> (mínimo 5 caracteres)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explique o motivo desta ação administrativa..."
                rows={3}
                disabled={isSubmitting}
                className="w-full rounded-lg border border-[#E2E8F0] p-3 text-sm focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
              {reason.length > 0 && reason.trim().length < 5 && (
                <p className="mt-1 text-xs text-[#DC2626]">
                  O motivo deve ter pelo menos 5 caracteres.
                </p>
              )}
            </div>
            )}

            {requiredWord && (
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1">
                  Digite <span className="font-mono font-bold text-[#DC2626]">{requiredWord}</span> para confirmar:
                </label>
                <Input
                  value={typedWord}
                  onChange={(e) => setTypedWord(e.target.value)}
                  placeholder={`Digite "${requiredWord}"`}
                  disabled={isSubmitting}
                />
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-[#FEE2E2] p-3 text-sm text-[#DC2626]">
                {error}
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant={destructive ? 'destructive' : 'default'}
              disabled={!canSubmit}
              onClick={handleConfirm}
            >
              {isSubmitting ? 'Processando...' : confirmButtonText}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
