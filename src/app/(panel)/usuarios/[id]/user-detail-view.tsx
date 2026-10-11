'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  User,
  Star,
  Activity,
  CreditCard,
  AlertTriangle,
  FileText,
  StickyNote,
  History,
  ShieldAlert,
  Ban,
  RotateCcw,
  Trash2,
  Download,
  Gift,
  Plus,
  Eye,
  Clock,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmModal } from '@/components/shared/confirm-modal'
import { Notice, useNotice } from '@/components/shared/notice'
import { maskEmail, formatDate, formatDateTime, formatCurrency } from '@/lib/format'
import { unwrap } from '@/lib/action-client'
import {
  suspendUser,
  banUser,
  reactivateUser,
  grantCredits,
  extendTrial,
  addNote,
  revealPhone,
  getDocumentUrl,
} from '@/server/actions/users'
import type { UserDetail } from '@/server/queries/users'
import type { AdminRole } from '@/types/database'

type Tab = 'resumo' | 'atividade' | 'financeiro' | 'avaliacoes' | 'denuncias' | 'documentos' | 'notas' | 'historico'

const EMPTY = <p className="text-xs text-[#94A3B8]">Nada por aqui ainda.</p>

export function UserDetailView({ user, staffRole }: { user: UserDetail; staffRole: AdminRole }) {
  const isAdmin = staffRole === 'admin'
  const [activeTab, setActiveTab] = useState<Tab>('resumo')
  const [fullPhone, setFullPhone] = useState<string | null>(null)
  const { notice, success, error } = useNotice()

  const [suspendModalOpen, setSuspendModalOpen] = useState(false)
  const [suspendDays, setSuspendDays] = useState(1)
  const [banModalOpen, setBanModalOpen] = useState(false)
  const [reactivateModalOpen, setReactivateModalOpen] = useState(false)
  const [creditsModalOpen, setCreditsModalOpen] = useState(false)
  const [creditAmount, setCreditAmount] = useState(1)
  const [trialModalOpen, setTrialModalOpen] = useState(false)
  const [trialDays, setTrialDays] = useState(7)

  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  const suspendOptions = isAdmin ? [1, 3, 7, 30] : [1, 3, 7]
  const isStaffPunished = user.status === 'SUSPENDED' || user.status === 'BANNED'
  const canReactivate = user.status === 'SUSPENDED' || (user.status === 'BANNED' && isAdmin)

  async function handleSuspend(reason: string) {
    unwrap(await suspendUser(user.id, suspendDays, reason))
    success(`Usuário suspenso por ${suspendDays} dia(s).`)
  }

  async function handleBan(reason: string) {
    unwrap(await banUser(user.id, reason))
    success('Usuário banido. Solicitações abertas e interesses pendentes foram encerrados.')
  }

  async function handleReactivate(reason: string) {
    unwrap(await reactivateUser(user.id, reason))
    success('Conta reativada.')
  }

  async function handleGrantCredits(reason: string) {
    unwrap(await grantCredits(user.id, creditAmount, reason))
    success(`${creditAmount} crédito(s) concedido(s).`)
  }

  async function handleExtendTrial(reason: string) {
    unwrap(await extendTrial(user.id, trialDays, reason))
    success(`Teste estendido em ${trialDays} dia(s).`)
  }

  async function handleTogglePhone() {
    if (fullPhone !== null) return setFullPhone(null)
    const result = await revealPhone(user.id)
    if (!result.ok) return error(result.error)
    setFullPhone(result.data || '-')
  }

  async function handleOpenDocument(docId: string) {
    const result = await getDocumentUrl(docId)
    if (!result.ok || !result.data) return error(result.ok ? 'Link indisponível.' : result.error)
    window.open(result.data, '_blank', 'noopener,noreferrer')
  }

  async function handleAddNote() {
    if (!newNote.trim()) return
    setSavingNote(true)
    const result = await addNote('PROFILE', user.id, newNote.trim())
    setSavingNote(false)
    if (!result.ok) return error(result.error)
    setNewNote('')
    success('Nota interna registrada.')
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Voltar e Título */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/usuarios">
            <Button variant="outline" size="icon" className="h-9 w-9" aria-label="Voltar">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold font-heading text-[#1E293B]">
                {user.fullName}
              </h1>
              <Badge variant="outline">{user.role}</Badge>
              <Badge
                variant={
                  user.status === 'ACTIVE'
                    ? 'success'
                    : user.status === 'SUSPENDED'
                    ? 'accent'
                    : 'danger'
                }
              >
                {user.status}
              </Badge>
            </div>
            <p className="text-xs text-[#64748B] font-mono mt-0.5">
              ID: {user.id} · {user.identifier}
              {user.city ? ` · ${user.city}` : ''}
            </p>
          </div>
        </div>

        {/* Menu de Ações Administrativas */}
        <div className="flex flex-wrap items-center gap-2">
          {user.status === 'ACTIVE' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSuspendModalOpen(true)}
              className="text-xs text-[#F97316] hover:bg-[#FFEDD5] border-[#FED7AA]"
            >
              <ShieldAlert className="h-3.5 w-3.5 mr-1" /> Suspender
            </Button>
          )}
          {isAdmin && user.status !== 'BANNED' && user.status !== 'DELETED' && (
            <Button variant="destructive" size="sm" onClick={() => setBanModalOpen(true)} className="text-xs">
              <Ban className="h-3.5 w-3.5 mr-1" /> Banir
            </Button>
          )}
          {isStaffPunished && canReactivate && (
            <Button variant="default" size="sm" onClick={() => setReactivateModalOpen(true)} className="text-xs">
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reativar Conta
            </Button>
          )}

          {isAdmin && user.role === 'CLINIC' && (
            <Button variant="outline" size="sm" onClick={() => setCreditsModalOpen(true)} className="text-xs">
              <Gift className="h-3.5 w-3.5 mr-1" /> Dar Créditos
            </Button>
          )}
          {isAdmin && user.role !== 'CLINIC' && (
            <Button variant="outline" size="sm" onClick={() => setTrialModalOpen(true)} className="text-xs">
              <Clock className="h-3.5 w-3.5 mr-1" /> Estender Teste
            </Button>
          )}

          {isAdmin && (
            <>
              <Button
                variant="ghost"
                size="sm"
                disabled
                title="Exportação LGPD ainda não integrada"
                className="text-xs text-[#64748B]"
              >
                <Download className="h-3.5 w-3.5 mr-1" /> Exportar LGPD
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled
                title="Exclusão depende da Edge Function delete-account (ainda não integrada)"
                className="text-xs text-[#DC2626]"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir Conta
              </Button>
            </>
          )}
        </div>
      </div>

      <Notice notice={notice} />

      {/* Navegação de Abas */}
      <div className="flex items-center gap-1 border-b border-[#E2E8F0] overflow-x-auto pb-1 text-xs font-semibold">
        {(
          [
            { key: 'resumo', label: '1. Resumo', icon: User },
            { key: 'atividade', label: '2. Atividade', icon: Activity },
            { key: 'financeiro', label: '3. Financeiro', icon: CreditCard },
            { key: 'avaliacoes', label: '4. Avaliações', icon: Star },
            { key: 'denuncias', label: '5. Denúncias', icon: AlertTriangle },
            { key: 'documentos', label: '6. Documentos', icon: FileText },
            { key: 'notas', label: '7. Notas Internas', icon: StickyNote },
            { key: 'historico', label: '8. Histórico Auditado', icon: History },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg transition-colors shrink-0 ${
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

      <div className="space-y-6">
        {/* Aba 1: Resumo */}
        {activeTab === 'resumo' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-bold text-[#1E293B]">
                  Dados Cadastrais do Perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Nome Completo:" value={user.personName} />
                  <Field label="Documento:" value={user.identifier} mono />
                  <Field label="E-mail:" value={maskEmail(user.email)} mono />
                  <div>
                    <span className="text-xs text-[#94A3B8] block">Telefone:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[#1E293B]">{fullPhone ?? user.maskedPhone}</span>
                      {user.hasPhone && (
                        <button
                          onClick={handleTogglePhone}
                          className="text-xs text-[#0F766E] underline flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          {fullPhone !== null ? 'Ocultar' : 'Mostrar (Auditado)'}
                        </button>
                      )}
                    </div>
                  </div>
                  <Field label="Cidade:" value={user.city ?? '-'} />
                  <div>
                    <span className="text-xs text-[#94A3B8] block">Onboarding Completo:</span>
                    {user.onboardingCompleted ? (
                      <span className="text-[#16A34A] font-semibold">Sim ✓</span>
                    ) : (
                      <span className="text-[#F97316] font-semibold">Não</span>
                    )}
                  </div>
                  <div>
                    <span className="text-xs text-[#94A3B8] block">Verificação:</span>
                    <span className="font-semibold text-[#1E293B]">{user.verificationStatus ?? '-'}</span>
                    {user.verificationNote && (
                      <span className="block text-xs text-[#64748B]">{user.verificationNote}</span>
                    )}
                  </div>
                </div>

                {(user.suspensionReason || user.suspendedUntil) && user.status !== 'ACTIVE' && (
                  <div className="p-4 rounded-xl bg-[#FEE2E2] border border-[#FECACA] text-xs space-y-1">
                    <span className="font-bold text-[#DC2626] block">Motivo da Suspensão / Punição:</span>
                    <p className="text-[#DC2626]">{user.suspensionReason ?? '-'}</p>
                    {user.suspendedUntil && (
                      <span className="text-[#991B1B] font-semibold block mt-1">
                        Suspenso até: {formatDateTime(user.suspendedUntil)}
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold text-[#1E293B]">
                  Estatísticas de Avaliação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center font-bold text-xl">
                    <Star className="h-6 w-6 fill-amber-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#1E293B]">
                      {user.ratingAvg !== null ? user.ratingAvg.toFixed(1) : '-'}
                    </div>
                    <div className="text-xs text-[#64748B]">Baseado em {user.ratingCount} avaliações</div>
                  </div>
                </div>
                <div className="pt-3 border-t border-[#E2E8F0] space-y-2 text-xs text-[#64748B]">
                  <div className="flex justify-between">
                    <span>Data de Cadastro:</span>
                    <span className="font-semibold text-[#1E293B]">{formatDate(user.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Último Acesso:</span>
                    <span className="font-semibold text-[#1E293B]">{formatDateTime(user.lastAccess)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Aba 2: Atividade */}
        {activeTab === 'atividade' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#1E293B]">
                {user.role === 'CLINIC' ? 'Solicitações da Clínica' : 'Interesses Enviados'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {user.activity.length === 0
                ? EMPTY
                : user.activity.map((a) => (
                    <Link
                      key={a.id}
                      href={`/solicitacoes/${a.requestId}`}
                      className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between hover:border-[#0F766E]"
                    >
                      <div>
                        <h5 className="font-semibold text-sm text-[#1E293B]">{a.title}</h5>
                        <p className="text-xs text-[#64748B]">
                          {a.subtitle} · {formatDate(a.date)}
                        </p>
                      </div>
                      <Badge variant={a.status === 'FILLED' || a.status === 'ACCEPTED' ? 'success' : 'muted'}>
                        {a.status}
                      </Badge>
                    </Link>
                  ))}
            </CardContent>
          </Card>
        )}

        {/* Aba 3: Financeiro */}
        {activeTab === 'financeiro' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#1E293B]">
                Situação Financeira
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                  <span className="text-xs text-[#94A3B8] block">Assinatura:</span>
                  <span className="text-lg font-bold text-[#0F766E]">{user.subscription?.status ?? '-'}</span>
                  {user.subscription && (
                    <span className="block text-[11px] text-[#64748B]">
                      {user.subscription.status === 'TRIAL'
                        ? `Teste até ${formatDate(user.subscription.trial_end)}`
                        : `Período até ${formatDate(user.subscription.current_period_end)}`}
                      {user.subscription.method ? ` · ${user.subscription.method}` : ''}
                    </span>
                  )}
                </div>
                <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                  <span className="text-xs text-[#94A3B8] block">Saldo de Créditos:</span>
                  <span className="text-lg font-bold text-[#1E293B]">{user.creditsBalance} publicações</span>
                </div>
                <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                  <span className="text-xs text-[#94A3B8] block">Total Pago (confirmado):</span>
                  <span className="text-lg font-bold text-[#16A34A]">
                    {formatCurrency(
                      user.payments
                        .filter((p) => p.status === 'CONFIRMED')
                        .reduce((sum, p) => sum + p.amount_cents, 0)
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-[#64748B]">Pagamentos</h4>
                {user.payments.length === 0
                  ? EMPTY
                  : user.payments.map((p) => (
                      <div key={p.id} className="p-3 rounded-lg border border-[#E2E8F0] flex items-center justify-between text-xs">
                        <span className="text-[#64748B]">{formatDateTime(p.created_at)}</span>
                        <span className="font-mono">{p.type}</span>
                        <span className="font-bold">{formatCurrency(p.amount_cents)}</span>
                        <span>{p.method}</span>
                        <Badge variant={p.status === 'CONFIRMED' ? 'success' : p.status === 'FAILED' ? 'danger' : 'muted'}>
                          {p.status}
                        </Badge>
                      </div>
                    ))}
              </div>

              {user.creditsLedger.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase text-[#64748B]">Créditos</h4>
                  {user.creditsLedger.map((c) => (
                    <div key={c.id} className="p-3 rounded-lg border border-[#E2E8F0] flex items-center justify-between text-xs">
                      <span className="font-bold">{c.amount > 0 ? `+${c.amount}` : c.amount}</span>
                      <span className="text-[#64748B] flex-1 px-3">{c.reason}</span>
                      <span className="text-[#94A3B8]">{formatDateTime(c.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Aba 4: Avaliações */}
        {activeTab === 'avaliacoes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(
              [
                { title: `Recebidas (${user.reviewsReceived.length})`, items: user.reviewsReceived, prefix: 'De' },
                { title: `Feitas (${user.reviewsMade.length})`, items: user.reviewsMade, prefix: 'Para' },
              ] as const
            ).map((group) => (
              <Card key={group.title}>
                <CardHeader>
                  <CardTitle className="text-base font-bold text-[#1E293B]">{group.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {group.items.length === 0
                    ? EMPTY
                    : group.items.map((r) => (
                        <div key={r.id} className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#1E293B]">
                              {group.prefix} {r.otherName}
                            </span>
                            <div className="flex items-center gap-2">
                              {r.moderation_status === 'HIDDEN' && (
                                <Badge variant="muted" className="text-[10px]">OCULTA</Badge>
                              )}
                              <div className="flex items-center text-amber-500 text-xs font-bold">
                                <Star className="h-3 w-3 fill-amber-500 mr-1" /> {r.rating}
                              </div>
                            </div>
                          </div>
                          {r.comment && <p className="text-xs text-[#64748B]">{r.comment}</p>}
                          <span className="text-[10px] text-[#94A3B8] block">{formatDate(r.created_at)}</span>
                        </div>
                      ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Aba 5: Denúncias */}
        {activeTab === 'denuncias' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(
              [
                { title: `Contra este usuário (${user.reportsAgainst.length})`, items: user.reportsAgainst },
                { title: `Feitas por ele (${user.reportsBy.length})`, items: user.reportsBy },
              ] as const
            ).map((group) => (
              <Card key={group.title}>
                <CardHeader>
                  <CardTitle className="text-base font-bold text-[#1E293B]">{group.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {group.items.length === 0
                    ? EMPTY
                    : group.items.map((r) => (
                        <div key={r.id} className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-start justify-between">
                          <div>
                            <div className="flex gap-1.5">
                              <Badge variant="danger" className="text-[10px]">{r.reason}</Badge>
                              <Badge variant="outline" className="text-[10px]">{r.status}</Badge>
                            </div>
                            {r.description && (
                              <p className="text-xs text-[#1E293B] mt-1 line-clamp-2">{r.description}</p>
                            )}
                            <p className="text-xs text-[#64748B] mt-0.5">{formatDate(r.created_at)}</p>
                          </div>
                          <Link href={`/denuncias/${r.id}`}>
                            <Button variant="outline" size="sm" className="text-xs">Ver</Button>
                          </Link>
                        </div>
                      ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Aba 6: Documentos */}
        {activeTab === 'documentos' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#1E293B]">
                Documentos (bucket privado, link de 5 minutos)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {user.documents.length === 0
                ? EMPTY
                : user.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#0F766E]" />
                        <span className="text-sm font-medium text-[#1E293B]">{doc.name}</span>
                        <span className="text-xs text-[#94A3B8]">{doc.type}</span>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleOpenDocument(doc.id)} className="text-xs">
                        Abrir (auditado)
                      </Button>
                    </div>
                  ))}
            </CardContent>
          </Card>
        )}

        {/* Aba 7: Notas Internas */}
        {activeTab === 'notas' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#1E293B]">
                Anotações Internas da Equipe (Invisível ao Usuário)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  maxLength={2000}
                  placeholder="Adicione um comentário ou histórico sobre o atendimento deste usuário..."
                  rows={3}
                  className="w-full p-3 border border-[#E2E8F0] rounded-xl text-sm focus:border-[#0F766E] focus:outline-none"
                />
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || savingNote}
                  className="gap-1 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" /> {savingNote ? 'Salvando...' : 'Adicionar Nota'}
                </Button>
              </div>

              <div className="space-y-3 pt-3 border-t border-[#E2E8F0]">
                {user.notes.length === 0
                  ? EMPTY
                  : user.notes.map((note) => (
                      <div key={note.id} className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs space-y-1">
                        <div className="flex items-center justify-between text-[#64748B]">
                          <span className="font-semibold text-[#1E293B]">{note.authorName}</span>
                          <span>{formatDateTime(note.createdAt)}</span>
                        </div>
                        <p className="text-[#1E293B] whitespace-pre-wrap">{note.body}</p>
                      </div>
                    ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Aba 8: Histórico Auditado */}
        {activeTab === 'historico' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#1E293B]">
                Trilha de Auditoria (audit_logs)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs">
                {user.audit.length === 0
                  ? EMPTY
                  : user.audit.map((a) => (
                      <div key={a.id} className="p-3 rounded-lg border border-[#E2E8F0] flex items-center justify-between">
                        <div>
                          <span className="font-bold text-[#1E293B] font-mono">{a.action}</span>
                          <p className="text-[#64748B]">
                            Operador: {a.actorName}
                            {a.reason ? ` · Motivo: ${a.reason}` : ''}
                          </p>
                        </div>
                        <span className="text-[#94A3B8] shrink-0">{formatDateTime(a.createdAt)}</span>
                      </div>
                    ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal: Suspender Usuário */}
      <ConfirmModal
        isOpen={suspendModalOpen}
        onClose={() => setSuspendModalOpen(false)}
        onConfirm={handleSuspend}
        title="Suspender Conta do Usuário"
        description={`A conta de ${user.fullName} será suspensa. O usuário verá a tela 'Conta Suspensa' no app.`}
        requiredWord="CONFIRMAR"
        destructive={true}
        confirmButtonText="Confirmar Suspensão"
      >
        <div>
          <label className="block text-sm font-medium text-[#1E293B] mb-1">Duração:</label>
          <select
            value={suspendDays}
            onChange={(e) => setSuspendDays(Number(e.target.value))}
            className="w-full p-2.5 rounded-lg border border-[#E2E8F0] text-sm"
          >
            {suspendOptions.map((d) => (
              <option key={d} value={d}>
                {d} dia(s)
              </option>
            ))}
          </select>
        </div>
      </ConfirmModal>

      {/* Modal: Banir Usuário */}
      <ConfirmModal
        isOpen={banModalOpen}
        onClose={() => setBanModalOpen(false)}
        onConfirm={handleBan}
        title="Banir Usuário Permanentemente"
        description={`Atenção: ao banir ${user.fullName}, as solicitações abertas serão canceladas, os interesses pendentes retirados e o login bloqueado.`}
        requiredWord={user.email ?? 'CONFIRMAR'}
        destructive={true}
        confirmButtonText="Banir Conta"
      />

      {/* Modal: Reativar Conta */}
      <ConfirmModal
        isOpen={reactivateModalOpen}
        onClose={() => setReactivateModalOpen(false)}
        onConfirm={handleReactivate}
        title="Reativar Conta do Usuário"
        description={`Deseja reativar a conta de ${user.fullName}? O acesso ao aplicativo será liberado imediatamente.`}
        requiredWord="CONFIRMAR"
        destructive={false}
        confirmButtonText="Reativar Conta"
      />

      {/* Modal: Conceder Créditos */}
      <ConfirmModal
        isOpen={creditsModalOpen}
        onClose={() => setCreditsModalOpen(false)}
        onConfirm={handleGrantCredits}
        title="Conceder Créditos de Publicação"
        description={`Adicione publicações gratuitas para a clínica ${user.fullName}.`}
        requiredWord=""
        destructive={false}
        confirmButtonText="Conceder"
      >
        <div>
          <label className="block text-sm font-medium text-[#1E293B] mb-1">Quantidade de créditos:</label>
          <input
            type="number"
            min={1}
            max={50}
            value={creditAmount}
            onChange={(e) => setCreditAmount(Math.max(1, Math.min(50, Number(e.target.value))))}
            className="w-full p-2.5 border border-[#E2E8F0] rounded-lg text-sm"
          />
        </div>
      </ConfirmModal>

      {/* Modal: Estender Teste */}
      <ConfirmModal
        isOpen={trialModalOpen}
        onClose={() => setTrialModalOpen(false)}
        onConfirm={handleExtendTrial}
        title="Estender Teste Grátis"
        description={`O período de teste de ${user.fullName} será estendido.`}
        requiredWord=""
        destructive={false}
        confirmButtonText="Estender"
      >
        <div>
          <label className="block text-sm font-medium text-[#1E293B] mb-1">Dias adicionais:</label>
          <input
            type="number"
            min={1}
            max={90}
            value={trialDays}
            onChange={(e) => setTrialDays(Math.max(1, Math.min(90, Number(e.target.value))))}
            className="w-full p-2.5 border border-[#E2E8F0] rounded-lg text-sm"
          />
        </div>
      </ConfirmModal>
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-xs text-[#94A3B8] block">{label}</span>
      <span className={`${mono ? 'font-mono' : 'font-semibold'} text-[#1E293B]`}>{value}</span>
    </div>
  )
}
