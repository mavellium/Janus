import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import { getBlogPosts } from '@/modules/blog/queries/getBlogPosts'
import { PostsListClient } from '@/components/blog/PostsListClient'
import { BlogManagementHeader } from '@/components/blog/BlogManagementHeader'

export const metadata = { title: 'Artigos — Janus' }

export default async function SiteBlogPostsPage({
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

  const posts = await getBlogPosts(siteId)
  const basePath = `/${companySlug}/dashboard/sites/${siteId}`

  return (
    <div className="p-8 w-full">
      <BlogManagementHeader basePath={`${basePath}/blog`} />
      <PostsListClient posts={posts} basePath={basePath} projectId={siteId} />
    </div>
  )
}
