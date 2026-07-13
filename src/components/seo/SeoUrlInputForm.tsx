'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Loader2, ArrowRight } from 'lucide-react'
import { analyzeSeoUrl } from '@/modules/seo/actions/analyzeSeoUrl'
import { SeoScoreCard } from '@/components/seo/SeoScoreCard'
import type { SeoAnalysisResult } from '@/modules/seo/domain/seoCheck'

interface FormState {
  error?: string
  analysisId?: string
  result?: SeoAnalysisResult
}

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return trimmed
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`
  return trimmed
}

export function SeoUrlInputForm({ companySlug }: { companySlug: string }) {
  const router = useRouter()

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_previous, formData) => {
      const url = normalizeUrl(String(formData.get('url') ?? ''))
      const response = await analyzeSeoUrl({ url, companySlug })
      if (!response.ok) {
        return { error: response.error }
      }
      router.refresh()
      return { analysisId: response.data.analysisId, result: response.data.result }
    },
    {}
  )

  return (
    <div>
      <form action={formAction} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            name="url"
            required
            disabled={isPending}
            placeholder="www.seusite.com.br"
            className="w-full rounded-lg border border-brand-btn-light bg-card pl-9 pr-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/40 transition-shadow disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand-cta text-white hover:bg-brand-cta-hover transition flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isPending && <Loader2 size={14} className="animate-spin" />}
          {isPending ? 'Analisando...' : 'Analisar'}
        </button>
      </form>

      {isPending && (
        <p className="text-xs text-brand-muted mt-2">
          Analisando seu site... isso pode levar até 10 segundos.
        </p>
      )}

      {state.error && !isPending && (
        <p className="text-xs text-red-500 mt-2">{state.error}</p>
      )}

      {state.result && state.analysisId && !isPending && (
        <div className="mt-4 pt-4 border-t border-brand-btn-light">
          <SeoScoreCard score={state.result.score} checks={state.result.checks} />
          <Link
            href={`/${companySlug}/dashboard/seo/${state.analysisId}`}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary hover:text-brand-hover transition-colors"
          >
            Ver relatório completo
            <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  )
}
