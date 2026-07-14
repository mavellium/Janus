import { SiteSeoLanding } from '@/components/seo/SiteSeoLanding'

export const metadata = { title: 'SEO/GEO do site — Janus' }

export default async function SiteSeoPage({
  params,
}: {
  params: Promise<{ companySlug: string; siteId: string }>
}) {
  const { companySlug, siteId } = await params
  return (
    <SiteSeoLanding
      companySlug={companySlug}
      projectId={siteId}
      basePath={`/${companySlug}/dashboard/sites/${siteId}`}
    />
  )
}
