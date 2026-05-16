'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { toggleViewMode } from '@/modules/auth/actions/toggleViewMode'

interface Props {
  companyName: string
  companySlug: string
  role: 'ADMIN' | 'DEVELOPER'
  initialSimulating: boolean
}

export function ImpersonationBanner({ companyName, companySlug, role, initialSimulating }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const backHref = role === 'ADMIN' ? '/dashboard-admin' : '/dev'

  function handleToggle(checked: boolean) {
    startTransition(async () => {
      const result = await toggleViewMode(checked, companySlug)
      if (result.ok) router.refresh()
    })
  }

  return (
    <div className="sticky top-0 z-50 w-full bg-destructive text-destructive-foreground px-4 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm font-medium shadow-md">
      <div className="flex items-center gap-2">
        {initialSimulating ? (
          <EyeOff className="w-4 h-4 shrink-0" />
        ) : (
          <Eye className="w-4 h-4 shrink-0" />
        )}
        <span>
          {role === 'ADMIN' ? 'Modo Administrador' : 'Modo Desenvolvedor'}: Visualizando {companyName}
          {initialSimulating && ' (Visão do Usuário)'}
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
        <Link
          href={backHref}
          className="underline underline-offset-2 hover:opacity-80 transition text-xs"
        >
          Voltar
        </Link>
      </div>
    </div>
  )
}
