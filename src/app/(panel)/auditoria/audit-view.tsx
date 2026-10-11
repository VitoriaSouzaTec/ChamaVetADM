'use client'

import React, { useState } from 'react'
import {
  Search,
  Eye,
  Lock,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/format'
import type { AuditItem } from '@/types/admin'

export function AuditView({ logs, isAdmin }: { logs: AuditItem[]; isAdmin: boolean }) {
  const [search, setSearch] = useState('')
  const [selectedLog, setSelectedLog] = useState<AuditItem | null>(null)

  const q = search.toLowerCase()
  const filteredLogs = logs.filter((l) =>
    [l.actorName, l.action, l.entity, l.entityId ?? '', l.reason ?? ''].some((v) => v.toLowerCase().includes(q))
  )

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-heading text-[#1E293B]">
              Trilha de Auditoria (audit_logs)
            </h1>
            <Badge variant="outline" className="gap-1 text-xs">
              <Lock className="h-3 w-3 text-[#16A34A]" /> Imutável
            </Badge>
          </div>
          <p className="text-sm text-[#64748B]">
            {isAdmin
              ? 'Registro permanente de todas as operações administrativas e visualizações de dados sensíveis (últimos 200)'
              : 'Suas ações registradas no painel (últimas 200)'}
          </p>
        </div>
      </div>

      {/* Busca e Filtros */}
      <Card className="shadow-xs">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#94A3B8]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por operador, ação, alvo ou justificativa..."
              className="pl-9 h-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Logs */}
      <Card className="shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-bold text-[#64748B] uppercase">
              <tr>
                <th className="py-3 px-4">Data / Hora</th>
                <th className="py-3 px-4">Operador</th>
                <th className="py-3 px-4">Ação</th>
                <th className="py-3 px-4">Alvo</th>
                <th className="py-3 px-4">Justificativa Obrigatória</th>
                <th className="py-3 px-4 text-right">Detalhe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-[#94A3B8]">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              )}
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F8FAFC]">
                  <td className="py-3 px-4 text-xs font-mono text-[#64748B] whitespace-nowrap">
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td className="py-3 px-4 text-xs">
                    <span className="font-semibold text-[#1E293B] block">{log.actorName}</span>
                    <span className="text-[10px] uppercase font-mono text-[#0F766E]">{log.actorRole}</span>
                  </td>
                  <td className="py-3 px-4 text-xs font-mono font-bold text-[#1E293B]">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 text-xs text-[#1E293B]">
                    {log.entity}
                    {log.entityId && <span className="block font-mono text-[10px] text-[#94A3B8]">{log.entityId}</span>}
                  </td>
                  <td className="py-3 px-4 text-xs text-[#64748B] max-w-xs truncate">
                    {log.reason ? <>&ldquo;{log.reason}&rdquo;</> : '-'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedLog(log)}
                      className="text-xs gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" /> Ver Diff
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal / Visualizador de Diff (Before vs After) */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 border border-[#E2E8F0] shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-lg text-[#1E293B] font-heading">
                  Detalhes do Registro
                </h3>
                <p className="text-xs text-[#64748B]">
                  {formatDateTime(selectedLog.createdAt)} por {selectedLog.actorName} ({selectedLog.actorRole})
                </p>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {selectedLog.action}
              </Badge>
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded-xl text-xs space-y-1">
              <span className="text-[#94A3B8] block">Justificativa Registrada:</span>
              <p className="font-semibold text-[#1E293B]">{selectedLog.reason ? `“${selectedLog.reason}”` : 'Sem motivo registrado.'}</p>
              <span className="text-[#94A3B8] block pt-1">Alvo: {selectedLog.entity} {selectedLog.entityId ?? ''}</span>
            </div>

            {/* Comparador Side by Side */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-[#64748B] tracking-wider">
                Comparação de Estados (Before vs After)
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-[#FEE2E2]/30 border border-[#FECACA]">
                  <span className="font-bold text-[#DC2626] block mb-2">Estado Anterior (Before):</span>
                  <pre className="text-[11px] whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.before, null, 2)}
                  </pre>
                </div>
                <div className="p-3 rounded-xl bg-[#DCFCE7]/30 border border-[#BBF7D0]">
                  <span className="font-bold text-[#16A34A] block mb-2">Novo Estado (After):</span>
                  <pre className="text-[11px] whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.after, null, 2)}
                  </pre>
                </div>
              </div>
              {selectedLog.metadata != null && (
                <pre className="text-[11px] whitespace-pre-wrap p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] font-mono">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setSelectedLog(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
