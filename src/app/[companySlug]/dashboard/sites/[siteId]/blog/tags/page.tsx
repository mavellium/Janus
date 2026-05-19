import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import { getBlogTags } from '@/modules/blog/queries/getBlogTags'
import { TagsClient } from '@/components/blog/TagsClient'
import { BlogManagementHeader } from '@/components/blog/BlogManagementHeader'

export const metadata = { title: 'Tags — Janus' }

export default async function SiteBlogTagsPage({
  params,
}: {
  params: Promise<{ companySlug: string; siteId: string }>
}) {
  const { companySlug, siteId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const project = await db.project.findUnique({
    where: { id: siteId, deletedAt: null },
  })
  if (!project) redirect(`/${companySlug}/dashboard/sites/${siteId}/pages`)

  const tags = await getBlogTags(siteId)
  const basePath = `/${companySlug}/dashboard/sites/${siteId}`

  return (
    <div className="p-8 w-full">
      <BlogManagementHeader basePath={`${basePath}/blog`} />
      <TagsClient tags={tags} projectId={siteId} />
    </div>
  )
}
