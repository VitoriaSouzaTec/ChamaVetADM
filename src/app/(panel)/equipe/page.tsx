'use client'

import React, { useState } from 'react'
import {
  UserPlus,
  Trash2,
  CheckCircle,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ConfirmModal } from '@/components/shared/confirm-modal'
import type { AdminRole } from '@/types/database'

interface StaffMember {
  id: string
  name: string
  email: string
  role: AdminRole
  mfaActive: boolean
  lastAccess: string
  isCurrentUser?: boolean
}

export default function EquipePage() {
  const [members, setMembers] = useState<StaffMember[]>([
    {
      id: 'staff-1',
      name: 'Carlos (Fundador)',
      email: 'carlos@chamavet.com.br',
      role: 'admin',
      mfaActive: true,
      lastAccess: '30/09/2026 15:50',
      isCurrentUser: true,
    },
    {
      id: 'staff-2',
      name: 'Mariana Duarte',
      email: 'mariana.suporte@chamavet.com.br',
      role: 'support',
      mfaActive: true,
      lastAccess: '30/09/2026 14:12',
    },
    {
      id: 'staff-3',
      name: 'Pedro Henrique',
      email: 'pedro.atendimento@chamavet.com.br',
      role: 'support',
      mfaActive: false,
      lastAccess: '28/09/2026 09:30',
    },
  ])

  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<AdminRole>('support')

  const [removeModalOpen, setRemoveModalOpen] = useState(false)
  const [targetMember, setTargetMember] = useState<StaffMember | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  function showSuccess(msg: string) {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  function handleInvite() {
    if (!inviteEmail.trim() || !inviteName.trim()) return
    const newMember: StaffMember = {
      id: `staff-${Date.now()}`,
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      mfaActive: false,
      lastAccess: 'Convite enviado (Pendente)',
    }
    setMembers([...members, newMember])
    setInviteModalOpen(false)
    setInviteEmail('')
    setInviteName('')
    showSuccess(`Convite enviado com sucesso para ${newMember.email} com papel de ${newMember.role}.`)
  }

  function handleToggleRole(member: StaffMember) {
    const adminCount = members.filter((m) => m.role === 'admin').length
    if (member.role === 'admin' && adminCount <= 1) {
      alert('Operação bloqueada: A plataforma deve possuir pelo menos 1 Administrador ativo.')
      return
    }

    const nextRole: AdminRole = member.role === 'admin' ? 'support' : 'admin'
    setMembers((prev) =>
      prev.map((m) => (m.id === member.id ? { ...m, role: nextRole } : m))
    )
    showSuccess(`Papel de ${member.name} alterado para ${nextRole}.`)
  }

  async function handleRemoveAccess(reason: string) {
    if (!targetMember) return
    const adminCount = members.filter((m) => m.role === 'admin').length
    if (targetMember.role === 'admin' && adminCount <= 1) {
      throw new Error('Não é possível remover o único administrador do sistema.')
    }

    setMembers((prev) => prev.filter((m) => m.id !== targetMember.id))
    showSuccess(`Acesso de ${targetMember.name} revogado com sucesso. Motivo: ${reason}`)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#1E293B]">
            Gestão da Equipe Interna
          </h1>
          <p className="text-sm text-[#64748B]">
            Controle de acessos administrativos, atribuição de papéis e status de segurança MFA
          </p>
        </div>

        <Button
          variant="default"
          onClick={() => setInviteModalOpen(true)}
          className="gap-2 text-xs font-semibold cursor-pointer"
        >
          <UserPlus className="h-4 w-4" /> Convidar Membro
        </Button>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] text-sm flex items-center gap-2 font-medium">
          <CheckCircle className="h-5 w-5" />
          <span>{notification}</span>
        </div>
      )}

      {/* Tabela de Membros */}
      <Card className="shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-bold text-[#64748B] uppercase">
              <tr>
                <th className="py-3 px-4">Nome / Usuário</th>
                <th className="py-3 px-4">E-mail Corporativo</th>
                <th className="py-3 px-4">Papel Atual</th>
                <th className="py-3 px-4">MFA (TOTP)</th>
                <th className="py-3 px-4">Último Acesso</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-[#F8FAFC]">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center font-bold text-xs">
                        {member.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-[#1E293B] block">{member.name}</span>
                        {member.isCurrentUser && (
                          <span className="text-[10px] text-[#0F766E] font-semibold">(Você)</span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-xs font-mono text-[#64748B]">
                    {member.email}
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                      {member.role === 'admin' ? 'Administrador' : 'Suporte / Moderação'}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge variant={member.mfaActive ? 'success' : 'danger'} className="text-[10px]">
                      {member.mfaActive ? 'MFA Ativo ✓' : 'Pendente (AAL1)'}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4 text-xs text-[#64748B]">
                    {member.lastAccess}
                  </td>

                  <td className="py-3.5 px-4 text-right space-x-2">
                    {!member.isCurrentUser && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleRole(member)}
                          className="text-xs"
                        >
                          Tornar {member.role === 'admin' ? 'Suporte' : 'Admin'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setTargetMember(member)
                            setRemoveModalOpen(true)
                          }}
                          className="text-xs text-[#DC2626] hover:bg-[#FEE2E2]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Convidar Membro */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#E2E8F0] shadow-xl">
            <h3 className="text-lg font-bold font-heading text-[#1E293B]">
              Convidar Membro para a Equipe
            </h3>
            <p className="text-sm text-[#64748B]">
              O colaborador receberá o convite por e-mail e configurará o MFA no 1º acesso.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#64748B] uppercase block mb-1">
                  Nome Completo:
                </label>
                <Input
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Nome do operador..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#64748B] uppercase block mb-1">
                  E-mail Corporativo:
                </label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colaborador@chamavet.com.br"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#64748B] uppercase block mb-1">
                  Papel de Acesso:
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as AdminRole)}
                  className="w-full p-2.5 rounded-xl border border-[#E2E8F0] text-sm"
                >
                  <option value="support">Suporte (Atendimento, Verificações e Moderação)</option>
                  <option value="admin">Administrador (Acesso Total, Financeiro e Configurações)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setInviteModalOpen(false)}>
                Cancelar
              </Button>
              <Button variant="default" onClick={handleInvite}>
                Enviar Convite
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Remover Acesso */}
      <ConfirmModal
        isOpen={removeModalOpen}
        onClose={() => setRemoveModalOpen(false)}
        onConfirm={handleRemoveAccess}
        title="Remover Acesso do Membro"
        description={`O acesso de ${targetMember?.name} (${targetMember?.email}) será revogado imediatamente e todas as sessões ativas serão encerradas.`}
        requiredWord="CONFIRMAR"
        destructive={true}
        confirmButtonText="Revogar Acesso"
      />
    </div>
  )
}
