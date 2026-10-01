'use client'

import React, { useState } from 'react'
import {
  Settings,
  DollarSign,
  Stethoscope,
  Save,
  CheckCircle,
  Plus,
  Power,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ConfirmModal } from '@/components/shared/confirm-modal'
import { formatCurrency } from '@/lib/format'

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<'geral' | 'precos' | 'especialidades'>('geral')
  const [notification, setNotification] = useState<string | null>(null)

  // app_config
  const [billingEnabled, setBillingEnabled] = useState(true)
  const [requireVerification, setRequireVerification] = useState(false)
  const [trialDays, setTrialDays] = useState(30)
  const [graceDays, setGraceDays] = useState(3)
  const [pixExpirationMinutes, setPixExpirationMinutes] = useState(30)
  const [blockedWords, setBlockedWords] = useState('golpe, caloteiro, pessimo, fraude, ladrao, incompetente')

  // pricing (em centavos)
  const [publicationPriceCents, setPublicationPriceCents] = useState(690) // R$ 6,90
  const [subscriptionPriceCents, setSubscriptionPriceCents] = useState(990) // R$ 9,90

  // Especialidades
  const [specialties, setSpecialties] = useState([
    { id: 'esp-1', name: 'Cirurgia Geral', active: true, count: 42 },
    { id: 'esp-2', name: 'Ultrassonografia', active: true, count: 35 },
    { id: 'esp-3', name: 'Dermatologia', active: true, count: 28 },
    { id: 'esp-4', name: 'Cardiologia', active: true, count: 22 },
    { id: 'esp-5', name: 'Anestesiologia', active: true, count: 19 },
    { id: 'esp-6', name: 'Ortopedia', active: true, count: 14 },
    { id: 'esp-7', name: 'Oftalmologia', active: false, count: 5 },
  ])
  const [newSpecName, setNewSpecName] = useState('')

  // Modais de confirmação forte
  const [billingModalOpen, setBillingModalOpen] = useState(false)
  const [priceModalOpen, setPriceModalOpen] = useState(false)

  function showSuccess(msg: string) {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  async function handleToggleBilling(reason: string) {
    setBillingEnabled(!billingEnabled)
    showSuccess(
      `Cobrança ${!billingEnabled ? 'ATIVADA' : 'DESATIVADA (Modo Piloto Grátis)'}. Motivo registrado na auditoria: ${reason}`
    )
  }

  async function handleSavePrice(reason: string) {
    showSuccess(`Preços da plataforma atualizados. Motivo registrado: ${reason}`)
  }

  function handleToggleSpecialty(id: string) {
    setSpecialties((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    )
    showSuccess('Status da especialidade alterado.')
  }

  function handleAddSpecialty() {
    if (!newSpecName.trim()) return
    setSpecialties((prev) => [
      ...prev,
      { id: `esp-${Date.now()}`, name: newSpecName.trim(), active: true, count: 0 },
    ])
    setNewSpecName('')
    showSuccess('Especialidade cadastrada com sucesso.')
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Topo */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-[#1E293B]">
          Configurações da Plataforma
        </h1>
        <p className="text-sm text-[#64748B]">
          Altere flags, regras de negócio e preços sem necessidade de novo deploy
        </p>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] text-sm flex items-center gap-2 font-medium">
          <CheckCircle className="h-5 w-5" />
          <span>{notification}</span>
        </div>
      )}

      {/* Abas */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 text-xs font-semibold">
        {[
          { key: 'geral', label: '1. Parâmetros Gerais (app_config)', icon: Settings },
          { key: 'precos', label: '2. Tabela de Preços (pricing)', icon: DollarSign },
          { key: 'especialidades', label: '3. Especialidades & Habilidades', icon: Stethoscope },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'geral' | 'precos' | 'especialidades')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-[#0F766E] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Aba 1: Geral */}
      {activeTab === 'geral' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#1E293B]">
                Flags Críticas do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* billing_enabled */}
              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#1E293B]">
                      Cobrança Habilitada (billing_enabled)
                    </span>
                    <Badge variant={billingEnabled ? 'success' : 'muted'}>
                      {billingEnabled ? 'LIGADO' : 'DESLIGADO (PILOTO)'}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Quando desativado, publicações de clínicas e assinaturas de profissionais tornam-se gratuitas.
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

              {/* require_verification */}
              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#1E293B]">
                      Exigir Verificação Obrigatória (require_verification)
                    </span>
                    <Badge variant={requireVerification ? 'success' : 'muted'}>
                      {requireVerification ? 'EXIGIDA' : 'FLEXÍVEL (PILOTO)'}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Com essa flag ativa, profissionais sem CRMV verificado não podem se candidatar e clínicas não publicam.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRequireVerification(!requireVerification)
                    showSuccess(`Exigência de verificação ${!requireVerification ? 'ATIVADA' : 'DESATIVADA'}.`)
                  }}
                  className="text-xs cursor-pointer"
                >
                  Alternar
                </Button>
              </div>

              {/* Numéricos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="text-xs font-bold text-[#64748B] uppercase block mb-1">
                    Dias de Teste Grátis (trial_days):
                  </label>
                  <Input
                    type="number"
                    value={trialDays}
                    onChange={(e) => setTrialDays(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#64748B] uppercase block mb-1">
                    Dias de Carência (grace_days):
                  </label>
                  <Input
                    type="number"
                    value={graceDays}
                    onChange={(e) => setGraceDays(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#64748B] uppercase block mb-1">
                    Expiração Pix em Minutos:
                  </label>
                  <Input
                    type="number"
                    value={pixExpirationMinutes}
                    onChange={(e) => setPixExpirationMinutes(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* blocked_words */}
              <div className="pt-2">
                <label className="text-xs font-bold text-[#64748B] uppercase block mb-1">
                  Termos Ofensivos Bloqueados (separados por vírgula):
                </label>
                <textarea
                  rows={2}
                  value={blockedWords}
                  onChange={(e) => setBlockedWords(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E2E8F0] text-sm focus:border-[#0F766E] focus:outline-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="default"
                  onClick={() => showSuccess('Parâmetros salvos com sucesso em app_config.')}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" /> Salvar Parâmetros
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Aba 2: Preços */}
      {activeTab === 'precos' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold text-[#1E293B]">
              Tabela de Preços da Plataforma (pricing)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-3">
                <span className="text-xs font-bold uppercase text-[#0F766E] tracking-wider block">
                  Clínica Veterinária
                </span>
                <h4 className="font-bold text-base text-[#1E293B]">Publicação de Solicitação</h4>
                <p className="text-xs text-[#64748B]">Cobrado por cada anúncio pontual ou diária publicado.</p>
                <div>
                  <label className="text-xs text-[#94A3B8] block mb-1">Valor Atual:</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#1E293B]">R$</span>
                    <Input
                      type="number"
                      step="0.10"
                      value={(publicationPriceCents / 100).toFixed(2)}
                      onChange={(e) => setPublicationPriceCents(Math.round(Number(e.target.value) * 100))}
                      className="font-bold text-base h-10 w-32"
                    />
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-3">
                <span className="text-xs font-bold uppercase text-[#0F766E] tracking-wider block">
                  Profissional (Vet e Auxiliar)
                </span>
                <h4 className="font-bold text-base text-[#1E293B]">Assinatura Mensal Recorrente</h4>
                <p className="text-xs text-[#64748B]">Cobrança mensal após o período de teste de 30 dias.</p>
                <div>
                  <label className="text-xs text-[#94A3B8] block mb-1">Valor Atual:</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#1E293B]">R$</span>
                    <Input
                      type="number"
                      step="0.10"
                      value={(subscriptionPriceCents / 100).toFixed(2)}
                      onChange={(e) => setSubscriptionPriceCents(Math.round(Number(e.target.value) * 100))}
                      className="font-bold text-base h-10 w-32"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] text-xs text-[#1E40AF]">
              Nota: Novos preços passam a valer apenas para novas transações e renovações futuras. Nenhuma alteração retroativa é aplicada.
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="default"
                onClick={() => setPriceModalOpen(true)}
                className="gap-2"
              >
                <Save className="h-4 w-4" /> Salvar Novos Preços
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aba 3: Especialidades */}
      {activeTab === 'especialidades' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold text-[#1E293B]">
              Especialidades Médicas e Habilidades
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                value={newSpecName}
                onChange={(e) => setNewSpecName(e.target.value)}
                placeholder="Nome da nova especialidade (ex: Fisioterapia e Reabilitação)..."
                className="h-10"
              />
              <Button variant="default" onClick={handleAddSpecialty} className="shrink-0 gap-1.5">
                <Plus className="h-4 w-4" /> Cadastrar Especialidade
              </Button>
            </div>

            <div className="divide-y divide-[#E2E8F0] border rounded-xl overflow-hidden bg-white">
              {specialties.map((spec) => (
                <div key={spec.id} className="p-3.5 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-[#1E293B]">{spec.name}</span>
                    <Badge variant={spec.active ? 'success' : 'muted'} className="text-[10px]">
                      {spec.active ? 'Ativa' : 'Desativada'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-[#64748B]">{spec.count} profissionais cadastrados</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleSpecialty(spec.id)}
                      className="text-xs"
                    >
                      {spec.active ? 'Desativar' : 'Reativar'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#94A3B8]">
              Regra: Especialidades em uso nunca são apagadas, apenas desativadas para impedir novos vínculos.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal: Mudança de Status de Cobrança */}
      <ConfirmModal
        isOpen={billingModalOpen}
        onClose={() => setBillingModalOpen(false)}
        onConfirm={handleToggleBilling}
        title={billingEnabled ? 'Desativar Cobrança da Plataforma' : 'Ativar Cobrança da Plataforma'}
        description={
          billingEnabled
            ? 'Atenção: Ao desativar a cobrança, todas as publicações de clínicas e assinaturas de profissionais serão liberadas gratuitamente.'
            : 'A cobrança do Asaas será exigida para todas as novas publicações e renovações.'
        }
        requiredWord="CONFIRMAR"
        destructive={billingEnabled}
        confirmButtonText="Confirmar Alteração"
      />

      {/* Modal: Atualização de Preços */}
      <ConfirmModal
        isOpen={priceModalOpen}
        onClose={() => setPriceModalOpen(false)}
        onConfirm={handleSavePrice}
        title="Atualizar Preços da Plataforma"
        description={`Publicação: ${formatCurrency(publicationPriceCents)} | Assinatura: ${formatCurrency(
          subscriptionPriceCents
        )}. A alteração será registrada na auditoria.`}
        requiredWord="CONFIRMAR"
        destructive={false}
        confirmButtonText="Salvar Preços"
      />
    </div>
  )
}
