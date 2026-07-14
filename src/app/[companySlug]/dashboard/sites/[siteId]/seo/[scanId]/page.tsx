import { SiteScanReportView } from '@/components/seo/SiteScanReportView'

export const metadata = { title: 'Relatório SEO/GEO do site — Janus' }

export default async function SiteSeoReportPage({
  params,
}: {
  params: Promise<{ companySlug: string; siteId: string; scanId: string }>
}) {
  const { companySlug, siteId, scanId } = await params
  return (
    <SiteScanReportView
      companySlug={companySlug}
      projectId={siteId}
      basePath={`/${companySlug}/dashboard/sites/${siteId}`}
      scanId={scanId}
    />
  )
}
