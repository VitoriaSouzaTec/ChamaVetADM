'use client'

import React, { useState, use } from 'react'
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
  Check,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmModal } from '@/components/shared/confirm-modal'
import { MOCK_USERS, type UserItem } from '@/server/mock-data'
import { maskPhone, maskEmail, formatDate, formatDateTime } from '@/lib/format'

export default function UsuarioDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const userId = resolvedParams.id

  const initialUser =
    MOCK_USERS.find((u) => u.id === userId) || MOCK_USERS[0]

  const [user, setUser] = useState<UserItem>(initialUser)
  const [activeTab, setActiveTab] = useState<
    'resumo' | 'atividade' | 'financeiro' | 'avaliacoes' | 'denuncias' | 'documentos' | 'notas' | 'historico'
  >('resumo')

  const [showFullPhone, setShowFullPhone] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)

  // Modais de Ação
  const [suspendModalOpen, setSuspendModalOpen] = useState(false)
  const [banModalOpen, setBanModalOpen] = useState(false)
  const [reactivateModalOpen, setReactivateModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [creditsModalOpen, setCreditsModalOpen] = useState(false)
  const [creditAmount, setCreditAmount] = useState(1)

  // Notas Internas
  const [notes, setNotes] = useState([
    { id: 'n-1', author: 'Mariana (Suporte)', date: '30/09/2026 11:20', text: 'Usuário entrou em contato pelo WhatsApp solicitando orientações para envio da carteira CRMV.' },
  ])
  const [newNote, setNewNote] = useState('')

  function showSuccess(msg: string) {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  async function handleSuspend(reason: string) {
    setUser((prev) => ({
      ...prev,
      status: 'SUSPENDED',
      suspendedUntil: '07/10/2026',
      suspensionReason: reason,
    }))
    showSuccess(`Usuário suspenso por 7 dias. Motivo: ${reason} (Auditado)`)
  }

  async function handleBan(reason: string) {
    setUser((prev) => ({
      ...prev,
      status: 'BANNED',
      suspensionReason: reason,
    }))
    showSuccess(`Usuário banido permanentemente da plataforma. Motivo: ${reason}`)
  }

  async function handleReactivate(reason: string) {
    setUser((prev) => ({
      ...prev,
      status: 'ACTIVE',
      suspendedUntil: undefined,
      suspensionReason: undefined,
    }))
    showSuccess(`Conta reativada com sucesso. Motivo: ${reason}`)
  }

  async function handleDeleteAccount(reason: string) {
    setUser((prev) => ({
      ...prev,
      status: 'DELETED',
    }))
    showSuccess(`Conta do usuário excluída sob diretrizes da LGPD. Motivo: ${reason}`)
  }

  function handleAddNote() {
    if (!newNote.trim()) return
    setNotes((prev) => [
      {
        id: `n-${Date.now()}`,
        author: 'Carlos (Admin)',
        date: formatDateTime(new Date()),
        text: newNote.trim(),
      },
      ...prev,
    ])
    setNewNote('')
    showSuccess('Nota interna registrada com sucesso.')
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Voltar e Título */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/usuarios">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
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
              ID: {user.id} · {user.identifier} · {user.city}/{user.state}
            </p>
          </div>
        </div>

        {/* Menu de Ações Administrativas */}
        <div className="flex flex-wrap items-center gap-2">
          {user.status === 'ACTIVE' ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSuspendModalOpen(true)}
                className="text-xs text-[#F97316] hover:bg-[#FFEDD5] border-[#FED7AA]"
              >
                <ShieldAlert className="h-3.5 w-3.5 mr-1" /> Suspender
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBanModalOpen(true)}
                className="text-xs"
              >
                <Ban className="h-3.5 w-3.5 mr-1" /> Banir
              </Button>
            </>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => setReactivateModalOpen(true)}
              className="text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reativar Conta
            </Button>
          )}

          {user.role === 'CLINIC' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreditsModalOpen(true)}
              className="text-xs"
            >
              <Gift className="h-3.5 w-3.5 mr-1" /> Dar Créditos
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => showSuccess('Download dos dados do usuário (LGPD) gerado em JSON.')}
            className="text-xs text-[#64748B]"
          >
            <Download className="h-3.5 w-3.5 mr-1" /> Exportar LGPD
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteModalOpen(true)}
            className="text-xs text-[#DC2626] hover:bg-[#FEE2E2]"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir Conta
          </Button>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] text-sm flex items-center gap-2 font-medium">
          <Check className="h-5 w-5" />
          <span>{notification}</span>
        </div>
      )}

      {/* Navegação de Abas (8 Abas conforme seção 6.3) */}
      <div className="flex items-center gap-1 border-b border-[#E2E8F0] overflow-x-auto pb-1 text-xs font-semibold">
        {[
          { key: 'resumo', label: '1. Resumo', icon: User },
          { key: 'atividade', label: '2. Atividade', icon: Activity },
          { key: 'financeiro', label: '3. Financeiro', icon: CreditCard },
          { key: 'avaliacoes', label: '4. Avaliações', icon: Star },
          { key: 'denuncias', label: '5. Denúncias', icon: AlertTriangle },
          { key: 'documentos', label: '6. Documentos', icon: FileText },
          { key: 'notas', label: '7. Notas Internas', icon: StickyNote },
          { key: 'historico', label: '8. Histórico Auditado', icon: History },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'resumo' | 'atividade' | 'financeiro' | 'avaliacoes' | 'denuncias' | 'documentos' | 'notas' | 'historico')}
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

      {/* Conteúdo das Abas */}
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
                  <div>
                    <span className="text-xs text-[#94A3B8] block">Nome Completo:</span>
                    <span className="font-semibold text-[#1E293B]">{user.fullName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#94A3B8] block">Documento:</span>
                    <span className="font-mono font-semibold text-[#1E293B]">{user.identifier}</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#94A3B8] block">E-mail:</span>
                    <span className="font-mono text-[#1E293B]">{maskEmail(user.email)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#94A3B8] block">Telefone:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[#1E293B]">
                        {showFullPhone ? user.phone : maskPhone(user.phone)}
                      </span>
                      <button
                        onClick={() => {
                          setShowFullPhone(!showFullPhone)
                          showSuccess('Visualização do telefone completo registrada na auditoria.')
                        }}
                        className="text-xs text-[#0F766E] underline flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        {showFullPhone ? 'Ocultar' : 'Mostrar (Auditado)'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-[#94A3B8] block">Cidade / UF:</span>
                    <span className="text-[#1E293B]">{user.city} - {user.state}</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#94A3B8] block">Onboarding Completo:</span>
                    <span className="text-[#16A34A] font-semibold">Sim ✓</span>
                  </div>
                </div>

                {user.suspensionReason && (
                  <div className="p-4 rounded-xl bg-[#FEE2E2] border border-[#FECACA] text-xs space-y-1">
                    <span className="font-bold text-[#DC2626] block">
                      Motivo da Suspensão / Punição:
                    </span>
                    <p className="text-[#DC2626]">{user.suspensionReason}</p>
                    {user.suspendedUntil && (
                      <span className="text-[#991B1B] font-semibold block mt-1">
                        Suspenso até: {user.suspendedUntil}
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
                    <div className="text-2xl font-bold text-[#1E293B]">{user.ratingAvg}</div>
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
                Histórico Recente de Atividades e Trabalhos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
                  <div>
                    <h5 className="font-semibold text-sm text-[#1E293B]">Plantão Noturno 12h</h5>
                    <p className="text-xs text-[#64748B]">Hospital Veterinário 24h Amigo Fiel · 29/09/2026</p>
                  </div>
                  <Badge variant="success">FILLED / Concluído</Badge>
                </div>
                <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
                  <div>
                    <h5 className="font-semibold text-sm text-[#1E293B]">Atendimento de Ultrassonografia</h5>
                    <p className="text-xs text-[#64748B]">Clínica Veterinária PetCare Aldeota · 25/09/2026</p>
                  </div>
                  <Badge variant="success">FILLED / Concluído</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Aba 3: Financeiro */}
        {activeTab === 'financeiro' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#1E293B]">
                Situação Financeira e Assinatura
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                  <span className="text-xs text-[#94A3B8] block">Status da Assinatura:</span>
                  <span className="text-lg font-bold text-[#0F766E]">
                    {user.subscriptionStatus || 'TRIAL (Teste Grátis)'}
                  </span>
                </div>
                <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                  <span className="text-xs text-[#94A3B8] block">Saldo de Créditos:</span>
                  <span className="text-lg font-bold text-[#1E293B]">
                    {user.credits || 0} publicações
                  </span>
                </div>
                <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                  <span className="text-xs text-[#94A3B8] block">Total Transacionado:</span>
                  <span className="text-lg font-bold text-[#16A34A]">R$ 1.250,00</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Aba 4: Avaliações */}
        {activeTab === 'avaliacoes' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#1E293B]">
                Avaliações Recebidas ({user.ratingCount})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1E293B]">PetCare Aldeota</span>
                  <div className="flex items-center text-amber-500 text-xs font-bold">
                    <Star className="h-3 w-3 fill-amber-500 mr-1" /> 5.0
                  </div>
                </div>
                <p className="text-xs text-[#64748B]">Profissional impecável, super pontual e atencioso com a equipe cirúrgica.</p>
                <span className="text-[10px] text-[#94A3B8] block">25/09/2026</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Aba 5: Denúncias */}
        {activeTab === 'denuncias' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#1E293B]">
                Denúncias Vinculadas a este Usuário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-xl border border-[#FECACA] bg-[#FEE2E2]/40 flex items-start justify-between">
                <div>
                  <Badge variant="danger" className="text-[10px]">NO_SHOW</Badge>
                  <p className="text-xs font-semibold text-[#1E293B] mt-1">
                    Não comparecimento em plantão hospitalar confirmado
                  </p>
                  <p className="text-xs text-[#64748B] mt-0.5">Denunciante: Hospital 24h Amigo Fiel · 28/09/2026</p>
                </div>
                <Link href="/denuncias">
                  <Button variant="outline" size="sm" className="text-xs">
                    Ver Denúncia
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Aba 6: Documentos */}
        {activeTab === 'documentos' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#1E293B]">
                Documentos Comprobatórios (Bucket Privado)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#0F766E]" />
                  <span className="text-sm font-medium text-[#1E293B]">Carteira_CRMV_Oficial.pdf</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => showSuccess('URL assinada de 5 minutos gerada com sucesso.')}
                  className="text-xs"
                >
                  Gerar Link Assinado
                </Button>
              </div>
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
                  placeholder="Adicione um comentário ou histórico sobre o atendimento deste usuário..."
                  rows={3}
                  className="w-full p-3 border border-[#E2E8F0] rounded-xl text-sm focus:border-[#0F766E] focus:outline-none"
                />
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="gap-1 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar Nota
                </Button>
              </div>

              <div className="space-y-3 pt-3 border-t border-[#E2E8F0]">
                {notes.map((note) => (
                  <div key={note.id} className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs space-y-1">
                    <div className="flex items-center justify-between text-[#64748B]">
                      <span className="font-semibold text-[#1E293B]">{note.author}</span>
                      <span>{note.date}</span>
                    </div>
                    <p className="text-[#1E293B]">{note.text}</p>
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
                Trilha de Auditoria Imutável (audit_logs)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-lg border border-[#E2E8F0] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#1E293B]">admin_suspend_user</span>
                    <p className="text-[#64748B]">Operador: Carlos (Admin) · Motivo: Reincidência em no-show</p>
                  </div>
                  <span className="text-[#94A3B8]">30/09/2026 12:40</span>
                </div>
                <div className="p-3 rounded-lg border border-[#E2E8F0] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#1E293B]">admin_view_sensitive_data</span>
                    <p className="text-[#64748B]">Operador: Mariana (Suporte) · Telefone completo visualizado</p>
                  </div>
                  <span className="text-[#94A3B8]">29/09/2026 17:15</span>
                </div>
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
        description={`A conta de ${user.fullName} será suspensa por 7 dias. O usuário receberá a tela 'Conta Suspensa' no app.`}
        requiredWord="CONFIRMAR"
        destructive={true}
        confirmButtonText="Confirmar Suspensão"
      />

      {/* Modal: Banir Usuário */}
      <ConfirmModal
        isOpen={banModalOpen}
        onClose={() => setBanModalOpen(false)}
        onConfirm={handleBan}
        title="Banir Usuário Permanentemente"
        description={`Atenção: Ao banir ${user.fullName}, todas as solicitações abertas serão canceladas e as candidaturas retiradas.`}
        requiredWord={user.fullName}
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

      {/* Modal: Excluir Conta LGPD */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Excluir Conta Permanentemente (LGPD)"
        description={`A exclusão de conta é irreversível. Digite ${user.email} para confirmar.`}
        requiredWord={user.email}
        destructive={true}
        confirmButtonText="Excluir Definitivamente"
      />

      {/* Modal: Conceder Créditos */}
      {creditsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#E2E8F0] shadow-xl">
            <h3 className="text-lg font-bold font-heading text-[#1E293B]">
              Conceder Créditos de Publicação
            </h3>
            <p className="text-sm text-[#64748B]">
              Adicione publicações gratuitas para a clínica {user.fullName}.
            </p>
            <div>
              <label className="text-xs font-bold text-[#64748B] uppercase">Quantidade de Créditos:</label>
              <input
                type="number"
                min="1"
                max="50"
                value={creditAmount}
                onChange={(e) => setCreditAmount(Number(e.target.value))}
                className="w-full mt-1 p-2.5 border border-[#E2E8F0] rounded-xl text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCreditsModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  setUser((prev) => ({
                    ...prev,
                    credits: (prev.credits || 0) + creditAmount,
                  }))
                  setCreditsModalOpen(false)
                  showSuccess(`${creditAmount} crédito(s) concedido(s) com sucesso.`)
                }}
              >
                Conceder
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
