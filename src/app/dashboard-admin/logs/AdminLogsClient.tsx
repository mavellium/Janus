'use client'

import { useState, useTransition } from 'react'
import { Shield, AlertTriangle, Loader2, Clock } from 'lucide-react'
import { unblockIp } from '@/modules/admin/actions/unblockIp'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { ToastContainer } from '@/components/ui/toast-container'

interface LoginLog {
  id: string
  ip: string
  email: string | null
  createdAt: Date
}

interface BlockedIp {
  ip: string
  count: number
  lastAttempt: Date
  emails: string[]
}

export function AdminLogsClient({
  logs,
  blockedIps,
}: {
  logs: LoginLog[]
  blockedIps: BlockedIp[]
}) {
  const [unblocking, setUnblocking] = useState<string | null>(null)
  const [localBlockedIps, setLocalBlockedIps] = useState(blockedIps)
  const [, startTransition] = useTransition()
  const { toasts, toast, removeToast } = useToast()

  function handleUnblock(ip: string) {
    setUnblocking(ip)
    startTransition(async () => {
      const result = await unblockIp(ip)
      if (result.ok) {
        setLocalBlockedIps((prev) => prev.filter((b) => b.ip !== ip))
        toast({ message: `IP ${ip} desbloqueado com sucesso`, type: 'success' })
      } else {
        toast({ message: result.error || 'Erro ao desbloquear IP', type: 'error' })
      }
      setUnblocking(null)
    })
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-text">Logs de Segurança</h1>
        <p className="text-sm text-brand-muted mt-1">
          Tentativas de login e IPs bloqueados por atividade suspeita
        </p>
      </div>

      <Tabs defaultValue="blocked">
        <TabsList className="mb-4">
          <TabsTrigger value="blocked" className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            IPs Bloqueados
            {localBlockedIps.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground">
                {localBlockedIps.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            Tentativas Recentes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blocked">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {localBlockedIps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Shield className="w-10 h-10 text-brand-muted opacity-40" />
                <p className="text-sm text-brand-muted">Nenhum IP bloqueado no momento</p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">IP</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Tentativas</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Emails Tentados</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Última Tentativa</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {localBlockedIps.map((blocked) => (
                    <tr key={blocked.ip} className="hover:bg-brand-btn-light/30 transition">
                      <td className="px-5 py-4">
                        <code className="text-sm font-mono text-brand-text">{blocked.ip}</code>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-destructive/10 text-destructive">
                          {blocked.count}×
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-0.5">
                          {blocked.emails.slice(0, 3).map((email) => (
                            <span key={email} className="text-xs text-brand-muted">{email}</span>
                          ))}
                          {blocked.emails.length > 3 && (
                            <span className="text-xs text-brand-muted">+{blocked.emails.length - 3} mais</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-brand-muted">
                        {new Date(blocked.lastAttempt).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={unblocking === blocked.ip}
                          onClick={() => handleUnblock(blocked.ip)}
                        >
                          {unblocking === blocked.ip && <Loader2 className="w-3 h-3 animate-spin mr-1.5" />}
                          Desbloquear
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Clock className="w-10 h-10 text-brand-muted opacity-40" />
                <p className="text-sm text-brand-muted">Nenhuma tentativa registrada</p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">IP</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">E-mail Tentado</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Data/Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-brand-btn-light/30 transition">
                      <td className="px-5 py-4">
                        <code className="text-sm font-mono text-brand-text">{log.ip}</code>
                      </td>
                      <td className="px-5 py-4 text-sm text-brand-muted">
                        {log.email || '—'}
                      </td>
                      <td className="px-5 py-4 text-sm text-brand-muted">
                        {new Date(log.createdAt).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
