import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Gauge } from 'lucide-react'
import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import { cn, formatDateTime } from '@/lib/utils'
import { isPrivilegedRole, getImpersonatedUserId } from '@/lib/auth/permissions'
import { getRecentSeoAnalyses } from '@/modules/seo/queries/getRecentSeoAnalyses'
import { SeoUrlInputForm } from '@/components/seo/SeoUrlInputForm'

export const metadata = { title: 'Análise SEO/GEO — Janus' }

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

  const impersonatedUserId = await getImpersonatedUserId()
  const ownerId = impersonatedUserId
    ? impersonatedUserId
    : isPrivilegedRole(session.user.role)
      ? undefined
      : session.user.id
  const history = await getRecentSeoAnalyses(company.id, 20, ownerId)

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full">
      <div className="mb-8 flex items-start gap-4 release-card-in">
        <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
          <Gauge className="w-6 h-6 text-brand-primary" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-text">Análise SEO/GEO</h1>
          <p className="text-sm text-brand-muted mt-1 max-w-2xl">
            Cole a URL de qualquer site e receba a pontuação de SEO e de prontidão para IAs
            generativas (GEO), com as ações para melhorar.
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-brand-btn-light p-6 sm:p-8 mb-6 release-card-in">
        <SeoUrlInputForm companySlug={companySlug} layout="full" />
      </div>

      {history.length > 0 && (
        <div className="bg-card rounded-xl border border-brand-btn-light p-6 sm:p-8 release-card-in">
          <h2 className="text-lg font-semibold text-brand-text mb-4">Análises recentes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {history.map((entry, index) => (
              <Link
                key={entry.id}
                href={`/${companySlug}/dashboard/seo/${entry.id}`}
                className="release-card-in flex items-center gap-3 rounded-lg border border-brand-btn-light p-3 hover:border-brand-primary/40 hover:shadow-md transition"
                style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
              >
                <span
                  className={cn(
                    'w-11 h-11 flex-shrink-0 flex items-center justify-center text-sm font-bold rounded-full',
                    scoreBadgeClasses(entry.score)
                  )}
                >
                  {entry.score}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-brand-text truncate">
                    {entry.targetUrl.replace(/^https?:\/\//, '')}
                  </p>
                  <p className="text-xs text-brand-muted">{formatDateTime(entry.createdAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
