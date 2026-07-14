'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ExternalLink, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CombinedScoreHeader } from './CombinedScoreHeader'
import { SeoScoreCard } from './SeoScoreCard'
import { SEVERITY_LABELS } from '@/modules/seo/domain/seoCheck'
import { computeCommonIssues, type PageScanResult } from '@/modules/seo/domain/siteScan'

function scoreBadgeClasses(score: number): string {
  if (score < 50) return 'bg-red-500/10 text-red-500'
  if (score < 80) return 'bg-amber-500/10 text-amber-600'
  return 'bg-emerald-500/10 text-emerald-600'
}

function ScorePill({ label, score }: { label: string; score: number }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold',
        scoreBadgeClasses(score)
      )}
      title={`${label}: ${score}/100`}
    >
      <span className="text-[9px] font-semibold uppercase opacity-70">{label}</span>
      {score}
    </span>
  )
}

export function SiteScanReport({
  seoScore,
  geoScore,
  pages,
}: {
  seoScore: number
  geoScore: number
  pages: PageScanResult[]
}) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const commonIssues = useMemo(() => computeCommonIssues(pages).slice(0, 6), [pages])
  const okPages = pages.filter((page) => page.ok)
  const failedPages = pages.filter((page) => !page.ok)

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border border-brand-btn-light p-5 sm:p-6">
        <CombinedScoreHeader seoScore={seoScore} geoScore={geoScore} />
        <p className="text-center text-xs text-brand-muted mt-2">
          Média de {okPages.length} {okPages.length === 1 ? 'página analisada' : 'páginas analisadas'}
          {failedPages.length > 0 && ` · ${failedPages.length} inacessível(is)`}
        </p>
      </div>

      {commonIssues.length > 0 && (
        <div className="bg-card rounded-xl border border-brand-btn-light p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-brand-text mb-1 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            Problemas mais recorrentes
          </h2>
          <p className="text-xs text-brand-muted mb-4">
            Corrigir estes itens melhora várias páginas de uma vez.
          </p>
          <ul className="divide-y divide-brand-btn-light/60">
            {commonIssues.map((issue) => (
              <li key={`${issue.scope}-${issue.key}`} className="flex items-center gap-3 py-2.5">
                <span
                  className={cn(
                    'text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 flex-shrink-0',
                    issue.severity === 'critical' && 'bg-red-500/10 text-red-500',
                    issue.severity === 'important' && 'bg-amber-500/10 text-amber-600',
                    issue.severity === 'minor' && 'bg-brand-btn-light text-brand-muted'
                  )}
                >
                  {SEVERITY_LABELS[issue.severity]}
                </span>
                <span className="text-sm text-brand-text flex-1 min-w-0">
                  {issue.label}
                  <span className="text-[10px] uppercase text-brand-muted ml-2">
                    {issue.scope === 'geo' ? 'GEO' : 'SEO'}
                  </span>
                </span>
                <span className="text-xs font-semibold text-brand-muted flex-shrink-0">
                  {issue.failedCount} {issue.failedCount === 1 ? 'página' : 'páginas'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-card rounded-xl border border-brand-btn-light p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-brand-text mb-4">Páginas analisadas</h2>
        <ul className="divide-y divide-brand-btn-light/60">
          {pages.map((page) => {
            const isOpen = expanded === page.url
            const path = page.url.replace(/^https?:\/\/[^/]+/, '') || '/'
            return (
              <li key={page.url}>
                <div className="flex items-center gap-3 py-3">
                  {page.ok ? (
                    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                  ) : (
                    <XCircle size={16} className="text-red-500 flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-brand-text truncate">
                      {page.name ?? path}
                    </p>
                    <p className="text-xs text-brand-muted truncate">{path}</p>
                  </div>

                  {page.ok ? (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <ScorePill label="SEO" score={page.seoScore} />
                      <ScorePill label="GEO" score={page.geoScore} />
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : page.url)}
                        className="p-1.5 rounded-lg text-brand-muted hover:bg-brand-btn-light/50 transition"
                        aria-label={isOpen ? 'Recolher detalhes' : 'Ver detalhes'}
                      >
                        <ChevronDown
                          size={16}
                          className={cn('transition-transform', isOpen && 'rotate-180')}
                        />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-red-500 flex-shrink-0">{page.error}</span>
                  )}
                </div>

                {page.ok && isOpen && (
                  <div className="pb-4 pl-7 grid gap-6 lg:grid-cols-2">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                          SEO
                        </h3>
                        <a
                          href={page.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-brand-primary hover:text-brand-hover"
                        >
                          Abrir <ExternalLink size={11} />
                        </a>
                      </div>
                      <SeoScoreCard score={page.seoScore} checks={page.seoChecks} expanded />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2">
                        GEO (visibilidade em IA)
                      </h3>
                      <SeoScoreCard score={page.geoScore} checks={page.geoChecks} expanded />
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
