import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Gauge } from 'lucide-react'
import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import { cn } from '@/lib/utils'
import { getRecentSeoAnalyses } from '@/modules/seo/queries/getRecentSeoAnalyses'
import { SeoUrlInputForm } from '@/components/seo/SeoUrlInputForm'

export const metadata = { title: 'Análise de SEO — Janus' }

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

function scoreBadgeClasses(score: number): string {
  if (score < 50) return 'bg-red-500/10 text-red-500'
  if (score < 80) return 'bg-amber-500/10 text-amber-600'
  return 'bg-emerald-500/10 text-emerald-600'
}

export default async function SeoAnalysisPage({
  params,
}: {
  params: Promise<{ companySlug: string }>
}) {
  const { companySlug } = await params

  const session = await auth()
  if (!session?.user) redirect('/login')

  const company = await db.company.findUnique({
    where: { slug: companySlug, deletedAt: null },
    select: { id: true },
  })
  if (!company) redirect('/login')

  const history = await getRecentSeoAnalyses(company.id, 20)

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-3xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Gauge className="w-6 h-6 text-brand-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-text">Análise de SEO</h1>
        </div>
        <p className="text-sm text-brand-muted">
          Cole a URL de qualquer site e receba uma pontuação de 0 a 100 com as ações para melhorar.
        </p>
      </div>

      <div className="bg-card rounded-xl border border-brand-btn-light p-5 sm:p-6 mb-6">
        <SeoUrlInputForm companySlug={companySlug} />
      </div>

      {history.length > 0 && (
        <div className="bg-card rounded-xl border border-brand-btn-light p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-brand-text mb-3">Análises recentes</h2>
          <ul className="divide-y divide-brand-btn-light/60">
            {history.map((entry) => (
              <li key={entry.id}>
                <Link
                  href={`/${companySlug}/dashboard/seo/${entry.id}`}
                  className={cn(
                    'flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-lg hover:bg-brand-btn-light/40 transition'
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
                    {dateFormatter.format(entry.createdAt)}
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
