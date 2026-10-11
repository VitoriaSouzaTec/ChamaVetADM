'use client'

import React, { useState } from 'react'
import {
  UserPlus,
  Trash2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ConfirmModal } from '@/components/shared/confirm-modal'
import { Notice, useNotice } from '@/components/shared/notice'
import { unwrap } from '@/lib/action-client'
import { formatDateTime } from '@/lib/format'
import { inviteMember, changeMemberRole, removeMemberAccess } from '@/server/actions/team'
import type { StaffMember } from '@/server/queries/team'
import type { AdminRole } from '@/types/database'

export function TeamView({ members }: { members: StaffMember[] }) {
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<AdminRole>('support')
  const [inviting, setInviting] = useState(false)

  const [removeModalOpen, setRemoveModalOpen] = useState(false)
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [targetMember, setTargetMember] = useState<StaffMember | null>(null)
  const { notice, success, error } = useNotice()

  const adminCount = members.filter((m) => m.role === 'admin').length

  async function handleInvite() {
    if (!inviteEmail.trim() || !inviteName.trim()) return
    setInviting(true)
    const result = await inviteMember(inviteEmail, inviteName, inviteRole)
    setInviting(false)
    if (!result.ok) return error(result.error)
    setInviteModalOpen(false)
    success(`Convite enviado para ${inviteEmail.trim()} com papel ${inviteRole}.`)
    setInviteEmail('')
    setInviteName('')
  }

  async function handleChangeRole(reason: string) {
    if (!targetMember) return
    const nextRole: AdminRole = targetMember.role === 'admin' ? 'support' : 'admin'
    unwrap(await changeMemberRole(targetMember.id, nextRole, reason))
    success(`Papel de ${targetMember.name} alterado para ${nextRole}.`)
  }

  async function handleRemoveAccess(reason: string) {
    if (!targetMember) return
    unwrap(await removeMemberAccess(targetMember.id, reason))
    success(`Acesso de ${targetMember.name} revogado.`)
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

      <Notice notice={notice} />

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
                    {member.invitedPending ? 'Convite pendente' : formatDateTime(member.lastAccess)}
                  </td>

                  <td className="py-3.5 px-4 text-right space-x-2">
                    {!member.isCurrentUser && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={member.role === 'admin' && adminCount <= 1}
                          onClick={() => {
                            setTargetMember(member)
                            setRoleModalOpen(true)
                          }}
                          className="text-xs"
                        >
                          Tornar {member.role === 'admin' ? 'Suporte' : 'Admin'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={member.role === 'admin' && adminCount <= 1}
                          aria-label={`Remover acesso de ${member.name}`}
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
              <Button variant="outline" onClick={() => setInviteModalOpen(false)} disabled={inviting}>
                Cancelar
              </Button>
              <Button
                variant="default"
                onClick={handleInvite}
                disabled={inviting || !inviteEmail.trim() || !inviteName.trim()}
              >
                {inviting ? 'Enviando...' : 'Enviar Convite'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Mudar Papel */}
      <ConfirmModal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        onConfirm={handleChangeRole}
        title="Alterar Papel do Membro"
        description={`${targetMember?.name} passará a ser ${
          targetMember?.role === 'admin' ? 'Suporte' : 'Administrador'
        }. A mudança vale na próxima requisição.`}
        requiredWord="CONFIRMAR"
        destructive={targetMember?.role !== 'admin'}
        confirmButtonText="Alterar Papel"
      />

      {/* Modal: Remover Acesso */}
      <ConfirmModal
        isOpen={removeModalOpen}
        onClose={() => setRemoveModalOpen(false)}
        onConfirm={handleRemoveAccess}
        title="Remover Acesso do Membro"
        description={`O acesso de ${targetMember?.name} (${targetMember?.email}) será revogado: o painel recusa a próxima requisição desse membro.`}
        requiredWord="CONFIRMAR"
        destructive={true}
        confirmButtonText="Revogar Acesso"
      />
    </div>
  )
}
