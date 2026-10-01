'use client'

import React, { useState } from 'react'
import {
  Send,
  CheckCircle,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ConfirmModal } from '@/components/shared/confirm-modal'

export default function ComunicadosPage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [targetRole, setTargetRole] = useState<'ALL' | 'VET' | 'CLINIC' | 'AUXILIAR'>('ALL')
  const [deepLink, setDeepLink] = useState('')
  const [confirmSendOpen, setConfirmSendOpen] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)

  const [history, setHistory] = useState([
    {
      id: 'com-1',
      title: 'Novas ferramentas de busca por raio!',
      body: 'Agora você pode configurar até 50km de distância para receber chamados em tempo real.',
      audience: 'Todos os profissionais em Fortaleza/CE',
      recipients: 340,
      sentAt: '25/09/2026 às 10:00',
    },
    {
      id: 'com-2',
      title: 'Manutenção programada hoje às 23h',
      body: 'A plataforma passará por atualizações de segurança das 23h às 23h30.',
      audience: 'Todos os usuários',
      recipients: 520,
      sentAt: '20/09/2026 às 16:30',
    },
  ])

  // Contagem dinâmica simulada de destinatários
  const estimatedRecipients =
    targetRole === 'ALL'
      ? 540
      : targetRole === 'VET'
      ? 280
      : targetRole === 'CLINIC'
      ? 110
      : 150

  async function handleSendAnnouncement(reason: string) {
    const newEntry = {
      id: `com-${Date.now()}`,
      title,
      body,
      audience: `Público: ${targetRole}`,
      recipients: estimatedRecipients,
      sentAt: 'Agora (Hoje)',
    }
    setHistory([newEntry, ...history])
    setTitle('')
    setBody('')
    setDeepLink('')
    setNotification(
      `Comunicado disparado para ${estimatedRecipients} usuários via notification_outbox e Push! Motivo: ${reason}`
    )
    setTimeout(() => setNotification(null), 4500)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Topo */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-[#1E293B]">
          Comunicados em Massa
        </h1>
        <p className="text-sm text-[#64748B]">
          Envie notificações e mensagens em tempo real para profissionais e clínicas
        </p>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] text-sm flex items-center gap-2 font-medium">
          <CheckCircle className="h-5 w-5" />
          <span>{notification}</span>
        </div>
      )}

      {/* Grid: Formulário + Prévia */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulário (7 colunas) */}
        <div className="lg:col-span-7">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#1E293B]">
                Criar Novo Comunicado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#64748B] uppercase block mb-1">
                  Público-Alvo:
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value as 'ALL' | 'VET' | 'CLINIC' | 'AUXILIAR')}
                  className="w-full p-2.5 rounded-xl border border-[#E2E8F0] text-sm"
                >
                  <option value="ALL">Todos os Usuários (Veterinários, Auxiliares e Clínicas)</option>
                  <option value="VET">Apenas Médicos Veterinários</option>
                  <option value="AUXILIAR">Apenas Auxiliares Veterinários</option>
                  <option value="CLINIC">Apenas Clínicas Contratantes</option>
                </select>
                <span className="text-xs text-[#0F766E] font-medium block mt-1">
                  Destinatários estimados: <strong>{estimatedRecipients} usuários</strong>
                </span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-[#64748B] uppercase">
                    Título do Comunicado (máx 60 caracteres):
                  </label>
                  <span className="text-xs text-[#94A3B8]">{title.length}/60</span>
                </div>
                <Input
                  maxLength={60}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Atualização importante sobre os plantões"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-[#64748B] uppercase">
                    Mensagem (máx 200 caracteres):
                  </label>
                  <span className="text-xs text-[#94A3B8]">{body.length}/200</span>
                </div>
                <textarea
                  maxLength={200}
                  rows={3}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Digite a mensagem que aparecerá na notificação push e na caixa do app..."
                  className="w-full p-3 rounded-xl border border-[#E2E8F0] text-sm focus:border-[#0F766E] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#64748B] uppercase block mb-1">
                  Link Interno (Opcional - Deep Link):
                </label>
                <Input
                  value={deepLink}
                  onChange={(e) => setDeepLink(e.target.value)}
                  placeholder="chamavet://solicitacoes ou https://..."
                />
              </div>

              <div className="pt-2">
                <Button
                  variant="default"
                  onClick={() => setConfirmSendOpen(true)}
                  disabled={!title.trim() || !body.trim()}
                  className="w-full gap-2 font-semibold"
                >
                  <Send className="h-4 w-4" /> Enviar Comunicado para {estimatedRecipients} Usuários
                </Button>
                <p className="text-[11px] text-[#94A3B8] text-center mt-2">
                  Regra de segurança: Limite de 1 comunicado por dia para o mesmo público.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Prévia da Notificação no Celular (5 colunas) */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#1E293B]">
                Prévia da Notificação (Push / App)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-[#1E293B] p-4 rounded-2xl text-white space-y-3 shadow-lg">
                <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                  <div className="flex items-center gap-1.5">
                    <div className="h-4 w-4 rounded-sm bg-[#0F766E] flex items-center justify-center text-[10px]">
                      🐾
                    </div>
                    <span className="font-semibold text-white">ChamaVet</span>
                  </div>
                  <span>Agora</span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-white">
                    {title || 'Título da notificação aparecerá aqui'}
                  </h4>
                  <p className="text-xs text-[#CBD5E1] leading-relaxed">
                    {body || 'A mensagem completa do comunicado será exibida aqui para o usuário.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Histórico */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#1E293B]">
                Últimos Comunicados Disparados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {history.map((h) => (
                <div key={h.id} className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1E293B]">{h.title}</span>
                    <Badge variant="secondary" className="text-[10px]">{h.recipients} envios</Badge>
                  </div>
                  <p className="text-[#64748B]">{h.body}</p>
                  <span className="text-[10px] text-[#94A3B8] block">{h.sentAt}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal: Confirmação Forte de Envio */}
      <ConfirmModal
        isOpen={confirmSendOpen}
        onClose={() => setConfirmSendOpen(false)}
        onConfirm={handleSendAnnouncement}
        title="Confirmar Disparo em Massa"
        description={`O comunicado será enviado imediatamente para ${estimatedRecipients} usuários cadastrados.`}
        requiredWord="CONFIRMAR"
        destructive={false}
        confirmButtonText="Confirmar Disparo"
      />
    </div>
  )
}
