import { SiteScanReportView } from '@/components/seo/SiteScanReportView'

export const metadata = { title: 'Relatório SEO/GEO da landing page — Janus' }

export default async function LandingPageSeoReportPage({
  params,
}: {
  params: Promise<{ companySlug: string; lpId: string; scanId: string }>
}) {
  const { companySlug, lpId, scanId } = await params
  return (
    <SiteScanReportView
      companySlug={companySlug}
      projectId={lpId}
      basePath={`/${companySlug}/dashboard/landing-pages/${lpId}`}
      scanId={scanId}
    />
  )
}
