import { unstable_noStore as noStore } from 'next/cache'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getProjectGa4 } from '@/modules/analytics/queries/getProjectGa4'
import { AnalyticsPanel } from '@/components/analytics/AnalyticsPanel'

export const metadata = { title: 'Resultados — Janus' }

export default async function SiteAnalyticsPage({
  params,
}: {
  params: Promise<{ companySlug: string; siteId: string }>
}) {
  noStore()
  const { companySlug, siteId } = await params

  const session = await auth()
  if (!session?.user) redirect('/login')

  const project = await getProjectGa4(siteId, companySlug)
  if (!project) notFound()

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-text">Resultados</h1>
        <p className="text-sm text-brand-muted mt-1">
          Desempenho de {project.name} via Google Analytics
        </p>
      </div>

      <AnalyticsPanel
        companySlug={companySlug}
        propertyId={project.ga4PropertyId}
        projectId={project.id}
        userRole={session.user.role}
      />
    </div>
  )
}
