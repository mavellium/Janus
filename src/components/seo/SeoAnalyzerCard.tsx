import Link from 'next/link'
import { Gauge } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getRecentSeoAnalyses } from '@/modules/seo/queries/getRecentSeoAnalyses'
import { SeoUrlInputForm } from '@/components/seo/SeoUrlInputForm'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

function scoreBadgeClasses(score: number): string {
  if (score < 50) return 'bg-red-500/10 text-red-500'
  if (score < 80) return 'bg-amber-500/10 text-amber-600'
  return 'bg-emerald-500/10 text-emerald-600'
}

export async function SeoAnalyzerCard({
  companyId,
  companySlug,
  ownerId,
}: {
  companyId: string
  companySlug: string
  ownerId?: string
}) {
  const recent = await getRecentSeoAnalyses(companyId, 3, ownerId)

  return (
    <div className="bg-card rounded-xl border border-brand-btn-light p-6">
      <div className="flex items-center gap-2 mb-1">
        <Gauge className="w-5 h-5 text-brand-primary" />
        <h3 className="text-lg font-semibold text-brand-text">Análise SEO/GEO</h3>
      </div>
      <p className="text-sm text-brand-muted mb-4">
        Cole a URL de qualquer site e receba a pontuação de SEO e de prontidão para IAs generativas (GEO), com as ações para melhorar.
      </p>

      <SeoUrlInputForm companySlug={companySlug} />

      {recent.length > 0 && (
        <div className="mt-5 pt-4 border-t border-brand-btn-light">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2">
            Análises recentes
          </h4>
          <ul className="space-y-1.5">
            {recent.map((analysis) => (
              <li key={analysis.id}>
                <Link
                  href={`/${companySlug}/dashboard/seo/${analysis.id}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-1.5 -mx-2 hover:bg-brand-btn-light/40 transition"
                >
                  <span
                    className={cn(
                      'w-9 text-center text-xs font-bold rounded-full px-1.5 py-0.5 flex-shrink-0',
                      scoreBadgeClasses(analysis.score)
                    )}
                  >
                    {analysis.score}
                  </span>
                  <span className="text-sm text-brand-text truncate flex-1">
                    {analysis.targetUrl.replace(/^https?:\/\//, '')}
                  </span>
                  <span className="text-xs text-brand-muted flex-shrink-0">
                    {dateFormatter.format(analysis.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
