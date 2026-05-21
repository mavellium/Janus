'use client'

import { useTransition, useState } from 'react'
import { AlertTriangle, Loader2, Users, KeyRound, ArrowLeft, Shield } from 'lucide-react'
import { stopImpersonation } from '@/modules/auth/actions/stopImpersonation'
import { ImpersonationSelector } from './ImpersonationSelector'
import { UserPermissionsModal } from './UserPermissionsModal'

interface Props {
  companySlug: string
  impersonatedUserName: string | null
  isImpersonating: boolean
  companyUsers: Array<{ id: string; name: string | null; email: string; role: string }>
  realUserRole: 'ADMIN' | 'DEVELOPER'
  impersonatedUserId: string | null
  impersonatedUserEmail: string | null
  impersonatedUserPermissions?: string | string[] | Record<string, Record<string, string[]>>
  returnUrl?: string | null
}

export function ImpersonationBanner({
  companySlug,
  impersonatedUserName,
  isImpersonating,
  companyUsers,
  realUserRole,
  impersonatedUserId,
  impersonatedUserEmail,
  impersonatedUserPermissions,
  returnUrl,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [showSelector, setShowSelector] = useState(false)
  const [showPermissions, setShowPermissions] = useState(false)

  function handleBackToPanel() {
    startTransition(async () => {
      await stopImpersonation(returnUrl ?? undefined)
    })
  }

  return (
    <>
      {isImpersonating && (
        <div className="sticky top-0 z-50 w-full bg-destructive text-destructive-foreground px-4 py-2.5 flex items-center justify-between gap-3 text-sm font-medium shadow-md">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="truncate">
              Atenção: Você está visualizando o sistema simulando o usuário: <strong>{impersonatedUserName}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {impersonatedUserId && (
              <button
                onClick={() => setShowPermissions(true)}
                className="p-1.5 rounded text-xs font-semibold bg-destructive-foreground/20 hover:bg-destructive-foreground/30 transition"
                title="Editar permissões do usuário"
              >
                <KeyRound className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={async () => {
                await stopImpersonation(false)
                window.location.reload()
              }}
              className="p-1.5 rounded text-xs font-semibold bg-destructive-foreground/20 hover:bg-destructive-foreground/30 transition"
              title={`Ver como ${realUserRole === 'ADMIN' ? 'Admin' : 'Desenvolvedor'}`}
            >
              <Shield className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowSelector(true)}
              className="px-3 py-1 rounded text-xs font-semibold bg-destructive-foreground/20 hover:bg-destructive-foreground/30 transition"
            >
              Trocar
            </button>
            <button
              onClick={handleBackToPanel}
              disabled={isPending}
              className="px-3 py-1 rounded text-xs font-semibold bg-destructive-foreground text-destructive hover:opacity-90 transition flex items-center gap-1.5"
            >
              {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
              <ArrowLeft className="w-3 h-3" />
              Voltar ao Painel
            </button>
          </div>
        </div>
      )}

      {!isImpersonating && companyUsers.length > 0 && (
        <div className="sticky top-0 z-50 w-full border-b border-border bg-muted px-4 py-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Modo privilegiado</span>
          <button
            onClick={() => setShowSelector(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold text-foreground bg-background border border-border hover:bg-accent transition"
          >
            <Users className="w-3.5 h-3.5" />
            Simular Usuário
          </button>
        </div>
      )}

      {showSelector && (
        <ImpersonationSelector
          companySlug={companySlug}
          users={companyUsers}
          onClose={() => setShowSelector(false)}
        />
      )}

      {showPermissions && impersonatedUserId && (
        <UserPermissionsModal
          userId={impersonatedUserId}
          userEmail={impersonatedUserEmail || 'Usuário'}
          initialPermissions={impersonatedUserPermissions}
          onClose={() => setShowPermissions(false)}
        />
      )}
    </>
  )
}
