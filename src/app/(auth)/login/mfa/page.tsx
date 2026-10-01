'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { ShieldCheck, Loader2, AlertCircle, ArrowLeft, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

function MfaContent() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Dados para primeiro acesso (enroll)
  const [isSetup, setIsSetup] = useState(false)
  const [qrCodeUri, setQrCodeUri] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const forceSetup = searchParams.get('setup') === 'true'

  useEffect(() => {
    async function initMfa() {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push('/login')
          return
        }

        const { data: factors } = await supabase.auth.mfa.listFactors()
        const existingTotp = factors?.totp?.find((f) => f.status === 'verified')

        if (!existingTotp || forceSetup) {
          // Iniciar cadastro de novo fator TOTP
          setIsSetup(true)
          const { data: enrollData, error: enrollError } =
            await supabase.auth.mfa.enroll({
              factorType: 'totp',
              issuer: 'ChamaVet Admin',
              friendlyName: user.email || 'Admin',
            })

          if (enrollError) throw enrollError
          setFactorId(enrollData.id)
          setQrCodeUri(enrollData.totp.qr_code)
          setSecret(enrollData.totp.secret)
        } else {
          setIsSetup(false)
          setFactorId(existingTotp.id)
        }
      } catch (err: unknown) {
        setErrorMessage(
          err instanceof Error ? err.message : 'Falha ao inicializar verificação de dois fatores.'
        )
      } finally {
        setInitializing(false)
      }
    }

    initMfa()
  }, [forceSetup, router])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!factorId || code.trim().length !== 6) return

    setErrorMessage(null)
    setLoading(true)

    try {
      const supabase = createClient()

      if (isSetup) {
        // Valida e ativa o novo fator
        const { error } = await supabase.auth.mfa.challengeAndVerify({
          factorId,
          code: code.trim(),
        })
        if (error) throw error
      } else {
        // Cria desafio e valida fator já existente
        const { data: challengeData, error: challengeError } =
          await supabase.auth.mfa.challenge({ factorId })
        if (challengeError) throw challengeError

        const { error: verifyError } = await supabase.auth.mfa.verify({
          factorId,
          challengeId: challengeData.id,
          code: code.trim(),
        })
        if (verifyError) throw verifyError
      }

      // Sucesso: sessão agora é AAL2! Redireciona para o painel
      router.push('/')
      router.refresh()
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Código de 6 dígitos inválido ou expirado.'
      )
    } finally {
      setLoading(false)
    }
  }

  function copySecret() {
    if (secret) {
      navigator.clipboard.writeText(secret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (initializing) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0F766E]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-[#CCFBF1] text-[#0F766E] items-center justify-center shadow-xs mb-2">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold font-heading text-[#1E293B]">
            {isSetup ? 'Cadastrar Autenticador' : 'Autenticação em Duas Etapas'}
          </h1>
          <p className="text-sm text-[#64748B]">
            {isSetup
              ? 'Escaneie o QR Code com seu aplicativo autenticador (Google Authenticator, Authy, etc.)'
              : 'Digite o código de 6 dígitos gerado pelo seu aplicativo autenticador'}
          </p>
        </div>

        {errorMessage && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[#FEE2E2] border border-[#FECACA] text-[#DC2626] text-sm">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        )}

        {isSetup && qrCodeUri && (
          <div className="space-y-4">
            <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] flex flex-col items-center justify-center">
              <Image
                src={qrCodeUri}
                alt="QR Code MFA"
                width={192}
                height={192}
                className="w-48 h-48 rounded-lg shadow-xs"
                unoptimized
              />
              <p className="text-xs text-[#64748B] mt-2">
                Não consegue escanear? Use a chave manual:
              </p>
              <div className="mt-1 flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-[#E2E8F0]">
                <code className="text-xs font-mono font-bold text-[#1E293B]">
                  {secret}
                </code>
                <button
                  type="button"
                  onClick={copySecret}
                  className="text-[#64748B] hover:text-[#0F766E]"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-[#16A34A]" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
              Código de Verificação (6 dígitos)
            </label>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoFocus
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="text-center font-mono text-2xl tracking-widest h-12"
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 font-semibold text-base"
            disabled={loading || code.trim().length !== 6}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Verificando...
              </span>
            ) : isSetup ? (
              'Confirmar e Ativar MFA'
            ) : (
              'Confirmar Código'
            )}
          </Button>
        </form>

        <div className="pt-4 border-t border-[#E2E8F0] flex justify-center">
          <button
            onClick={() => router.push('/login')}
            className="inline-flex items-center gap-2 text-xs font-medium text-[#64748B] hover:text-[#1E293B]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar para o login
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MfaPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#0F766E]" />
        </div>
      }
    >
      <MfaContent />
    </React.Suspense>
  )
}
