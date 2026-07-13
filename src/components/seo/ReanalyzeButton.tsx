'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { analyzeSeoUrl } from '@/modules/seo/actions/analyzeSeoUrl'

interface FormState {
  error?: string
}

export function ReanalyzeButton({
  url,
  companySlug,
}: {
  url: string
  companySlug: string
}) {
  const router = useRouter()

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async () => {
      const response = await analyzeSeoUrl({ url, companySlug })
      if (!response.ok) return { error: response.error }
      router.push(`/${companySlug}/dashboard/seo/${response.data.analysisId}`)
      return {}
    },
    {}
  )

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <button
        type="submit"
        disabled={isPending}
        className="px-3 py-2 rounded-lg text-sm font-semibold transition border border-brand-btn-light text-brand-text hover:bg-brand-btn-light/40 flex items-center gap-2 disabled:opacity-60"
      >
        <RefreshCw size={14} className={cn(isPending && 'animate-spin')} />
        {isPending ? 'Analisando...' : 'Analisar novamente'}
      </button>
      {state.error && !isPending && <p className="text-xs text-red-500">{state.error}</p>}
    </form>
  )
}
