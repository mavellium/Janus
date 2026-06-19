import { unstable_noStore as noStore } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import { CompanyAnalyticsOverview } from '@/components/analytics/CompanyAnalyticsOverview'

export const metadata = { title: 'Resultados — Janus' }

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ companySlug: string }>
}) {
  noStore()
  const { companySlug } = await params

  const session = await auth()
  if (!session?.user) redirect('/login')

  const company = await db.company.findUnique({
    where: { slug: companySlug, deletedAt: null },
    select: { id: true },
  })
  if (!company) redirect('/login')

  const projectsWithGa4 = await db.project.findMany({
    where: {
      companyId: company.id,
      isActive: true,
      deletedAt: null,
      ga4PropertyId: { not: null },
    },
    select: { ga4PropertyId: true },
  })

  const projectPropertyIds = projectsWithGa4
    .map((p) => p.ga4PropertyId)
    .filter((id): id is string => Boolean(id))

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-text">Resultados</h1>
        <p className="text-sm text-brand-muted mt-1">
          Panorama consolidado de todos os projetos via Google Analytics
        </p>
      </div>

      <CompanyAnalyticsOverview projectPropertyIds={projectPropertyIds} />
    </div>
  )
}
