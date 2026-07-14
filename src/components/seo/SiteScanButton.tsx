'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Radar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { analyzeSite } from '@/modules/seo/actions/analyzeSite'

interface ScanState {
  error?: string
  scanId?: string
}

export function SiteScanButton({
  projectId,
  companySlug,
  basePath,
  label = 'Analisar site inteiro',
  className,
}: {
  projectId: string
  companySlug: string
  basePath: string
  label?: string
  className?: string
}) {
  const router = useRouter()

  const [state, formAction, isPending] = useActionState<ScanState, FormData>(async () => {
    const response = await analyzeSite({ projectId, companySlug })
    if (!response.ok) {
      return { error: response.error }
    }
    return { scanId: response.data.scanId }
  }, {})

  useEffect(() => {
    if (state.scanId && !isPending) {
      router.push(`${basePath}/seo/${state.scanId}`)
      router.refresh()
    }
  }, [state.scanId, isPending, basePath, router])

  return (
    <div>
      <form action={formAction}>
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            'px-5 py-2.5 rounded-lg text-sm font-semibold bg-brand-cta text-white hover:bg-brand-cta-hover transition flex items-center justify-center gap-2 disabled:opacity-60',
            className
          )}
        >
          {isPending ? <Loader2 size={15} className="animate-spin" /> : <Radar size={15} />}
          {isPending ? 'Analisando páginas...' : label}
        </button>
      </form>

      {isPending && (
        <p className="text-xs text-brand-muted mt-2">
          Rastreando e analisando todas as páginas do site — isso pode levar até um minuto.
        </p>
      )}

      {state.error && !isPending && <p className="text-xs text-red-500 mt-2">{state.error}</p>}
    </div>
  )
}
