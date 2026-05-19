import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import { getBlogTags } from '@/modules/blog/queries/getBlogTags'
import { TagsClient } from '@/components/blog/TagsClient'
import { BlogManagementHeader } from '@/components/blog/BlogManagementHeader'

export const metadata = { title: 'Tags — Janus' }

export default async function LpBlogTagsPage({
  params,
}: {
  params: Promise<{ companySlug: string; lpId: string }>
}) {
  const { companySlug, lpId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const project = await db.project.findUnique({
    where: { id: lpId, deletedAt: null },
  })
  if (!project) redirect(`/${companySlug}/dashboard/landing-pages/${lpId}/pages`)

  const tags = await getBlogTags(lpId)
  const basePath = `/${companySlug}/dashboard/landing-pages/${lpId}`

  return (
    <div className="p-8 w-full">
      <BlogManagementHeader basePath={`${basePath}/blog`} />
      <TagsClient tags={tags} projectId={lpId} />
    </div>
  )
}
