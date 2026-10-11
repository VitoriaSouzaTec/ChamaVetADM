'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Building2, XCircle, Eye, EyeOff, Plus, Star } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmModal } from '@/components/shared/confirm-modal'
import { Notice, useNotice } from '@/components/shared/notice'
import { unwrap } from '@/lib/action-client'
import { cancelRequest, setRequestModeration } from '@/server/actions/moderation'
import { addNote } from '@/server/actions/users'
import { formatDateTime } from '@/lib/format'
import { formatRequestPrice, formatWorkDate } from '@/lib/request-format'
import type { RequestDetail } from '@/server/queries/requests'
import type { AdminRole } from '@/types/database'

const EMPTY = <p className="text-xs text-[#94A3B8]">Nada por aqui ainda.</p>

export function RequestDetailView({ req, staffRole }: { req: RequestDetail; staffRole: AdminRole }) {
  const isAdmin = staffRole === 'admin'
  const { notice, success, error } = useNotice()
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [moderateModalOpen, setModerateModalOpen] = useState(false)
  const [giveCredit, setGiveCredit] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  async function handleCancelRequest(reason: string) {
    unwrap(await cancelRequest(req.id, reason, giveCredit))
    success(`Solicitação cancelada.${giveCredit ? ' 1 crédito devolvido à clínica.' : ''}`)
  }

  async function handleToggleModeration(reason: string) {
    const next = req.moderationStatus === 'VISIBLE' ? 'HIDDEN' : 'VISIBLE'
    unwrap(await setRequestModeration(req.id, next, reason))
    success(`Solicitação agora está ${next === 'HIDDEN' ? 'OCULTA' : 'VISÍVEL'}.`)
  }

  async function handleAddNote() {
    if (!newNote.trim()) return
    setSavingNote(true)
    const result = await addNote('REQUEST', req.id, newNote.trim())
    setSavingNote(false)
    if (!result.ok) return error(result.error)
    setNewNote('')
    success('Nota interna registrada.')
  }

  // Linha do tempo montada com os registros reais
  const timeline: Array<{ label: string; detail?: string; date: string | null; color: string }> = [
    { label: 'Criada pela clínica', date: req.createdAt, color: 'bg-[#16A34A]' },
  ]
  if (req.publishedAt) timeline.push({ label: 'Publicada na plataforma', date: req.publishedAt, color: 'bg-[#16A34A]' })
  if (req.invitations.length) {
    timeline.push({
      label: `${req.invitations.length} convite(s) enviado(s)`,
      date: req.invitations[0].createdAt,
      color: 'bg-[#0F766E]',
    })
  }
  timeline.push(
    req.interests.length
      ? {
          label: `${req.interests.length} interesse(s) recebido(s)`,
          detail: 'Primeiro interesse',
          date: req.interests[0].createdAt,
          color: 'bg-[#F97316]',
        }
      : { label: 'Nenhum interesse recebido até o momento', date: null, color: 'bg-[#CBD5E1]' }
  )
  const accepted = req.interests.find((i) => i.status === 'ACCEPTED')
  if (req.acceptedVetId) {
    timeline.push({
      label: `Aceite: ${req.acceptedVetName ?? 'profissional'}`,
      date: accepted?.createdAt ?? null,
      color: 'bg-[#16A34A]',
    })
  }
  if (req.status === 'CANCELED' || req.status === 'CLOSED' || req.status === 'FILLED') {
    timeline.push({ label: `Status atual: ${req.status}`, date: null, color: 'bg-[#64748B]' })
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/solicitacoes">
            <Button variant="outline" size="icon" className="h-9 w-9" aria-label="Voltar">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold font-heading text-[#1E293B]">
                {req.specialtyName} — {req.type}
              </h1>
              {req.urgent && <Badge variant="accent">URGENTE</Badge>}
              <Badge variant={req.status === 'FILLED' ? 'success' : 'secondary'}>{req.status}</Badge>
              {req.moderationStatus === 'HIDDEN' && <Badge variant="danger">OCULTA</Badge>}
            </div>
            <p className="text-xs text-[#64748B] font-mono mt-0.5">
              ID: {req.id} · Clínica: {req.clinicName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setModerateModalOpen(true)} className="text-xs gap-1.5">
            {req.moderationStatus === 'VISIBLE' ? (
              <>
                <EyeOff className="h-4 w-4" /> Ocultar
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" /> Reexibir
              </>
            )}
          </Button>
          {isAdmin && (req.status === 'OPEN' || req.status === 'DRAFT') && (
            <Button variant="destructive" size="sm" onClick={() => setCancelModalOpen(true)} className="text-xs gap-1.5">
              <XCircle className="h-4 w-4" /> Cancelar Solicitação
            </Button>
          )}
        </div>
      </div>

      <Notice notice={notice} />

      {req.moderationStatus === 'HIDDEN' && req.moderationReason && (
        <div className="p-3 rounded-xl bg-[#FEE2E2] border border-[#FECACA] text-xs text-[#DC2626]">
          Motivo da ocultação: {req.moderationReason}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#1E293B]">Linha do Tempo da Oportunidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2E8F0]">
                {timeline.map((step, idx) => (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-6 top-0.5 h-4 w-4 rounded-full ${step.color} ring-4 ring-white`} />
                    <div className="text-xs font-bold text-[#1E293B]">{step.label}</div>
                    {step.date && (
                      <div className="text-[11px] text-[#64748B]">
                        {step.detail ? `${step.detail}: ` : ''}
                        {formatDateTime(step.date)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#1E293B]">
                Profissionais Interessados ({req.interests.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {req.interests.length === 0
                ? EMPTY
                : req.interests.map((i) => (
                    <div
                      key={i.id}
                      className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#1E293B]">{i.vetName}</span>
                          <Badge variant={i.status === 'ACCEPTED' ? 'success' : 'muted'} className="text-[10px]">
                            {i.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-[#64748B]">
                          {i.vetLabel ? `${i.vetLabel} · ` : ''}
                          {formatDateTime(i.createdAt)}
                        </p>
                        {i.message && <p className="text-xs italic text-[#0F766E] mt-1">&ldquo;{i.message}&rdquo;</p>}
                      </div>
                      <Link href={`/usuarios/${i.vetId}`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          Ver Perfil
                        </Button>
                      </Link>
                    </div>
                  ))}
            </CardContent>
          </Card>

          {req.invitations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold text-[#1E293B]">
                  Convidados ({req.invitations.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {req.invitations.map((i) => (
                  <div key={i.id} className="p-3 rounded-lg border border-[#E2E8F0] flex items-center justify-between text-xs">
                    <Link href={`/usuarios/${i.vetId}`} className="font-semibold text-[#0F766E] hover:underline">
                      {i.vetName}
                    </Link>
                    <span className="text-[#64748B]">{formatDateTime(i.createdAt)}</span>
                    <Badge variant="muted">{i.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {req.reviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold text-[#1E293B]">Avaliações do Trabalho</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {req.reviews.map((r) => (
                  <div key={r.id} className="p-3 rounded-lg border border-[#E2E8F0] text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span>
                        <strong>{r.reviewerName}</strong> → <strong>{r.reviewedName}</strong>
                      </span>
                      <span className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="h-3 w-3 fill-amber-500" /> {r.rating}
                        {r.moderationStatus === 'HIDDEN' && (
                          <Badge variant="muted" className="text-[10px] ml-1">OCULTA</Badge>
                        )}
                      </span>
                    </div>
                    {r.comment && <p className="text-[#64748B]">{r.comment}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#1E293B]">Resumo da Oportunidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-1">
                <span className="text-[#94A3B8] block">Clínica Contratante:</span>
                <Link
                  href={`/usuarios/${req.clinicId}`}
                  className="font-bold text-sm text-[#0F766E] hover:underline flex items-center gap-1"
                >
                  <Building2 className="h-4 w-4" /> {req.clinicName}
                </Link>
                {req.city && <span className="text-[#64748B]">{req.city}</span>}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E2E8F0]">
                <div>
                  <span className="text-[#94A3B8] block">Remuneração:</span>
                  <span className="font-bold text-base text-[#16A34A]">{formatRequestPrice(req.price)}</span>
                </div>
                <div>
                  <span className="text-[#94A3B8] block">Alvo Profissional:</span>
                  <span className="font-semibold text-[#1E293B]">
                    {req.targetProfessional === 'VET' ? 'Médico Veterinário' : 'Auxiliar Veterinário'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-[#94A3B8] block">Data do Trabalho:</span>
                  <span className="font-semibold text-[#1E293B]">{formatWorkDate(req.startDate, req.endDate)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E2E8F0] space-y-1">
                <span className="text-[#94A3B8] block">Descrição do Trabalho:</span>
                <p className="text-[#1E293B] text-xs leading-relaxed bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0] whitespace-pre-wrap">
                  {req.description}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#1E293B]">Notas Internas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                maxLength={2000}
                rows={3}
                placeholder="Anotação da equipe sobre esta solicitação..."
                className="w-full p-3 border border-[#E2E8F0] rounded-xl text-sm focus:border-[#0F766E] focus:outline-none"
              />
              <Button size="sm" onClick={handleAddNote} disabled={!newNote.trim() || savingNote} className="gap-1 text-xs">
                <Plus className="h-3.5 w-3.5" /> {savingNote ? 'Salvando...' : 'Adicionar Nota'}
              </Button>
              <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
                {req.notes.length === 0
                  ? EMPTY
                  : req.notes.map((n) => (
                      <div key={n.id} className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs space-y-1">
                        <div className="flex items-center justify-between text-[#64748B]">
                          <span className="font-semibold text-[#1E293B]">{n.authorName}</span>
                          <span>{formatDateTime(n.createdAt)}</span>
                        </div>
                        <p className="text-[#1E293B] whitespace-pre-wrap">{n.body}</p>
                      </div>
                    ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancelRequest}
        title="Cancelar Solicitação em Nome da Clínica"
        description="Esta ação encerrará a solicitação e notificará os profissionais interessados."
        requiredWord="CONFIRMAR"
        destructive={true}
        confirmButtonText="Cancelar Solicitação"
      >
        <label className="flex items-center gap-2 text-sm text-[#1E293B] cursor-pointer">
          <input
            type="checkbox"
            checked={giveCredit}
            onChange={(e) => setGiveCredit(e.target.checked)}
            className="h-4 w-4 rounded"
          />
          Devolver 1 crédito à clínica
        </label>
      </ConfirmModal>

      <ConfirmModal
        isOpen={moderateModalOpen}
        onClose={() => setModerateModalOpen(false)}
        onConfirm={handleToggleModeration}
        title={req.moderationStatus === 'VISIBLE' ? 'Ocultar Solicitação' : 'Reexibir Solicitação'}
        description={
          req.moderationStatus === 'VISIBLE'
            ? 'Ao ocultar, os profissionais não poderão visualizar nem se candidatar a esta solicitação.'
            : 'A solicitação voltará a ser exibida para os profissionais compatíveis.'
        }
        requiredWord="CONFIRMAR"
        destructive={req.moderationStatus === 'VISIBLE'}
        confirmButtonText="Confirmar Alteração"
      />
    </div>
  )
}
