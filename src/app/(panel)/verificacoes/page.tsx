'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Search,
  FileText,
  Building2,
  UserCheck,
  XCircle,
  HelpCircle,
  Check,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ConfirmModal } from '@/components/shared/confirm-modal'
import { MOCK_VERIFICATIONS, type VerificationItem } from '@/server/mock-data'
import { formatDate } from '@/lib/format'

export default function VerificacoesPage() {
  const [activeTab, setActiveTab] = useState<'VET' | 'CLINIC'>('VET')
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'NEEDS_INFO' | 'REJECTED' | 'VERIFIED'>('PENDING')
  const [items, setItems] = useState<VerificationItem[]>(MOCK_VERIFICATIONS)
  const [selectedItem, setSelectedItem] = useState<VerificationItem | null>(null)
  const [search, setSearch] = useState('')

  // Estados de ações
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [needsInfoModalOpen, setNeedsInfoModalOpen] = useState(false)
  const [infoMessage, setInfoMessage] = useState('')
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // Checklist do profissional
  const [checklist, setChecklist] = useState({
    nameMatches: false,
    crmvActive: false,
    ufMatches: false,
  })

  // Filtragem
  const filteredItems = items.filter((item) => {
    const matchesTab = item.type === activeTab
    const matchesStatus = item.status === statusFilter
    const matchesSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.identifier.toLowerCase().includes(search.toLowerCase()) ||
      item.city.toLowerCase().includes(search.toLowerCase())
    return matchesTab && matchesStatus && matchesSearch
  })

  const currentItem = selectedItem || filteredItems[0] || null

  const handleApprove = useCallback(async () => {
    if (!currentItem) return
    setItems((prev) =>
      prev.map((i) => (i.id === currentItem.id ? { ...i, status: 'VERIFIED' } : i))
    )
    setActionSuccess(`Cadastro de ${currentItem.name} verificado com sucesso!`)
    setTimeout(() => setActionSuccess(null), 3500)
  }, [currentItem])

  const handleNext = useCallback(() => {
    if (!currentItem) return
    const currentIndex = filteredItems.findIndex((i) => i.id === currentItem.id)
    if (currentIndex >= 0 && currentIndex < filteredItems.length - 1) {
      setSelectedItem(filteredItems[currentIndex + 1])
    }
  }, [currentItem, filteredItems])

  // Atalhos de teclado: A (Aprova), R (Recusa), Seta Direita (Próximo)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault()
        handleApprove()
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        setRejectModalOpen(true)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleApprove, handleNext])

  async function handleReject(reason: string) {
    if (!currentItem) return
    setItems((prev) =>
      prev.map((i) => (i.id === currentItem.id ? { ...i, status: 'REJECTED' } : i))
    )
    setActionSuccess(`Verificação de ${currentItem.name} recusada. Motivo: ${reason}`)
    setTimeout(() => setActionSuccess(null), 3500)
  }

  function handleSendNeedsInfo() {
    if (!currentItem || !infoMessage.trim()) return
    setItems((prev) =>
      prev.map((i) => (i.id === currentItem.id ? { ...i, status: 'NEEDS_INFO' } : i))
    )
    setNeedsInfoModalOpen(false)
    setInfoMessage('')
    setActionSuccess(`Solicitação de informações enviada para ${currentItem.name}.`)
    setTimeout(() => setActionSuccess(null), 3500)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#1E293B]">
            Fila de Verificação de Cadastros
          </h1>
          <p className="text-sm text-[#64748B]">
            Audite e valide o CRMV dos profissionais e o CNPJ das clínicas veterinárias
          </p>
        </div>

        {/* Atalhos rápidos info */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-[#64748B] bg-white px-3 py-1.5 rounded-lg border border-[#E2E8F0]">
          <span>Atalhos:</span>
          <kbd className="bg-[#F1F5F9] px-1.5 py-0.5 rounded font-mono font-bold">A</kbd> Aprovar
          <kbd className="bg-[#F1F5F9] px-1.5 py-0.5 rounded font-mono font-bold">R</kbd> Recusar
          <kbd className="bg-[#F1F5F9] px-1.5 py-0.5 rounded font-mono font-bold">→</kbd> Próximo
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] text-sm flex items-center gap-2 font-medium">
          <Check className="h-5 w-5" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Tabs Principais: CRMV vs CNPJ */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('VET')
              setSelectedItem(null)
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'VET'
                ? 'bg-[#0F766E] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white'
            }`}
          >
            <UserCheck className="h-4 w-4" />
            Profissionais (CRMV)
          </button>
          <button
            onClick={() => {
              setActiveTab('CLINIC')
              setSelectedItem(null)
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'CLINIC'
                ? 'bg-[#0F766E] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white'
            }`}
          >
            <Building2 className="h-4 w-4" />
            Clínicas (CNPJ)
          </button>
        </div>

        {/* Filtro de Status */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E2E8F0] text-xs">
          {(['PENDING', 'NEEDS_INFO', 'REJECTED', 'VERIFIED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st)
                setSelectedItem(null)
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                statusFilter === st
                  ? 'bg-[#0F766E] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              {st === 'PENDING' && 'Pendente'}
              {st === 'NEEDS_INFO' && 'Aguardando Info'}
              {st === 'REJECTED' && 'Recusado'}
              {st === 'VERIFIED' && 'Verificado'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Principal: Fila à Esquerda, Detalhe e Ação à Direita */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Fila (5 colunas) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#94A3B8]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou documento..."
              className="pl-9 h-10"
            />
          </div>

          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                const isSelected = currentItem?.id === item.id
                const isOverdue = item.hoursInQueue > 48

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#0F766E] bg-white shadow-md ring-2 ring-[#0F766E]/20'
                        : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-[#1E293B]">{item.name}</h4>
                        <p className="text-xs text-[#64748B] font-mono mt-0.5">
                          {item.identifier} · {item.city}/{item.state}
                        </p>
                      </div>
                      <Badge
                        variant={
                          item.status === 'VERIFIED'
                            ? 'success'
                            : item.status === 'REJECTED'
                            ? 'danger'
                            : item.status === 'NEEDS_INFO'
                            ? 'muted'
                            : 'accent'
                        }
                        className="text-[11px]"
                      >
                        {item.status}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#F1F5F9] text-xs">
                      <span className="text-[#94A3B8]">
                        Cadastrado em {formatDate(item.createdAt)}
                      </span>
                      {item.hoursInQueue > 0 && (
                        <span
                          className={`flex items-center gap-1 font-semibold ${
                            isOverdue ? 'text-[#DC2626]' : 'text-[#F97316]'
                          }`}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          {item.hoursInQueue}h na fila
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="p-8 text-center text-sm text-[#94A3B8] bg-white rounded-xl border border-[#E2E8F0]">
                Nenhum cadastro pendente nesta categoria 🎉
              </div>
            )}
          </div>
        </div>

        {/* Detalhe do Cadastro (7 colunas) */}
        <div className="lg:col-span-7">
          {currentItem ? (
            <Card className="shadow-sm">
              <CardHeader className="border-b border-[#E2E8F0] pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#0F766E] uppercase tracking-wider">
                      {currentItem.type === 'VET' ? 'Médico Veterinário' : 'Estabelecimento Clínico'}
                    </span>
                    <CardTitle className="text-xl font-bold mt-1 text-[#1E293B]">
                      {currentItem.name}
                    </CardTitle>
                    <p className="text-sm font-mono text-[#64748B] mt-0.5">
                      Documento: <strong className="text-[#1E293B]">{currentItem.identifier}</strong>
                    </p>
                  </div>
                  <Badge variant={currentItem.hoursInQueue > 48 ? 'danger' : 'accent'}>
                    {currentItem.hoursInQueue}h aguardando análise
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Visualização de Profissional (CRMV) */}
                {currentItem.type === 'VET' && (
                  <>
                    <div>
                      <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">
                        Especialidades Cadastradas
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {currentItem.specialties?.map((spec) => (
                          <span
                            key={spec}
                            className="bg-[#CCFBF1] text-[#0F766E] text-xs font-medium px-2.5 py-1 rounded-md"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Documentos Anexados */}
                    <div>
                      <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">
                        Documentos Comprobatórios (URL Assinada 5min)
                      </h4>
                      <div className="space-y-2">
                        {currentItem.documents?.map((doc, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-[#0F766E]" />
                              <span className="text-sm font-medium text-[#1E293B]">{doc.name}</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs gap-1 cursor-pointer"
                              onClick={() => alert(`Abrindo documento assinado: ${doc.name}`)}
                            >
                              <ExternalLink className="h-3.5 w-3.5" /> Abrir Documento
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Botão de Consulta CFMV */}
                    <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-between">
                      <div>
                        <h5 className="text-sm font-bold text-[#1E40AF]">
                          Consulta Pública no CFMV
                        </h5>
                        <p className="text-xs text-[#3B82F6]">
                          Verifique a situação cadastral do CRMV {currentItem.identifier} no portal oficial.
                        </p>
                      </div>
                      <a
                        href="https://consultacrmv.cfmv.gov.br/consulta"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] text-white rounded-lg text-xs font-semibold hover:bg-[#1D4ED8] transition-colors"
                      >
                        Consultar no CFMV <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>

                    {/* Checklist Manual do Operador */}
                    <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-2">
                      <h5 className="text-xs font-bold uppercase text-[#64748B] tracking-wider">
                        Checklist de Verificação Manual
                      </h5>
                      <label className="flex items-center gap-2 text-sm text-[#1E293B] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checklist.nameMatches}
                          onChange={(e) =>
                            setChecklist((prev) => ({ ...prev, nameMatches: e.target.checked }))
                          }
                          className="h-4 w-4 text-[#0F766E] rounded"
                        />
                        <span>Nome completo confere com a certidão/carteira do CRMV</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm text-[#1E293B] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checklist.crmvActive}
                          onChange={(e) =>
                            setChecklist((prev) => ({ ...prev, crmvActive: e.target.checked }))
                          }
                          className="h-4 w-4 text-[#0F766E] rounded"
                        />
                        <span>Registro profissional está ATIVO no CFMV</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm text-[#1E293B] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checklist.ufMatches}
                          onChange={(e) =>
                            setChecklist((prev) => ({ ...prev, ufMatches: e.target.checked }))
                          }
                          className="h-4 w-4 text-[#0F766E] rounded"
                        />
                        <span>Estado (UF) do registro confere com a localização declarada</span>
                      </label>
                    </div>
                  </>
                )}

                {/* Visualização de Clínica (CNPJ / BrasilAPI) */}
                {currentItem.type === 'CLINIC' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                          Dados da Receita Federal (BrasilAPI)
                        </h4>
                        <Badge
                          variant={
                            currentItem.cnpjData?.situacaoCadastral === 'ATIVA' ? 'success' : 'danger'
                          }
                        >
                          {currentItem.cnpjData?.situacaoCadastral || 'SITUAÇÃO ATIVA'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[#94A3B8] block">Razão Social:</span>
                          <span className="font-semibold text-[#1E293B]">
                            {currentItem.cnpjData?.razaoSocial || 'PETCARE ALDEOTA LTDA'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#94A3B8] block">Nome Fantasia:</span>
                          <span className="font-semibold text-[#1E293B]">
                            {currentItem.cnpjData?.nomeFantasia || 'PetCare'}
                          </span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-[#94A3B8] block">CNAE Principal:</span>
                          <span className="font-semibold text-[#1E293B]">
                            {currentItem.cnpjData?.cnae || '75.00-1-00 - Atividades veterinárias'}
                          </span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-[#94A3B8] block">Endereço Cadastrado:</span>
                          <span className="font-semibold text-[#1E293B]">
                            {currentItem.cnpjData?.endereco || 'Av. Santos Dumont, 2800'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Barra de Ações */}
                <div className="pt-4 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="default"
                      onClick={handleApprove}
                      className="gap-1.5 font-semibold cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Aprovar Cadastro (A)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setNeedsInfoModalOpen(true)}
                      className="gap-1.5 cursor-pointer text-[#64748B]"
                    >
                      <HelpCircle className="h-4 w-4" /> Pedir Informação
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setRejectModalOpen(true)}
                      className="gap-1.5 cursor-pointer"
                    >
                      <XCircle className="h-4 w-4" /> Recusar (R)
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    onClick={handleNext}
                    className="text-xs text-[#64748B] hover:text-[#1E293B] cursor-pointer"
                  >
                    Próximo da Fila (→)
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="p-12 text-center text-[#94A3B8] bg-white rounded-2xl border border-[#E2E8F0]">
              Selecione um item da fila para visualizar os dados.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Recusar com Motivo */}
      <ConfirmModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={handleReject}
        title="Recusar Verificação de Cadastro"
        description={`Informe o motivo da recusa do cadastro de ${currentItem?.name}. O usuário será notificado.`}
        requiredWord="CONFIRMAR"
        destructive={true}
        confirmButtonText="Confirmar Recusa"
      />

      {/* Modal: Pedir Informações Complementares */}
      {needsInfoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-[#E2E8F0] shadow-xl">
            <h3 className="text-lg font-bold font-heading text-[#1E293B]">
              Solicitar Informações Adicionais
            </h3>
            <p className="text-sm text-[#64748B]">
              Descreva a informação ou documento pendente para que o usuário regularize seu cadastro.
            </p>
            <textarea
              value={infoMessage}
              onChange={(e) => setInfoMessage(e.target.value)}
              placeholder="Ex: Por favor, envie uma foto legível da frente e verso da carteira profissional do CRMV..."
              rows={4}
              className="w-full p-3 border border-[#E2E8F0] rounded-xl text-sm focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setNeedsInfoModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="default"
                disabled={!infoMessage.trim()}
                onClick={handleSendNeedsInfo}
              >
                Enviar Mensagem
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
