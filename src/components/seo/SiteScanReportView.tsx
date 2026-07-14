import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import { getSiteScan } from '@/modules/seo/queries/getSiteScan'
import { SiteScanButton } from './SiteScanButton'
import { SiteScanReport } from './SiteScanReport'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' })

export async function SiteScanReportView({
  companySlug,
  projectId,
  basePath,
  scanId,
}: {
  companySlug: string
  projectId: string
  basePath: string
  scanId: string
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const company = await db.company.findUnique({
    where: { slug: companySlug, deletedAt: null },
    select: { id: true },
  })
  if (!company) redirect('/login')

  const scan = await getSiteScan(scanId, company.id, projectId)
  if (!scan) notFound()

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-5xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href={`${basePath}/seo`} className="text-brand-primary hover:opacity-80">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-brand-text">Relatório SEO/GEO do site</h1>
          </div>
          <p className="text-sm text-brand-muted flex flex-wrap items-center gap-x-2">
            <a
              href={scan.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-brand-primary hover:text-brand-hover transition-colors"
            >
              {scan.targetUrl.replace(/^https?:\/\//, '')}
              <ExternalLink size={12} />
            </a>
            <span>·</span>
            <span>{dateFormatter.format(scan.createdAt)}</span>
            {scan.userName && (
              <>
                <span>·</span>
                <span>por {scan.userName}</span>
              </>
            )}
          </p>
        </div>
        <SiteScanButton
          projectId={projectId}
          companySlug={companySlug}
          basePath={basePath}
          label="Analisar novamente"
        />
      </div>

      <SiteScanReport
        seoScore={scan.data.seoScore}
        geoScore={scan.data.geoScore}
        pages={scan.data.pages}
      />
    </div>
  )
}
