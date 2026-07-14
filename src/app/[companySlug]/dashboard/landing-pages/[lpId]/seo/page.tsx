import { SiteSeoLanding } from '@/components/seo/SiteSeoLanding'

export const metadata = { title: 'SEO/GEO da landing page — Janus' }

export default async function LandingPageSeoPage({
  params,
}: {
  params: Promise<{ companySlug: string; lpId: string }>
}) {
  const { companySlug, lpId } = await params
  return (
    <SiteSeoLanding
      companySlug={companySlug}
      projectId={lpId}
      basePath={`/${companySlug}/dashboard/landing-pages/${lpId}`}
    />
  )
}
