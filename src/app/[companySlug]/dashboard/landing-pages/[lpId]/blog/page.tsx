import { redirect } from 'next/navigation'

export default async function LpBlogRedirectPage({
  params,
}: {
  params: Promise<{ companySlug: string; lpId: string }>
}) {
  const { companySlug, lpId } = await params
  redirect(`/${companySlug}/dashboard/landing-pages/${lpId}/blog/posts`)
}
