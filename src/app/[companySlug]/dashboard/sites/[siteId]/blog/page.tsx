import { redirect } from 'next/navigation'
import { db } from '@/lib/prisma'

export default async function SiteBlogRedirectPage({
  params,
}: {
  params: Promise<{ companySlug: string; siteId: string }>
}) {
  const { companySlug, siteId } = await params

  // Check if blog is enabled for this project
  const project = await db.project.findUnique({
    where: { id: siteId, deletedAt: null },
    select: { blogEnabled: true },
  })

  if (!project?.blogEnabled) {
    redirect(`/${companySlug}/dashboard/sites/${siteId}/pages`)
  }

  redirect(`/${companySlug}/dashboard/sites/${siteId}/blog/posts`)
}
