'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PawPrint, Lock, Mail, Loader2, AlertCircle, ShieldCheck, UserCheck, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()

  function handleDemoLogin(role: 'admin' | 'support') {
    document.cookie = `chamavet_demo_role=${role}; path=/; max-age=86400`
    router.push('/')
    router.refresh()
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('E-mail ou senha incorretos.')
        }
        throw error
      }

      const user = data.user
      const role =
        user?.app_metadata?.admin_role || user?.app_metadata?.role

      if (role !== 'admin' && role !== 'support') {
        await supabase.auth.signOut()
        throw new Error('Acesso negado. Esta conta não possui perfil administrativo no ChamaVet.')
      }

      const { data: factors } = await supabase.auth.mfa.listFactors()
      const hasTotp = factors?.totp && factors.totp.length > 0

      if (hasTotp) {
        router.push('/login/mfa')
      } else {
        router.push('/login/mfa?setup=true')
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Falha na autenticação.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-8 space-y-6">
        {/* Logo and Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-[#0F766E] items-center justify-center text-white shadow-md mb-2">
            <PawPrint className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold font-heading text-[#1E293B]">
            ChamaVet Admin
          </h1>
          <p className="text-sm text-[#64748B]">
            Acesso exclusivo para a equipe de operação e suporte
          </p>
        </div>

        {/* Card de Teste Rápido de Papéis (Dev/Sandbox) */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E] flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5" /> Acesso Rápido de Testes
            </span>
            <span className="text-[10px] bg-[#CCFBF1] text-[#0F766E] px-2 py-0.5 rounded-full font-semibold">
              Dev Mode
            </span>
          </div>
          <p className="text-xs text-[#64748B]">
            Teste as permissões de cada papel sem necessidade de credenciais do banco:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => handleDemoLogin('admin')}
              className="text-xs gap-1.5"
            >
              <ShieldCheck className="h-4 w-4" /> Entrar como Admin
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleDemoLogin('support')}
              className="text-xs gap-1.5"
            >
              <UserCheck className="h-4 w-4" /> Entrar como Suporte
            </Button>
          </div>
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => router.push('/login/mfa?setup=true')}
              className="text-[11px] text-[#64748B] hover:text-[#0F766E] underline"
            >
              Visualizar fluxo de cadastro de MFA (TOTP) →
            </button>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#E2E8F0] w-full" />
          <span className="bg-white px-3 text-xs text-[#94A3B8] uppercase tracking-wider shrink-0 font-medium">
            ou via Supabase Auth
          </span>
          <div className="border-t border-[#E2E8F0] w-full" />
        </div>

        {errorMessage && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[#FEE2E2] border border-[#FECACA] text-[#DC2626] text-sm">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        )}

        {/* Form Supabase Auth */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
              E-mail corporativo
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-[#94A3B8]" />
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operador@chamavet.com.br"
                className="pl-9 h-11"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-[#94A3B8]" />
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="pl-9 h-11"
                disabled={loading}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 font-semibold text-base mt-2"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Verificando...
              </span>
            ) : (
              'Acessar com Supabase'
            )}
          </Button>
        </form>

        <div className="pt-4 border-t border-[#E2E8F0] text-center text-xs text-[#94A3B8] space-y-1">
          <p>Autenticação multifator (MFA TOTP) obrigatória.</p>
        </div>
      </div>
    </div>
  )
}
