'use client'

import { useTransition, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, KeyRound } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { toggleViewMode } from '@/modules/auth/actions/toggleViewMode'
import { UserPermissionsModal } from './UserPermissionsModal'
import type { ModuleType } from '@/lib/auth/permissions'

interface Props {
  companyName: string
  companySlug: string
  role: 'ADMIN' | 'DEVELOPER'
  initialSimulating: boolean
  impersonatedUserId?: string | null
  impersonatedUserEmail?: string | null
  impersonatedUserPermissions?: string | string[] | Record<string, Record<string, string[]>>
}

export function ImpersonationBanner({
  companyName,
  companySlug,
  role,
  initialSimulating,
  impersonatedUserId,
  impersonatedUserEmail,
  impersonatedUserPermissions,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)

  console.log('[ImpersonationBanner]', {
    initialSimulating,
    impersonatedUserId,
    impersonatedUserEmail,
    showButton: initialSimulating && impersonatedUserId,
  })

  // Detect current module from pathname
  const currentModule: ModuleType = pathname.includes('/landing-pages') ? 'landingPages' : 'sites'
  const backHref = role === 'ADMIN' ? '/dashboard-admin' : '/dev'

  function handleToggle(checked: boolean) {
    startTransition(async () => {
      const result = await toggleViewMode(checked, companySlug)
      if (result.ok) router.refresh()
    })
  }

  return (
    <>
      <div className="sticky top-0 z-50 w-full bg-destructive text-destructive-foreground px-4 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm font-medium shadow-md">
        <div className="flex items-center gap-2">
          {initialSimulating ? (
            <EyeOff className="w-4 h-4 shrink-0" />
          ) : (
            <Eye className="w-4 h-4 shrink-0" />
          )}
          <span>
            {role === 'ADMIN' ? 'Modo Administrador' : 'Modo Desenvolvedor'}:
            {initialSimulating && impersonatedUserEmail ? (
              <> Visualizando usuário <strong>{impersonatedUserEmail}</strong></>
            ) : (
              <> Visualizando {companyName}</>
            )}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-xs">Simular Visão do Usuário</span>
            <Switch
              checked={initialSimulating}
              onCheckedChange={handleToggle}
              disabled={isPending}
              aria-label="Simular Visão do Usuário"
            />
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          </label>
          {initialSimulating && impersonatedUserId && (
            <button
              onClick={() => setShowPermissionsModal(true)}
              className="p-1.5 rounded text-destructive-foreground hover:bg-destructive-foreground/20 transition"
              title="Gerenciar permissões"
            >
              <KeyRound className="w-4 h-4" />
            </button>
          )}
          <Link
            href={backHref}
            className="underline underline-offset-2 hover:opacity-80 transition text-xs"
          >
            Voltar
          </Link>
        </div>
      </div>

      {showPermissionsModal && impersonatedUserId && (
        <UserPermissionsModal
          userId={impersonatedUserId}
          userEmail={impersonatedUserEmail || 'Usuário'}
          initialPermissions={impersonatedUserPermissions}
          initialModule={currentModule}
          onClose={() => setShowPermissionsModal(false)}
        />
      )}
    </>
  )
}
