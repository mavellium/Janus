'use client'

import { useActionState, useEffect, useState } from 'react'
import { Search, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { analyzeSeoUrl } from '@/modules/seo/actions/analyzeSeoUrl'
import { ScoreRing } from '@/components/seo/ScoreRing'
import { SEVERITY_ORDER, type SeoAnalysisResult } from '@/modules/seo/domain/seoCheck'

interface PreviewState {
  error?: string
  result?: SeoAnalysisResult
}

const SCAN_MESSAGES = [
  'Acessando o site...',
  'Lendo a estrutura da página...',
  'Avaliando os sinais de SEO...',
  'Verificando a visibilidade em IAs generativas...',
  'Calculando as pontuações...',
]

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return trimmed
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`
  return trimmed
}

function ScanningState() {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((current) => (current + 1) % SCAN_MESSAGES.length)
    }, 1600)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="onb-card-in mt-5" role="status" aria-live="polite">
      <div className="onb-scan relative overflow-hidden rounded-xl border border-brand-btn-light p-4 space-y-3">
        <div className="h-3 w-2/3 rounded bg-brand-btn-light" />
        <div className="h-3 w-full rounded bg-brand-btn-light" />
        <div className="h-3 w-5/6 rounded bg-brand-btn-light" />
        <div className="flex gap-3 pt-1">
          <div className="h-10 w-10 rounded-full bg-brand-btn-light" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/2 rounded bg-brand-btn-light" />
            <div className="h-3 w-1/3 rounded bg-brand-btn-light" />
          </div>
        </div>
      </div>
      <p className="mt-3 flex items-center gap-2 text-sm text-brand-muted">
        <Sparkles size={14} className="text-brand-primary" />
        {SCAN_MESSAGES[messageIndex]}
      </p>
    </div>
  )
}

function topRecommendations(result: SeoAnalysisResult): string[] {
  const failed = [...result.checks, ...result.geoFoundation.checks]
    .filter((check) => !check.passed && check.maxPoints > 0)
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
  return failed.slice(0, 3).map((check) => check.label)
}

export function SeoGeoPreview({
  companySlug,
  onResult,
}: {
  companySlug: string
  onResult: () => void
}) {
  const [state, formAction, isPending] = useActionState<PreviewState, FormData>(
    async (_previous, formData) => {
      const url = normalizeUrl(String(formData.get('url') ?? ''))
      const response = await analyzeSeoUrl({ url, companySlug })
      if (!response.ok) {
        return { error: response.error }
      }
      return { result: response.data.result }
    },
    {}
  )

  useEffect(() => {
    if (state.result && !isPending) onResult()
  }, [state.result, isPending, onResult])

  if (state.result && !isPending) {
    const recommendations = topRecommendations(state.result)
    return (
      <div className="mt-5">
        <div className="flex items-center justify-center gap-8 sm:gap-12">
          <div className="onb-card-in">
            <ScoreRing score={state.result.score} size={104} label="SEO" />
          </div>
          <div className="onb-card-in" style={{ animationDelay: '150ms' }}>
            <ScoreRing score={state.result.geoFoundation.score} size={104} label="GEO" />
          </div>
        </div>

        {!state.result.contentAccessible && (
          <p className="onb-card-in mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
            O site bloqueou o acesso automatizado (proteção anti-bot). A pontuação considera apenas
            os sinais técnicos acessíveis.
          </p>
        )}

        <div className="mt-5 space-y-2">
          {recommendations.length > 0 ? (
            recommendations.map((label, index) => (
              <div
                key={label}
                className="onb-card-in flex items-center gap-2.5 rounded-lg border border-brand-btn-light px-3 py-2"
                style={{ animationDelay: `${300 + index * 120}ms` }}
              >
                <AlertTriangle size={14} className="flex-shrink-0 text-amber-500" />
                <span className="text-sm text-brand-text">{label}</span>
              </div>
            ))
          ) : (
            <div className="onb-card-in flex items-center gap-2.5 rounded-lg border border-brand-btn-light px-3 py-2">
              <CheckCircle2 size={14} className="flex-shrink-0 text-emerald-500" />
              <span className="text-sm text-brand-text">
                Excelente! Nenhum ponto crítico encontrado.
              </span>
            </div>
          )}
          <p
            className="onb-card-in pt-1 text-xs text-brand-muted"
            style={{ animationDelay: '700ms' }}
          >
            O relatório completo, com todas as verificações e recomendações, fica salvo em Análise
            SEO/GEO.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-5">
      <form action={formAction} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            name="url"
            required
            autoFocus
            disabled={isPending}
            placeholder="www.seusite.com.br"
            className="w-full rounded-lg border border-brand-btn-light bg-card py-2 pl-9 pr-3 text-sm text-brand-text transition-shadow placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/40 disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            'flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition',
            'bg-brand-cta hover:bg-brand-cta-hover disabled:opacity-60'
          )}
        >
          {isPending ? 'Analisando...' : 'Analisar'}
        </button>
      </form>

      {isPending && <ScanningState />}

      {state.error && !isPending && (
        <p className="mt-3 text-sm text-red-500" role="alert">
          {state.error}
        </p>
      )}
    </div>
  )
}
