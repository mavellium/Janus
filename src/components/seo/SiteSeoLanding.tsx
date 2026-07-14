import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Gauge } from 'lucide-react'
import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import { cn } from '@/lib/utils'
import { getRecentSiteScans } from '@/modules/seo/queries/getRecentSiteScans'
import { SiteScanButton } from './SiteScanButton'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

function scoreBadgeClasses(score: number): string {
  if (score < 50) return 'bg-red-500/10 text-red-500'
  if (score < 80) return 'bg-amber-500/10 text-amber-600'
  return 'bg-emerald-500/10 text-emerald-600'
}

export async function SiteSeoLanding({
  companySlug,
  projectId,
  basePath,
}: {
  companySlug: string
  projectId: string
  basePath: string
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const company = await db.company.findUnique({
    where: { slug: companySlug, deletedAt: null },
    select: { id: true },
  })
  if (!company) redirect('/login')

  const project = await db.project.findFirst({
    where: { id: projectId, companyId: company.id, deletedAt: null },
    select: { name: true, previewUrl: true },
  })
  if (!project) redirect(`/${companySlug}/dashboard/sites`)

  const scans = await getRecentSiteScans(company.id, projectId, 20)

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
            <Gauge className="w-6 h-6 text-brand-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-brand-text">SEO/GEO do site</h1>
            <p className="text-sm text-brand-muted mt-1 max-w-2xl">
              Analisa todas as páginas de <strong>{project.name}</strong> de uma vez e mostra a
              pontuação de SEO e de prontidão para IAs generativas (GEO), com as ações para melhorar.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-brand-btn-light p-6 sm:p-8 mb-6">
        {project.previewUrl ? (
          <>
            <p className="text-sm text-brand-text mb-4">
              Vamos rastrear as páginas publicadas e o sitemap de{' '}
              <span className="font-medium">{project.previewUrl.replace(/^https?:\/\//, '')}</span>.
            </p>
            <SiteScanButton projectId={projectId} companySlug={companySlug} basePath={basePath} />
          </>
        ) : (
          <p className="text-sm text-brand-muted">
            Configure a <strong>URL pública</strong> deste site nas configurações antes de rodar a
            análise completa.
          </p>
        )}
      </div>

      {scans.length > 0 && (
        <div className="bg-card rounded-xl border border-brand-btn-light p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-brand-text mb-4">Análises recentes</h2>
          <ul className="divide-y divide-brand-btn-light/60">
            {scans.map((scan) => (
              <li key={scan.id}>
                <Link
                  href={`${basePath}/seo/${scan.id}`}
                  className="flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg hover:bg-brand-btn-light/40 transition"
                >
                  <span
                    className={cn(
                      'w-10 text-center text-xs font-bold rounded-full px-1.5 py-1 flex-shrink-0',
                      scoreBadgeClasses(scan.seoScore)
                    )}
                  >
                    {scan.seoScore}
                  </span>
                  <span
                    className={cn(
                      'w-10 text-center text-xs font-bold rounded-full px-1.5 py-1 flex-shrink-0',
                      scoreBadgeClasses(scan.geoScore)
                    )}
                    title="GEO"
                  >
                    {scan.geoScore}
                  </span>
                  <span className="text-sm text-brand-text flex-1 min-w-0 truncate">
                    {scan.pagesScanned} {scan.pagesScanned === 1 ? 'página' : 'páginas'}
                  </span>
                  <span className="text-xs text-brand-muted flex-shrink-0">
                    {dateFormatter.format(scan.createdAt)}
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
