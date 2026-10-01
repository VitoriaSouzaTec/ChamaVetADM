'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Filter,
  Download,
  Star,
  Eye,
  Building2,
  Stethoscope,
  HeartHandshake,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { MOCK_USERS, type UserItem } from '@/server/mock-data'
import { maskPhone, maskEmail, formatDate } from '@/lib/format'

export default function UsuariosPage() {
  const [users] = useState<UserItem[]>(MOCK_USERS)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [unmaskedPhones, setUnmaskedPhones] = useState<Record<string, boolean>>({})

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.identifier.toLowerCase().includes(search.toLowerCase()) ||
      u.city.toLowerCase().includes(search.toLowerCase())

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter

    return matchesSearch && matchesRole && matchesStatus
  })

  function togglePhone(id: string) {
    setUnmaskedPhones((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  function handleExportCSV() {
    alert('Relatório de usuários gerado em CSV (Ação registrada na auditoria).')
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#1E293B]">
            Gestão de Usuários
          </h1>
          <p className="text-sm text-[#64748B]">
            Consulte e gerencie contas de veterinários, auxiliares e clínicas
          </p>
        </div>

        <Button
          variant="outline"
          onClick={handleExportCSV}
          className="gap-2 text-xs font-semibold cursor-pointer"
        >
          <Download className="h-4 w-4" /> Exportar Lista (CSV)
        </Button>
      </div>

      {/* Barra de Filtros e Busca */}
      <Card className="shadow-xs">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#94A3B8]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, e-mail, telefone, CRMV ou CNPJ..."
              className="pl-9 h-10 w-full"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-[#64748B] shrink-0">
              <Filter className="h-3.5 w-3.5" /> Filtrar:
            </div>
            {/* Papel */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-10 text-xs px-3 rounded-lg border border-[#E2E8F0] bg-white text-[#1E293B] focus:border-[#0F766E] focus:outline-none"
            >
              <option value="ALL">Todos os Papéis</option>
              <option value="VET">Veterinários</option>
              <option value="AUXILIAR">Auxiliares</option>
              <option value="CLINIC">Clínicas</option>
            </select>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 text-xs px-3 rounded-lg border border-[#E2E8F0] bg-white text-[#1E293B] focus:border-[#0F766E] focus:outline-none"
            >
              <option value="ALL">Todos os Status</option>
              <option value="ACTIVE">Ativo</option>
              <option value="SUSPENDED">Suspenso</option>
              <option value="BANNED">Banido</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Usuários */}
      <Card className="shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-bold text-[#64748B] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Usuário / Nome</th>
                <th className="py-3 px-4">Papel</th>
                <th className="py-3 px-4">Contato</th>
                <th className="py-3 px-4">Verificação</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Avaliação</th>
                <th className="py-3 px-4">Cadastro</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center font-bold text-xs shrink-0">
                          {user.role === 'CLINIC' ? (
                            <Building2 className="h-4 w-4" />
                          ) : user.role === 'VET' ? (
                            <Stethoscope className="h-4 w-4" />
                          ) : (
                            <HeartHandshake className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/usuarios/${user.id}`}
                            className="font-bold text-[#1E293B] hover:text-[#0F766E] transition-colors block"
                          >
                            {user.fullName}
                          </Link>
                          <span className="text-xs text-[#64748B] font-mono">
                            {user.identifier} · {user.city}/{user.state}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant="outline" className="font-semibold text-xs">
                        {user.role}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-xs space-y-0.5">
                      <div className="text-[#64748B]">{maskEmail(user.email)}</div>
                      <div className="flex items-center gap-1 font-mono text-[#1E293B]">
                        <span>
                          {unmaskedPhones[user.id] ? user.phone : maskPhone(user.phone)}
                        </span>
                        <button
                          onClick={() => togglePhone(user.id)}
                          className="text-[#94A3B8] hover:text-[#0F766E] p-0.5"
                          title="Mostrar telefone completo (auditado)"
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          user.verificationStatus === 'VERIFIED'
                            ? 'success'
                            : user.verificationStatus === 'PENDING'
                            ? 'accent'
                            : user.verificationStatus === 'REJECTED'
                            ? 'danger'
                            : 'muted'
                        }
                      >
                        {user.verificationStatus}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4">
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
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-xs font-semibold text-[#1E293B]">
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        <span>{user.ratingAvg}</span>
                        <span className="text-[11px] font-normal text-[#94A3B8]">
                          ({user.ratingCount})
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-[#64748B]">
                      {formatDate(user.createdAt)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link href={`/usuarios/${user.id}`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          Gerenciar
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-sm text-[#94A3B8]">
                    Nenhum usuário encontrado com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
