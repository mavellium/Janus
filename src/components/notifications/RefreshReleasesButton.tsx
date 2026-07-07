'use client'

import { useActionState } from 'react'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { refreshReleases } from '@/modules/notifications/actions/refreshReleases'

export function RefreshReleasesButton() {
  const [, formAction, isPending] = useActionState(() => refreshReleases(), null)

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={isPending}
        className="px-3 py-2 rounded-lg text-sm font-semibold transition border border-brand-btn-light text-brand-text hover:bg-brand-btn-light/40 flex items-center gap-2 disabled:opacity-60"
      >
        <RefreshCw size={14} className={cn(isPending && 'animate-spin')} />
        Atualizar
      </button>
    </form>
  )
}
