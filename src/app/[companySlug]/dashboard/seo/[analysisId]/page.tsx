import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import { cn } from '@/lib/utils'
import { getSeoAnalysis } from '@/modules/seo/queries/getSeoAnalysis'
import { getRecentSeoAnalyses } from '@/modules/seo/queries/getRecentSeoAnalyses'
import { SeoScoreCard } from '@/components/seo/SeoScoreCard'
import { ReanalyzeButton } from '@/components/seo/ReanalyzeButton'

export const metadata = { title: 'Relatório de SEO — Janus' }

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' })
const shortDateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

function scoreBadgeClasses(score: number): string {
  if (score < 50) return 'bg-red-500/10 text-red-500'
  if (score < 80) return 'bg-amber-500/10 text-amber-600'
  return 'bg-emerald-500/10 text-emerald-600'
}

export default async function SeoReportPage({
  params,
}: {
  params: Promise<{ companySlug: string; analysisId: string }>
}) {
  const { companySlug, analysisId } = await params

  const session = await auth()
  if (!session?.user) redirect('/login')

  const company = await db.company.findUnique({
    where: { slug: companySlug, deletedAt: null },
    select: { id: true },
  })
  if (!company) redirect('/login')

  const analysis = await getSeoAnalysis(analysisId, company.id)
  if (!analysis) notFound()

  const history = await getRecentSeoAnalyses(company.id, 10)

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-5xl">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href={`/${companySlug}/dashboard`} className="text-brand-primary hover:opacity-80">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-brand-text">Relatório de SEO</h1>
          </div>
          <p className="text-sm text-brand-muted flex flex-wrap items-center gap-x-2">
            <a
              href={analysis.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-brand-primary hover:text-brand-hover transition-colors"
            >
              {analysis.targetUrl.replace(/^https?:\/\//, '')}
              <ExternalLink size={12} />
            </a>
            <span>·</span>
            <span>{dateFormatter.format(analysis.createdAt)}</span>
            {analysis.userName && (
              <>
                <span>·</span>
                <span>por {analysis.userName}</span>
              </>
            )}
          </p>
        </div>
        <ReanalyzeButton url={analysis.targetUrl} companySlug={companySlug} />
      </div>

      <div className="bg-card rounded-xl border border-brand-btn-light p-5 sm:p-6 mb-6">
        <SeoScoreCard score={analysis.score} checks={analysis.checks} expanded />
      </div>

      {history.length > 1 && (
        <div className="bg-card rounded-xl border border-brand-btn-light p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-brand-text mb-3">Histórico de análises</h2>
          <ul className="divide-y divide-brand-btn-light/60">
            {history.map((entry) => (
              <li key={entry.id}>
                <Link
                  href={`/${companySlug}/dashboard/seo/${entry.id}`}
                  className={cn(
                    'flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-lg hover:bg-brand-btn-light/40 transition',
                    entry.id === analysis.id && 'bg-brand-btn-light/30'
                  )}
                >
                  <span
                    className={cn(
                      'w-10 text-center text-xs font-bold rounded-full px-1.5 py-1 flex-shrink-0',
                      scoreBadgeClasses(entry.score)
                    )}
                  >
                    {entry.score}
                  </span>
                  <span className="text-sm text-brand-text truncate flex-1">
                    {entry.targetUrl.replace(/^https?:\/\//, '')}
                  </span>
                  <span className="text-xs text-brand-muted flex-shrink-0">
                    {shortDateFormatter.format(entry.createdAt)}
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
