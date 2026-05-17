import { redirect } from 'next/navigation'
import { db } from '@/lib/prisma'

export default async function LpBlogRedirectPage({
  params,
}: {
  params: Promise<{ companySlug: string; lpId: string }>
}) {
  const { companySlug, lpId } = await params

  // Check if blog is enabled for this project
  const project = await db.project.findUnique({
    where: { id: lpId, deletedAt: null },
    select: { blogEnabled: true },
  })

  if (!project?.blogEnabled) {
    redirect(`/${companySlug}/dashboard/landing-pages/${lpId}/pages`)
  }

  redirect(`/${companySlug}/dashboard/landing-pages/${lpId}/blog/posts`)
}
