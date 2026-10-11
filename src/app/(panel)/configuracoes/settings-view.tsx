'use client'

import React, { useState } from 'react'
import { Settings, DollarSign, Stethoscope, Save, Plus, Power } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ConfirmModal } from '@/components/shared/confirm-modal'
import { Notice, useNotice } from '@/components/shared/notice'
import { unwrap } from '@/lib/action-client'
import { updateConfig, updateConfigs, updatePrices, upsertSpecialty, setSpecialtyActive } from '@/server/actions/settings'
import { formatCurrency, formatDateTime } from '@/lib/format'
import type { Json } from '@/types/database'

type ConfigRow = { key: string; value: Json; description: string | null; updated_at: string }
type PricingRow = { id: string; key: string; amount_cents: number; title: string; updated_at: string }
type SpecialtyRow = { id: string; name: string; icon: string | null; active: boolean; professionals: number; requests: number }
type PriceHistoryRow = { id: string; created_at: string; before: Json | null; after: Json | null; reason: string | null; entity_id: string | null }

const NUMERIC_KEYS = [
  { key: 'trial_days', label: 'Dias de Teste Grátis (trial_days)' },
  { key: 'grace_days', label: 'Dias de Carência (grace_days)' },
  { key: 'pix_expiration_minutes', label: 'Expiração Pix em Minutos' },
] as const

function asBool(value: Json | undefined): boolean {
  return value === true || value === 'true'
}

function asWords(value: Json | undefined): string {
  if (Array.isArray(value)) return value.map(String).join(', ')
  return typeof value === 'string' ? value : ''
}

export function SettingsView({
  config,
  pricing,
  specialties,
  priceHistory,
}: {
  config: ConfigRow[]
  pricing: PricingRow[]
  specialties: SpecialtyRow[]
  priceHistory: PriceHistoryRow[]
}) {
  const [activeTab, setActiveTab] = useState<'geral' | 'precos' | 'especialidades'>('geral')
  const { notice, success, error } = useNotice()

  const configMap = new Map(config.map((c) => [c.key, c]))
  const billingEnabled = asBool(configMap.get('billing_enabled')?.value)
  const requireVerification = asBool(configMap.get('require_verification')?.value)

  const [numbers, setNumbers] = useState<Record<string, string>>(() =>
    Object.fromEntries(NUMERIC_KEYS.map(({ key }) => [key, String(configMap.get(key)?.value ?? '')]))
  )
  const [blockedWords, setBlockedWords] = useState(asWords(configMap.get('blocked_words')?.value))
  const [prices, setPrices] = useState<Record<string, string>>(() =>
    Object.fromEntries(pricing.map((p) => [p.key, (p.amount_cents / 100).toFixed(2)]))
  )
  const [newSpecName, setNewSpecName] = useState('')
  const [busySpec, setBusySpec] = useState<string | null>(null)

  const [billingModalOpen, setBillingModalOpen] = useState(false)
  const [verificationModalOpen, setVerificationModalOpen] = useState(false)
  const [paramsModalOpen, setParamsModalOpen] = useState(false)
  const [priceModalOpen, setPriceModalOpen] = useState(false)

  const changedPrices = pricing
    .map((p) => ({ key: p.key, title: p.title, before: p.amount_cents, amountCents: Math.round(Number(prices[p.key]) * 100) }))
    .filter((p) => Number.isFinite(p.amountCents) && p.amountCents !== p.before)

  async function handleToggleBilling(reason: string) {
    unwrap(await updateConfig('billing_enabled', !billingEnabled, reason))
    success(`Cobrança ${!billingEnabled ? 'ATIVADA' : 'DESATIVADA (modo piloto grátis)'}.`)
  }

  async function handleToggleVerification(reason: string) {
    unwrap(await updateConfig('require_verification', !requireVerification, reason))
    success(`Exigência de verificação ${!requireVerification ? 'ATIVADA' : 'DESATIVADA'}.`)
  }

  async function handleSaveParams(reason: string) {
    const entries: Array<{ key: string; value: Json }> = []
    for (const { key } of NUMERIC_KEYS) {
      const current = configMap.get(key)
      if (!current) continue
      const n = Number(numbers[key])
      if (!Number.isFinite(n) || n < 0) throw new Error(`Valor inválido para ${key}.`)
      if (n !== Number(current.value)) entries.push({ key, value: n })
    }
    const wordsRow = configMap.get('blocked_words')
    if (wordsRow && blockedWords !== asWords(wordsRow.value)) {
      const list = blockedWords.split(',').map((w) => w.trim()).filter(Boolean)
      entries.push({ key: 'blocked_words', value: Array.isArray(wordsRow.value) ? list : list.join(', ') })
    }
    if (entries.length === 0) throw new Error('Nenhum parâmetro foi alterado.')
    unwrap(await updateConfigs(entries, reason))
    success(`${entries.length} parâmetro(s) salvo(s) em app_config.`)
  }

  async function handleSavePrices(reason: string) {
    for (const p of changedPrices) {
      if (p.amountCents <= 0 || p.amountCents > 100000) throw new Error(`${p.title}: o valor deve ser maior que zero e até R$ 1.000,00.`)
    }
    unwrap(await updatePrices(changedPrices, reason))
    success('Preços atualizados. Valem apenas para novas cobranças.')
  }

  async function handleToggleSpecialty(id: string, active: boolean) {
    setBusySpec(id)
    const result = await setSpecialtyActive(id, !active)
    setBusySpec(null)
    if (!result.ok) return error(result.error)
    success(`Especialidade ${!active ? 'reativada' : 'desativada'}.`)
  }

  async function handleAddSpecialty() {
    if (!newSpecName.trim()) return
    setBusySpec('new')
    const result = await upsertSpecialty({ name: newSpecName.trim(), active: true })
    setBusySpec(null)
    if (!result.ok) return error(result.error)
    setNewSpecName('')
    success('Especialidade cadastrada.')
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold font-heading text-[#1E293B]">Configurações da Plataforma</h1>
        <p className="text-sm text-[#64748B]">Altere flags, regras de negócio e preços sem necessidade de novo deploy</p>
      </div>

      <Notice notice={notice} />

      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 text-xs font-semibold overflow-x-auto">
        {(
          [
            { key: 'geral', label: '1. Parâmetros Gerais (app_config)', icon: Settings },
            { key: 'precos', label: '2. Tabela de Preços (pricing)', icon: DollarSign },
            { key: 'especialidades', label: '3. Especialidades', icon: Stethoscope },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-colors shrink-0 ${
                activeTab === tab.key ? 'bg-[#0F766E] text-white shadow-xs' : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {activeTab === 'geral' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold text-[#1E293B]">Flags Críticas do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {configMap.has('billing_enabled') ? (
              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#1E293B]">Cobrança Habilitada (billing_enabled)</span>
                    <Badge variant={billingEnabled ? 'success' : 'muted'}>{billingEnabled ? 'LIGADO' : 'DESLIGADO (PILOTO)'}</Badge>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {configMap.get('billing_enabled')?.description ||
                      'Quando desativado, publicações de clínicas e assinaturas de profissionais tornam-se gratuitas.'}
                  </p>
                </div>
                <Button
                  variant={billingEnabled ? 'destructive' : 'default'}
                  size="sm"
                  onClick={() => setBillingModalOpen(true)}
                  className="gap-1.5 text-xs cursor-pointer"
                >
                  <Power className="h-3.5 w-3.5" />
                  {billingEnabled ? 'Desligar Cobrança' : 'Ativar Cobrança'}
                </Button>
              </div>
            ) : (
              <MissingKey name="billing_enabled" />
            )}

            {configMap.has('require_verification') ? (
              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#1E293B]">Exigir Verificação (require_verification)</span>
                    <Badge variant={requireVerification ? 'success' : 'muted'}>
                      {requireVerification ? 'EXIGIDA' : 'FLEXÍVEL (PILOTO)'}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {configMap.get('require_verification')?.description ||
                      'Com a flag ativa, profissionais sem CRMV verificado não se candidatam e clínicas não publicam.'}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setVerificationModalOpen(true)} className="text-xs cursor-pointer">
                  {requireVerification ? 'Desativar' : 'Ativar'}
                </Button>
              </div>
            ) : (
              <MissingKey name="require_verification" />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {NUMERIC_KEYS.map(({ key, label }) => (
                <div key={key}>
                  <label className="text-xs font-bold text-[#64748B] uppercase block mb-1">{label}:</label>
                  {configMap.has(key) ? (
                    <Input
                      type="number"
                      min={0}
                      value={numbers[key]}
                      onChange={(e) => setNumbers((prev) => ({ ...prev, [key]: e.target.value }))}
                    />
                  ) : (
                    <p className="text-xs text-[#94A3B8]">Chave não existe em app_config.</p>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2">
              <label className="text-xs font-bold text-[#64748B] uppercase block mb-1">
                Termos Ofensivos para Destaque de Avaliações (separados por vírgula):
              </label>
              {configMap.has('blocked_words') ? (
                <textarea
                  rows={2}
                  value={blockedWords}
                  onChange={(e) => setBlockedWords(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E2E8F0] text-sm focus:border-[#0F766E] focus:outline-none"
                />
              ) : (
                <p className="text-xs text-[#94A3B8]">Chave blocked_words não existe em app_config.</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="default" onClick={() => setParamsModalOpen(true)} className="gap-2">
                <Save className="h-4 w-4" /> Salvar Parâmetros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'precos' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold text-[#1E293B]">Tabela de Preços da Plataforma (pricing)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {pricing.length === 0 && <p className="text-sm text-[#94A3B8]">Nenhum preço cadastrado na tabela pricing.</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {pricing.map((p) => (
                <div key={p.id} className="p-5 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-3">
                  <span className="text-xs font-bold uppercase text-[#0F766E] tracking-wider block font-mono">{p.key}</span>
                  <h4 className="font-bold text-base text-[#1E293B]">{p.title}</h4>
                  <p className="text-xs text-[#64748B]">
                    Atual: {formatCurrency(p.amount_cents)} · atualizado em {formatDateTime(p.updated_at)}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#1E293B]">R$</span>
                    <Input
                      type="number"
                      step="0.10"
                      min="0.01"
                      value={prices[p.key]}
                      onChange={(e) => setPrices((prev) => ({ ...prev, [p.key]: e.target.value }))}
                      className="font-bold text-base h-10 w-32"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] text-xs text-[#1E40AF]">
              Novos preços valem apenas para novas cobranças e renovações futuras.
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="default" onClick={() => setPriceModalOpen(true)} disabled={changedPrices.length === 0} className="gap-2">
                <Save className="h-4 w-4" /> Salvar Novos Preços
              </Button>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
              <h4 className="text-xs font-bold uppercase text-[#64748B]">Histórico de mudanças (auditoria)</h4>
              {priceHistory.length === 0 && <p className="text-xs text-[#94A3B8]">Nenhuma alteração registrada.</p>}
              {priceHistory.map((h) => (
                <div key={h.id} className="p-3 rounded-lg border border-[#E2E8F0] text-xs flex flex-wrap justify-between gap-2">
                  <span className="font-mono text-[#1E293B]">
                    {JSON.stringify(h.before)} → {JSON.stringify(h.after)}
                  </span>
                  <span className="text-[#64748B]">{h.reason}</span>
                  <span className="text-[#94A3B8]">{formatDateTime(h.created_at)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'especialidades' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold text-[#1E293B]">Especialidades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                value={newSpecName}
                onChange={(e) => setNewSpecName(e.target.value)}
                placeholder="Nome da nova especialidade (ex: Fisioterapia e Reabilitação)..."
                className="h-10"
              />
              <Button
                variant="default"
                onClick={handleAddSpecialty}
                disabled={!newSpecName.trim() || busySpec === 'new'}
                className="shrink-0 gap-1.5"
              >
                <Plus className="h-4 w-4" /> Cadastrar
              </Button>
            </div>

            <div className="divide-y divide-[#E2E8F0] border rounded-xl overflow-hidden bg-white">
              {specialties.length === 0 && <p className="p-4 text-sm text-[#94A3B8]">Nenhuma especialidade cadastrada.</p>}
              {specialties.map((spec) => (
                <div key={spec.id} className="p-3.5 flex flex-wrap items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-[#1E293B]">{spec.name}</span>
                    {spec.icon && <span className="text-[11px] font-mono text-[#94A3B8]">{spec.icon}</span>}
                    <Badge variant={spec.active ? 'success' : 'muted'} className="text-[10px]">
                      {spec.active ? 'Ativa' : 'Desativada'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-[#64748B]">
                      {spec.professionals} profissionais · {spec.requests} solicitações
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busySpec === spec.id}
                      onClick={() => handleToggleSpecialty(spec.id, spec.active)}
                      className="text-xs"
                    >
                      {spec.active ? 'Desativar' : 'Reativar'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#94A3B8]">
              Regra: especialidades em uso nunca são apagadas, apenas desativadas para impedir novos vínculos.
            </p>
          </CardContent>
        </Card>
      )}

      <ConfirmModal
        isOpen={billingModalOpen}
        onClose={() => setBillingModalOpen(false)}
        onConfirm={handleToggleBilling}
        title={billingEnabled ? 'Desativar Cobrança da Plataforma' : 'Ativar Cobrança da Plataforma'}
        description={
          billingEnabled
            ? 'Atenção: ao desativar a cobrança, todas as publicações de clínicas e assinaturas de profissionais ficam gratuitas.'
            : 'A cobrança via gateway passa a ser exigida para novas publicações e renovações.'
        }
        requiredWord="CONFIRMAR"
        destructive={billingEnabled}
        confirmButtonText="Confirmar Alteração"
      />

      <ConfirmModal
        isOpen={verificationModalOpen}
        onClose={() => setVerificationModalOpen(false)}
        onConfirm={handleToggleVerification}
        title={requireVerification ? 'Desativar Exigência de Verificação' : 'Exigir Verificação'}
        description={
          requireVerification
            ? 'Usuários não verificados voltarão a poder agir no app.'
            : 'Profissionais e clínicas não verificados ficarão bloqueados de enviar interesse e publicar.'
        }
        requiredWord="CONFIRMAR"
        destructive={!requireVerification}
        confirmButtonText="Confirmar Alteração"
      />

      <ConfirmModal
        isOpen={paramsModalOpen}
        onClose={() => setParamsModalOpen(false)}
        onConfirm={handleSaveParams}
        title="Salvar Parâmetros"
        description="As alterações em app_config entram em vigor imediatamente e ficam registradas na auditoria."
        requiredWord=""
        destructive={false}
        confirmButtonText="Salvar"
      />

      <ConfirmModal
        isOpen={priceModalOpen}
        onClose={() => setPriceModalOpen(false)}
        onConfirm={handleSavePrices}
        title="Atualizar Preços da Plataforma"
        description={changedPrices
          .map((p) => `${p.title}: ${formatCurrency(p.before)} → ${formatCurrency(p.amountCents)}`)
          .join(' | ')}
        requiredWord="CONFIRMAR"
        destructive={false}
        confirmButtonText="Salvar Preços"
      />
    </div>
  )
}

function MissingKey({ name }: { name: string }) {
  return (
    <div className="p-4 rounded-xl border border-dashed border-[#E2E8F0] text-xs text-[#94A3B8]">
      A chave <span className="font-mono">{name}</span> não existe em app_config.
    </div>
  )
}
