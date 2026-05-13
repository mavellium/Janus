import { redirect } from 'next/navigation'

export default async function SiteBlogRedirectPage({
  params,
}: {
  params: Promise<{ companySlug: string; siteId: string }>
}) {
  const { companySlug, siteId } = await params
  redirect(`/${companySlug}/dashboard/sites/${siteId}/blog/posts`)
}
