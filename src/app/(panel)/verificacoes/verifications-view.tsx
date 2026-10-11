'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
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
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ConfirmModal } from '@/components/shared/confirm-modal'
import { Notice, useNotice } from '@/components/shared/notice'
import { useUrlFilters } from '@/lib/use-url-filters'
import { unwrap } from '@/lib/action-client'
import { setVerification } from '@/server/actions/moderation'
import { getDocumentUrl } from '@/server/actions/users'
import { formatDate } from '@/lib/format'
import type { VerificationItem, VerificationStatus } from '@/types/admin'

interface CnpjData {
  razaoSocial: string
  nomeFantasia: string
  situacaoCadastral: string
  cnae: string
  endereco: string
}

export function VerificationsView({
  items,
  type,
  status,
}: {
  items: VerificationItem[]
  type: 'VET' | 'CLINIC'
  status: VerificationStatus
}) {
  const { setFilters, isPending } = useUrlFilters()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const { notice, success, error } = useNotice()

  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [needsInfoModalOpen, setNeedsInfoModalOpen] = useState(false)
  const [infoMessage, setInfoMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Checklist por item (chave `${userId}:${campo}`), reinicia naturalmente ao trocar de item
  const [checks, setChecks] = useState<Record<string, boolean>>({})

  const [cnpjResult, setCnpjResult] = useState<{ cnpj: string; data?: CnpjData; error?: string } | null>(null)

  const filteredItems = items.filter((item) => {
    const q = search.toLowerCase()
    return (
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.identifier.toLowerCase().includes(q) ||
      (item.city ?? '').toLowerCase().includes(q)
    )
  })

  const currentItem = filteredItems.find((i) => i.userId === selectedId) ?? filteredItems[0] ?? null
  const isActionable = currentItem && currentItem.status !== 'VERIFIED'

  // Consulta automática do CNPJ (BrasilAPI via rota do servidor, cache 24h)
  const cnpjKey = currentItem?.type === 'CLINIC' && currentItem.cnpj ? currentItem.cnpj.replace(/\D/g, '') : null
  const cnpjCurrent = cnpjResult && cnpjResult.cnpj === cnpjKey ? cnpjResult : null
  const cnpjData = cnpjCurrent?.data ?? null
  const cnpjError = cnpjCurrent?.error ?? null
  const cnpjLoading = cnpjKey !== null && cnpjCurrent === null

  useEffect(() => {
    if (!cnpjKey) return
    let cancelled = false
    fetch(`/api/brasilapi/${cnpjKey}`)
      .then(async (res) => {
        const body = await res.json()
        if (cancelled) return
        setCnpjResult(
          res.ok ? { cnpj: cnpjKey, data: body } : { cnpj: cnpjKey, error: body.error ?? 'Falha ao consultar o CNPJ.' }
        )
      })
      .catch(() => !cancelled && setCnpjResult({ cnpj: cnpjKey, error: 'Falha ao consultar o CNPJ.' }))
    return () => {
      cancelled = true
    }
  }, [cnpjKey])

  const handleNext = useCallback(() => {
    if (!currentItem) return
    const idx = filteredItems.findIndex((i) => i.userId === currentItem.userId)
    if (idx >= 0 && idx < filteredItems.length - 1) setSelectedId(filteredItems[idx + 1].userId)
  }, [currentItem, filteredItems])

  const handleApprove = useCallback(async () => {
    if (!currentItem || !isActionable || submitting) return
    setSubmitting(true)
    const result = await setVerification(currentItem.userId, 'VERIFIED')
    setSubmitting(false)
    if (!result.ok) return error(result.error)
    success(`Cadastro de ${currentItem.name} verificado.`)
  }, [currentItem, isActionable, submitting, success, error])

  // Atalhos de teclado: A (Aprova), R (Recusa), Seta Direita (Próximo)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        rejectModalOpen ||
        needsInfoModalOpen
      ) {
        return
      }
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault()
        handleApprove()
      } else if ((e.key === 'r' || e.key === 'R') && isActionable) {
        e.preventDefault()
        setRejectModalOpen(true)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleApprove, handleNext, isActionable, rejectModalOpen, needsInfoModalOpen])

  async function handleReject(reason: string) {
    if (!currentItem) return
    unwrap(await setVerification(currentItem.userId, 'REJECTED', reason))
    success(`Verificação de ${currentItem.name} recusada.`)
  }

  async function handleSendNeedsInfo() {
    if (!currentItem || !infoMessage.trim()) return
    setSubmitting(true)
    const result = await setVerification(currentItem.userId, 'NEEDS_INFO', infoMessage.trim())
    setSubmitting(false)
    if (!result.ok) return error(result.error)
    setNeedsInfoModalOpen(false)
    setInfoMessage('')
    success(`Pedido de informação enviado para ${currentItem.name}.`)
  }

  async function handleOpenDocument(docId: string) {
    const result = await getDocumentUrl(docId)
    if (!result.ok || !result.data) return error(result.ok ? 'Link indisponível.' : result.error)
    window.open(result.data, '_blank', 'noopener,noreferrer')
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

        <div className="hidden lg:flex items-center gap-2 text-xs text-[#64748B] bg-white px-3 py-1.5 rounded-lg border border-[#E2E8F0]">
          <span>Atalhos:</span>
          <kbd className="bg-[#F1F5F9] px-1.5 py-0.5 rounded font-mono font-bold">A</kbd> Aprovar
          <kbd className="bg-[#F1F5F9] px-1.5 py-0.5 rounded font-mono font-bold">R</kbd> Recusar
          <kbd className="bg-[#F1F5F9] px-1.5 py-0.5 rounded font-mono font-bold">→</kbd> Próximo
        </div>
      </div>

      <Notice notice={notice} />

      {/* Tabs Principais: CRMV vs CNPJ */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2">
        <div className="flex items-center gap-2">
          {(
            [
              { key: 'VET', label: 'Profissionais (CRMV)', icon: UserCheck },
              { key: 'CLINIC', label: 'Clínicas (CNPJ)', icon: Building2 },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setSelectedId(null)
                  setFilters({ type: tab.key === 'VET' ? null : tab.key })
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  type === tab.key
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E2E8F0] text-xs">
          {(['PENDING', 'NEEDS_INFO', 'REJECTED', 'VERIFIED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => {
                setSelectedId(null)
                setFilters({ status: st === 'PENDING' ? null : st })
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                status === st ? 'bg-[#0F766E] text-white shadow-xs' : 'text-[#64748B] hover:text-[#1E293B]'
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

      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 transition-opacity ${isPending ? 'opacity-60' : ''}`}>
        {/* Fila */}
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
                const isSelected = currentItem?.userId === item.userId
                const isOverdue = item.hoursInQueue > 48
                const showAge = item.status === 'PENDING' || item.status === 'NEEDS_INFO'

                return (
                  <div
                    key={item.userId}
                    onClick={() => setSelectedId(item.userId)}
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
                          {item.identifier}
                          {item.city ? ` · ${item.city}` : ''}
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
                      <span className="text-[#94A3B8]">Cadastrado em {formatDate(item.createdAt)}</span>
                      {showAge && (
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
                Nenhum cadastro nesta categoria 🎉
              </div>
            )}
          </div>
        </div>

        {/* Detalhe do Cadastro */}
        <div className="lg:col-span-7">
          {currentItem ? (
            <Card className="shadow-sm">
              <CardHeader className="border-b border-[#E2E8F0] pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#0F766E] uppercase tracking-wider">
                      {currentItem.type === 'VET' ? 'Profissional' : 'Estabelecimento Clínico'}
                    </span>
                    <CardTitle className="text-xl font-bold mt-1 text-[#1E293B]">
                      <Link href={`/usuarios/${currentItem.userId}`} className="hover:text-[#0F766E]">
                        {currentItem.name}
                      </Link>
                    </CardTitle>
                    <p className="text-sm font-mono text-[#64748B] mt-0.5">
                      Documento: <strong className="text-[#1E293B]">{currentItem.identifier}</strong>
                    </p>
                  </div>
                  {(currentItem.status === 'PENDING' || currentItem.status === 'NEEDS_INFO') && (
                    <Badge variant={currentItem.hoursInQueue > 48 ? 'danger' : 'accent'}>
                      {currentItem.hoursInQueue}h aguardando análise
                    </Badge>
                  )}
                </div>
                {currentItem.note && (
                  <p className="text-xs text-[#64748B] mt-2 bg-[#F8FAFC] p-2 rounded-lg border border-[#E2E8F0]">
                    Última nota: {currentItem.note}
                  </p>
                )}
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {currentItem.type === 'VET' && (
                  <>
                    <div>
                      <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">
                        Especialidades Cadastradas
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {currentItem.specialties.length === 0 && (
                          <span className="text-xs text-[#94A3B8]">Nenhuma especialidade informada.</span>
                        )}
                        {currentItem.specialties.map((spec) => (
                          <span
                            key={spec}
                            className="bg-[#CCFBF1] text-[#0F766E] text-xs font-medium px-2.5 py-1 rounded-md"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">
                        Documentos Comprobatórios (URL Assinada 5min)
                      </h4>
                      <div className="space-y-2">
                        {currentItem.documents.length === 0 && (
                          <span className="text-xs text-[#94A3B8]">Nenhum documento enviado.</span>
                        )}
                        {currentItem.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-[#0F766E]" />
                              <span className="text-sm font-medium text-[#1E293B]">{doc.name}</span>
                              <span className="text-xs text-[#94A3B8]">{doc.type}</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs gap-1 cursor-pointer"
                              onClick={() => handleOpenDocument(doc.id)}
                            >
                              <ExternalLink className="h-3.5 w-3.5" /> Abrir Documento
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-between gap-3">
                      <div>
                        <h5 className="text-sm font-bold text-[#1E40AF]">Consulta Pública no CFMV</h5>
                        <p className="text-xs text-[#3B82F6]">
                          Verifique a situação cadastral do CRMV {currentItem.identifier} no portal oficial.
                        </p>
                      </div>
                      <a
                        href="https://consultacrmv.cfmv.gov.br/consulta"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] text-white rounded-lg text-xs font-semibold hover:bg-[#1D4ED8] transition-colors"
                      >
                        Consultar no CFMV <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>

                    <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-2">
                      <h5 className="text-xs font-bold uppercase text-[#64748B] tracking-wider">
                        Checklist de Verificação Manual
                      </h5>
                      {(
                        [
                          ['nameMatches', 'Nome completo confere com a carteira do CRMV'],
                          ['crmvActive', 'Registro profissional está ATIVO no CFMV'],
                          ['ufMatches', 'Estado (UF) do registro confere'],
                        ] as const
                      ).map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2 text-sm text-[#1E293B] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(checks[`${currentItem.userId}:${key}`])}
                            onChange={(e) =>
                              setChecks((prev) => ({ ...prev, [`${currentItem.userId}:${key}`]: e.target.checked }))
                            }
                            className="h-4 w-4 text-[#0F766E] rounded"
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </>
                )}

                {currentItem.type === 'CLINIC' && (
                  <div className="space-y-4">
                    <div className="text-xs">
                      <span className="text-[#94A3B8] block">Endereço informado no app:</span>
                      <span className="font-semibold text-[#1E293B]">{currentItem.address ?? '-'}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                          Dados da Receita Federal (BrasilAPI)
                        </h4>
                        {cnpjData && (
                          <Badge variant={cnpjData.situacaoCadastral === 'ATIVA' ? 'success' : 'danger'}>
                            {cnpjData.situacaoCadastral}
                          </Badge>
                        )}
                      </div>

                      {cnpjLoading && <p className="text-xs text-[#64748B]">Consultando CNPJ...</p>}
                      {!currentItem.cnpj && <p className="text-xs text-[#DC2626]">Clínica sem CNPJ cadastrado.</p>}
                      {cnpjError && (
                        <p className="text-xs text-[#DC2626]">
                          {cnpjError}{' '}
                          <a
                            href="https://solucoes.receita.fazenda.gov.br/servicos/cnpjreva/cnpjreva_solicitacao.asp"
                            target="_blank"
                            rel="noreferrer"
                            className="underline"
                          >
                            Consultar na Receita Federal
                          </a>
                        </p>
                      )}
                      {cnpjData && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-[#94A3B8] block">Razão Social:</span>
                            <span className="font-semibold text-[#1E293B]">{cnpjData.razaoSocial}</span>
                          </div>
                          <div>
                            <span className="text-[#94A3B8] block">Nome Fantasia:</span>
                            <span className="font-semibold text-[#1E293B]">{cnpjData.nomeFantasia}</span>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-[#94A3B8] block">CNAE Principal:</span>
                            <span className="font-semibold text-[#1E293B]">{cnpjData.cnae}</span>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-[#94A3B8] block">Endereço Cadastrado:</span>
                            <span className="font-semibold text-[#1E293B]">{cnpjData.endereco}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Barra de Ações */}
                <div className="pt-4 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="default"
                      onClick={handleApprove}
                      disabled={!isActionable || submitting}
                      className="gap-1.5 font-semibold cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Aprovar Cadastro (A)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setNeedsInfoModalOpen(true)}
                      disabled={!isActionable || submitting}
                      className="gap-1.5 cursor-pointer text-[#64748B]"
                    >
                      <HelpCircle className="h-4 w-4" /> Pedir Informação
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setRejectModalOpen(true)}
                      disabled={!isActionable || submitting || currentItem.status === 'REJECTED'}
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
            <h3 className="text-lg font-bold font-heading text-[#1E293B]">Solicitar Informações Adicionais</h3>
            <p className="text-sm text-[#64748B]">
              Descreva a informação ou documento pendente. O usuário recebe esta mensagem no app.
            </p>
            <textarea
              value={infoMessage}
              onChange={(e) => setInfoMessage(e.target.value)}
              placeholder="Ex: Envie uma foto legível da frente e verso da carteira do CRMV..."
              rows={4}
              className="w-full p-3 border border-[#E2E8F0] rounded-xl text-sm focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNeedsInfoModalOpen(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button variant="default" disabled={!infoMessage.trim() || submitting} onClick={handleSendNeedsInfo}>
                {submitting ? 'Enviando...' : 'Enviar Mensagem'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
